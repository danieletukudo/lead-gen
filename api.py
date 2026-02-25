"""
Recruiter Outreach API
A FastAPI backend for finding recruiters and sending them your CV with personalized messages.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import uvicorn
import os
from datetime import datetime
import json
import logging

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log') if os.path.exists('logs') else logging.StreamHandler(),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

from generate_recruiters import GeminiClient
from email_sender import get_email_sender

# Initialize FastAPI app
app = FastAPI(
    title="Recruiter Outreach API",
    description="AI-powered recruiter finder with personalized CV outreach",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "https://recruiteroutreach.meallensai.com,https://recruiter-outreach.onrender.com,https://recruiter-outreach.vercel.app,http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,
)

# ========== Models ==========

class RecruiterRequest(BaseModel):
    """Request model for recruiter search"""
    industry: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="Job role or industry to target",
        example="software engineering"
    )
    number: int = Field(
        ..., ge=1, le=50,
        description="Number of recruiters to find (1-50)",
        example=10
    )
    country: str = Field(
        ..., min_length=2, max_length=100,
        description="Country to focus on",
        example="USA"
    )
    enable_web_scraping: bool = Field(
        default=False,
        description="Enable web scraping for enhanced contact data"
    )
    
    @validator('number')
    def validate_number(cls, v):
        if v < 1:
            raise ValueError('Number must be at least 1')
        if v > 50:
            raise ValueError('Number cannot exceed 50')
        return v
    
    @validator('industry', 'country')
    def validate_non_empty(cls, v):
        if not v or v.strip() == "":
            raise ValueError('Field cannot be empty')
        return v.strip()


class HealthCheckResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    gemini_api_configured: bool


# ========== In-Memory Storage ==========
job_storage = {}


# ========== Helper Functions ==========

def validate_api_key():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured.")
    return True


def personalize_message(template: str, recruiter: dict) -> str:
    """
    Replace placeholders in message template with recruiter data.
    Supports: {{recruiter_name}}, {{company_name}}, {{job_title}}, {{first_name}}
    """
    recruiter_name = recruiter.get('recruiter_name') or 'Hiring Manager'
    company_name = recruiter.get('company_name') or 'your company'
    job_title = recruiter.get('job_title') or 'Recruiter'
    first_name = recruiter_name.split()[0] if recruiter_name and recruiter_name != 'Hiring Manager' else 'there'
    
    result = template
    for placeholder, value in [
        ('{{recruiter_name}}', recruiter_name),
        ('{{company_name}}', company_name),
        ('{{job_title}}', job_title),
        ('{{first_name}}', first_name),
        ('{recruiter_name}', recruiter_name),
        ('{company_name}', company_name),
        ('{job_title}', job_title),
        ('{first_name}', first_name),
    ]:
        result = result.replace(placeholder, value)
    
    return result


def generate_recruiters_sync(industry: str, number: int, country: str, enable_scraping: bool = False) -> Dict:
    """Synchronous recruiter search with retry handling"""
    try:
        validate_api_key()
        logger.info(f"Starting recruiter search: industry={industry}, number={number}, country={country}")
        client = GeminiClient()
        result = client.generate_recruiters(industry, number, country)
        
        if enable_scraping:
            logger.info("Enhancing results with web scraping...")
            try:
                from web_scraper import scrape_company_data
                result = scrape_company_data(result)
            except ImportError:
                logger.warning("web_scraper module not found, skipping scraping")
        
        logger.info(f"Successfully found {len(result.get('recruiters', []))} recruiters")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_lower = error_msg.lower()
        
        if '503' in error_msg or 'overloaded' in error_lower or 'unavailable' in error_lower:
            raise HTTPException(status_code=503, detail=f"AI service overloaded. Please try again in a few minutes. ({error_msg})")
        elif '429' in error_msg or 'rate limit' in error_lower:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a moment.")
        elif 'connection' in error_lower or 'timeout' in error_lower:
            raise HTTPException(status_code=503, detail="Connection error. Please check your internet.")
        else:
            raise HTTPException(status_code=500, detail=f"Recruiter search failed: {error_msg}")


async def generate_recruiters_background(job_id, industry, number, country, enable_scraping):
    try:
        job_storage[job_id]['status'] = 'processing'
        job_storage[job_id]['started_at'] = datetime.utcnow().isoformat()
        result = generate_recruiters_sync(industry, number, country, enable_scraping)
        job_storage[job_id]['status'] = 'completed'
        job_storage[job_id]['completed_at'] = datetime.utcnow().isoformat()
        job_storage[job_id]['result'] = result
    except Exception as e:
        job_storage[job_id]['status'] = 'failed'
        job_storage[job_id]['error'] = str(e)
        job_storage[job_id]['completed_at'] = datetime.utcnow().isoformat()


# ========== API Endpoints ==========

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Recruiter Outreach API", "version": "2.0.0", "docs": "/docs", "health": "/health"}


@app.get("/health", response_model=HealthCheckResponse, tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "gemini_api_configured": bool(os.getenv('GEMINI_API_KEY'))
    }


@app.post("/api/v1/recruiters/find", tags=["Recruiters"])
async def find_recruiters(request: RecruiterRequest):
    """Find recruiters based on industry/role, number, and country."""
    try:
        result = generate_recruiters_sync(
            industry=request.industry,
            number=request.number,
            country=request.country,
            enable_scraping=request.enable_web_scraping
        )
        return {
            "success": True,
            "message": f"Successfully found {len(result.get('recruiters', []))} recruiters",
            "data": result,
            "metadata": {
                "industry": request.industry,
                "country": request.country,
                "requested_count": request.number,
                "actual_count": len(result.get('recruiters', [])),
                "web_scraping_enabled": request.enable_web_scraping,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Backward compat
@app.post("/api/v1/leads/generate", tags=["Recruiters"])
async def generate_leads_compat(request: RecruiterRequest):
    return await find_recruiters(request)


@app.post("/api/v1/recruiters/find-async", tags=["Recruiters"])
async def find_recruiters_async(request: RecruiterRequest, background_tasks: BackgroundTasks):
    try:
        validate_api_key()
        job_id = f"job_{datetime.utcnow().timestamp()}_{request.industry[:10]}"
        job_storage[job_id] = {
            "status": "queued", "industry": request.industry,
            "number": request.number, "country": request.country,
            "enable_web_scraping": request.enable_web_scraping,
            "created_at": datetime.utcnow().isoformat()
        }
        background_tasks.add_task(generate_recruiters_background, job_id, request.industry, request.number, request.country, request.enable_web_scraping)
        return {"success": True, "message": "Recruiter search job queued", "job_id": job_id, "status_endpoint": f"/api/v1/recruiters/status/{job_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/recruiters/status/{job_id}", tags=["Recruiters"])
async def get_job_status(job_id: str):
    if job_id not in job_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_storage[job_id]
    response = {"job_id": job_id, "status": job['status'], "created_at": job['created_at']}
    if job['status'] == 'completed':
        response['result'] = job.get('result')
        response['completed_at'] = job.get('completed_at')
    elif job['status'] == 'failed':
        response['error'] = job.get('error')
        response['completed_at'] = job.get('completed_at')
    elif job['status'] == 'processing':
        response['started_at'] = job.get('started_at')
    return response


# ========== Email Endpoints ==========

class EmailAttachment(BaseModel):
    filename: str = Field(..., description="Original filename")
    content: str = Field(..., description="Base64 encoded file content")
    mimetype: str = Field(default="application/octet-stream", description="MIME type")


class EmailRequest(BaseModel):
    to_email: str = Field(..., description="Recipient email")
    from_email: str = Field(..., description="Sender email")
    subject: str = Field(..., min_length=1, description="Email subject")
    body: str = Field(..., min_length=1, description="Email body (HTML supported)")
    attachments: Optional[List[EmailAttachment]] = Field(default=None)


@app.post("/api/v1/email/send", tags=["Email"])
async def send_email(request: EmailRequest):
    """Send an email to a recruiter with optional CV attachment."""
    try:
        logger.info(f"Email send request: from={request.from_email}, to={request.to_email}")
        email_sender = get_email_sender()
        
        import base64, tempfile, os as os_module
        
        attachment_files = []
        temp_files = []
        
        if request.attachments:
            for att in request.attachments:
                try:
                    file_content = base64.b64decode(att.content)
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{att.filename}", mode='wb')
                    temp_file.write(file_content)
                    temp_file.close()
                    attachment_files.append(temp_file.name)
                    temp_files.append(temp_file.name)
                except Exception as e:
                    logger.warning(f"Failed to process attachment {att.filename}: {e}")
        
        result = email_sender.send_email(
            from_email=request.from_email, to_email=request.to_email,
            subject=request.subject, contents=request.body,
            attachments=attachment_files if attachment_files else None,
            cc_email=request.from_email
        )
        
        for tf in temp_files:
            try: os_module.unlink(tf)
            except: pass
        
        if isinstance(result, dict) and result.get("success"):
            return {
                "success": True, "message": f"Email sent to {request.to_email}",
                "to": request.to_email, "from": request.from_email,
                "attachments_count": len(attachment_files),
                "sent_at": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email.")


class BulkEmailRequest(BaseModel):
    to_emails: List[str] = Field(..., min_length=1)
    from_email: str
    subject: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    attachments: Optional[List[EmailAttachment]] = None
    recruiters: Optional[List[Dict[str, Any]]] = Field(default=None, description="Recruiter data for personalization")


@app.post("/api/v1/email/send-bulk", tags=["Email"])
async def send_bulk_email(request: BulkEmailRequest):
    """
    Send personalized emails to multiple recruiters with CV attached.
    Supports {{recruiter_name}}, {{company_name}}, {{first_name}}, {{job_title}} placeholders.
    """
    import base64, tempfile, os as os_module

    logger.info(f"Bulk email: from={request.from_email}, recipients={len(request.to_emails)}")
    email_sender = get_email_sender()

    attachment_files = []
    temp_files = []
    if request.attachments:
        for att in request.attachments:
            try:
                file_content = base64.b64decode(att.content)
                tf = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{att.filename}", mode='wb')
                tf.write(file_content)
                tf.close()
                attachment_files.append(tf.name)
                temp_files.append(tf.name)
            except Exception as e:
                logger.warning(f"Failed to process attachment {att.filename}: {e}")

    # Build lookup for personalization
    recruiter_lookup = {}
    if request.recruiters:
        for r in request.recruiters:
            email = r.get('contact_email')
            if email:
                recruiter_lookup[email] = r

    successful = 0
    failed = 0
    failed_details = []

    for to_email in request.to_emails:
        try:
            recruiter_data = recruiter_lookup.get(to_email, {})
            personalized_subject = personalize_message(request.subject, recruiter_data)
            personalized_body = personalize_message(request.body, recruiter_data)
            
            result = email_sender.send_email(
                from_email=request.from_email, to_email=to_email,
                subject=personalized_subject, contents=personalized_body,
                attachments=attachment_files if attachment_files else None,
                cc_email=request.from_email
            )
            if isinstance(result, dict) and result.get("success"):
                successful += 1
            else:
                failed += 1
                failed_details.append({"email": to_email, "error": result.get("message", "Unknown") if isinstance(result, dict) else str(result)})
        except Exception as e:
            failed += 1
            failed_details.append({"email": to_email, "error": str(e)})

    for tf in temp_files:
        try: os_module.unlink(tf)
        except: pass

    return {
        "success": successful > 0, "total": len(request.to_emails),
        "successful": successful, "failed": failed,
        "failed_details": failed_details,
        "attachments_count": len(attachment_files),
        "sent_at": datetime.utcnow().isoformat()
    }


# ========== Startup & Shutdown ==========

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Recruiter Outreach API Starting...")
    logger.info(f"Gemini API Key: {'Configured' if os.getenv('GEMINI_API_KEY') else 'Missing'}")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Recruiter Outreach API Shutting Down...")


if __name__ == "__main__":
    import sys
    is_production = os.getenv('ENVIRONMENT') == 'production'
    
    if not os.getenv('GEMINI_API_KEY'):
        print("CRITICAL: GEMINI_API_KEY not set!")
        sys.exit(1)
    
    print("Recruiter Outreach API Starting on http://localhost:8000")
    uvicorn.run("api:app", host="0.0.0.0", port=int(os.getenv('PORT', 8000)),
                reload=not is_production, log_level="info", workers=1)
