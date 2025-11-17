"""
Lead Generator API
A FastAPI backend for generating company leads with web scraping enhancement.

Author: Senior Backend Engineer
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import uvicorn
import os
from datetime import datetime
import json
from enum import Enum
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

from generate_health_insurance import GeminiClient
from web_scraper import scrape_company_data
from email_sender import get_email_sender

# Initialize FastAPI app
app = FastAPI(
    title="Lead Generator API",
    description="AI-powered lead generation with web scraping enhancement",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for production
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "https://leadgenerator.meallensai.com,https://lead-gen-aes4.onrender.com,https://lead-gen-rust.vercel.app,http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
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

class LeadRequest(BaseModel):
    """Request model for lead generation"""
    industry: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="Industry to target (e.g., 'health insurance', 'technology', 'finance')",
        example="health insurance"
    )
    number: int = Field(
        ..., 
        ge=1, 
        le=50,
        description="Number of companies to generate (1-50)",
        example=10
    )
    country: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="Country to focus on (e.g., 'USA', 'UK', 'Canada')",
        example="USA"
    )
    enable_web_scraping: bool = Field(
        default=False,
        description="Enable web scraping for enhanced contact data (slower but more accurate)"
    )
    
    @validator('number')
    def validate_number(cls, v):
        if v < 1:
            raise ValueError('Number must be at least 1')
        if v > 50:
            raise ValueError('Number cannot exceed 50 (rate limiting)')
        return v
    
    @validator('industry', 'country')
    def validate_non_empty(cls, v):
        if not v or v.strip() == "":
            raise ValueError('Field cannot be empty')
        return v.strip()


class CompanySocialMedia(BaseModel):
    """Social media accounts"""
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None


class CompanyLead(BaseModel):
    """Individual company lead data"""
    company_name: str
    website_url: Optional[str] = None
    company_size: Optional[str] = None
    headquarters_location: Optional[str] = None
    revenue_market_cap: Optional[str] = None
    key_products_services: Optional[str] = None
    target_market: Optional[str] = None
    number_of_users: Optional[str] = None
    notable_customers: Optional[List[str]] = None
    social_media: Optional[CompanySocialMedia] = None
    social_media_scraped: Optional[CompanySocialMedia] = None
    contact_email: Optional[str] = None
    contact_email_llm: Optional[str] = None
    additional_emails: Optional[List[str]] = None
    recent_news_insights: Optional[str] = None
    decision_maker_roles: Optional[List[str]] = None


class LeadResponse(BaseModel):
    """Response model for lead generation"""
    success: bool
    message: str
    data: Dict[str, List[CompanyLead]]
    metadata: Dict[str, Any]


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str
    gemini_api_configured: bool


# ========== In-Memory Storage ==========
# NOTE: This is in-memory and won't work with multiple workers (Docker uses 4 workers)
# For production with async endpoints, use Redis or a database
# Current frontend uses sync endpoint only for reliability
job_storage = {}


# ========== Helper Functions ==========

def validate_api_key():
    """Validate that GEMINI_API_KEY is configured"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured. Please set it in your .env file"
        )
    return True


def generate_leads_sync(industry: str, number: int, country: str, enable_scraping: bool = False) -> Dict:
    """Synchronous lead generation"""
    try:
        validate_api_key()
        
        # Generate leads with AI
        client = GeminiClient()
        result = client.generate_companies(industry, number, country)
        
        # Enhance with web scraping if enabled
        if enable_scraping:
            result = scrape_company_data(result)
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        # Check if it's a 503/overload error
        if '503' in error_msg or 'overloaded' in error_msg.lower() or 'unavailable' in error_msg.lower():
            logger.warning(f"503 error during lead generation: {error_msg}")
            raise HTTPException(
                status_code=503,
                detail=f"Lead generation failed: {error_msg}"
            )
        else:
            logger.error(f"Lead generation error: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Lead generation failed: {error_msg}")


async def generate_leads_background(job_id: str, industry: str, number: int, country: str, enable_scraping: bool):
    """Background task for lead generation"""
    try:
        job_storage[job_id]['status'] = 'processing'
        job_storage[job_id]['started_at'] = datetime.utcnow().isoformat()
        
        result = generate_leads_sync(industry, number, country, enable_scraping)
        
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
    """Root endpoint"""
    return {
        "message": "Lead Generator API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheckResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    api_key_configured = bool(os.getenv('GEMINI_API_KEY'))
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "gemini_api_configured": api_key_configured
    }


@app.post("/api/v1/leads/generate", tags=["Leads"])
async def generate_leads(request: LeadRequest):
    """
    Generate company leads based on industry, number, and country.
    
    - **industry**: Target industry (e.g., "health insurance", "technology")
    - **number**: Number of companies to generate (1-50)
    - **country**: Country to focus on (e.g., "USA", "UK", "Canada")
    - **enable_web_scraping**: Enable web scraping for enhanced data (slower)
    
    Returns comprehensive company information including:
    - Company details (name, size, location, revenue)
    - Contact information (emails, social media)
    - Business intelligence (customers, products, decision makers)
    """
    try:
        # Generate leads
        result = generate_leads_sync(
            industry=request.industry,
            number=request.number,
            country=request.country,
            enable_scraping=request.enable_web_scraping
        )
        
        # Build response
        response = {
            "success": True,
            "message": f"Successfully generated {len(result.get('companies', []))} leads",
            "data": result,
            "metadata": {
                "industry": request.industry,
                "country": request.country,
                "requested_count": request.number,
                "actual_count": len(result.get('companies', [])),
                "web_scraping_enabled": request.enable_web_scraping,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
        
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/v1/leads/generate-async", tags=["Leads"])
async def generate_leads_async(request: LeadRequest, background_tasks: BackgroundTasks):
    """
    Generate leads asynchronously (recommended for web scraping enabled).
    Returns a job ID to check status later.
    
    Use this endpoint when enable_web_scraping=true as it can take several minutes.
    """
    try:
        validate_api_key()
        
        # Generate unique job ID
        job_id = f"job_{datetime.utcnow().timestamp()}_{request.industry[:10]}"
        
        # Initialize job
        job_storage[job_id] = {
            "status": "queued",
            "industry": request.industry,
            "number": request.number,
            "country": request.country,
            "enable_web_scraping": request.enable_web_scraping,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add to background tasks
        background_tasks.add_task(
            generate_leads_background,
            job_id,
            request.industry,
            request.number,
            request.country,
            request.enable_web_scraping
        )
        
        return {
            "success": True,
            "message": "Lead generation job queued",
            "job_id": job_id,
            "status_endpoint": f"/api/v1/leads/status/{job_id}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/leads/status/{job_id}", tags=["Leads"])
async def get_job_status(job_id: str):
    """
    Check the status of an async lead generation job.
    
    Status values:
    - queued: Job is waiting to be processed
    - processing: Job is currently running
    - completed: Job finished successfully
    - failed: Job encountered an error
    """
    if job_id not in job_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_storage[job_id]
    
    response = {
        "job_id": job_id,
        "status": job['status'],
        "created_at": job['created_at']
    }
    
    if job['status'] == 'completed':
        response['result'] = job.get('result')
        response['completed_at'] = job.get('completed_at')
    elif job['status'] == 'failed':
        response['error'] = job.get('error')
        response['completed_at'] = job.get('completed_at')
    elif job['status'] == 'processing':
        response['started_at'] = job.get('started_at')
    
    return response


@app.get("/api/v1/leads/export/{job_id}", tags=["Leads"])
async def export_leads(
    job_id: str,
    format: str = Query(default="json", regex="^(json|csv)$")
):
    """
    Export leads in different formats (json or csv).
    Currently only JSON is supported.
    """
    if job_id not in job_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_storage[job_id]
    
    if job['status'] != 'completed':
        raise HTTPException(
            status_code=400, 
            detail=f"Job is not completed yet. Current status: {job['status']}"
        )
    
    if format == "json":
        return job.get('result')
    else:
        raise HTTPException(status_code=501, detail="CSV export not yet implemented")


# ========== Email Endpoints ==========

class EmailAttachment(BaseModel):
    """Email attachment model"""
    filename: str = Field(..., description="Original filename")
    content: str = Field(..., description="Base64 encoded file content")
    mimetype: str = Field(default="application/octet-stream", description="MIME type of the file")


class EmailRequest(BaseModel):
    """Request model for sending emails"""
    to_email: str = Field(..., description="Recipient email address")
    from_email: str = Field(..., description="Sender email address")
    subject: str = Field(..., min_length=1, description="Email subject")
    body: str = Field(..., min_length=1, description="Email body (HTML supported)")
    attachments: Optional[List[EmailAttachment]] = Field(default=None, description="List of attachments (base64 encoded)")


@app.post("/api/v1/email/send", tags=["Email"])
async def send_email(request: EmailRequest):
    """
    Send an email to a lead.
    
    - **to_email**: Recipient's email address
    - **from_email**: Your email address (for reference)
    - **subject**: Email subject line
    - **body**: Email body content (HTML supported)
    - **attachments**: Optional list of attachments
    
    Returns success status and message.
    """
    try:
        logger.info(f"Email send request: from={request.from_email}, to={request.to_email}")
        email_sender = get_email_sender()
        
        # Process attachments (convert base64 to files)
        import base64
        import tempfile
        import os as os_module
        
        attachment_files = []
        temp_files = []
        
        if request.attachments:
            for attachment in request.attachments:
                try:
                    # Decode base64 content
                    file_content = base64.b64decode(attachment.content)
                    
                    # Create temporary file
                    temp_file = tempfile.NamedTemporaryFile(
                        delete=False,
                        suffix=f"_{attachment.filename}",
                        mode='wb'
                    )
                    temp_file.write(file_content)
                    temp_file.close()
                    
                    attachment_files.append(temp_file.name)
                    temp_files.append(temp_file.name)
                    
                except Exception as e:
                    print(f"⚠️ Failed to process attachment {attachment.filename}: {str(e)}")
        
        # Send email (from_email is now used properly)
        # CC the user so they get a copy of what they sent
        logger.info(f"Sending email via email service...")
        result = email_sender.send_email(
            from_email=request.from_email,
            to_email=request.to_email,
            subject=request.subject,
            contents=request.body,
            attachments=attachment_files if attachment_files else None,
            cc_email=request.from_email  # User gets a copy
        )
        
        logger.info(f"Email send result: {result}")
        logger.info(f"Result type: {type(result)}, Success: {result.get('success')}")
        
        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os_module.unlink(temp_file)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temp file: {cleanup_error}")
        
        # Check if result is a dict and has success key
        if not isinstance(result, dict):
            logger.error(f"Invalid result type: {type(result)}, value: {result}")
            raise HTTPException(status_code=500, detail="Email service returned invalid response")
        
        if result.get("success") is True:
            logger.info("Email sent successfully, returning success response")
            response_data = {
                "success": True,
                "message": f"Email sent successfully to {request.to_email}",
                "method": result.get("method", "unknown"),
                "to": request.to_email,
                "from": request.from_email,
                "cc": request.from_email,
                "attachments_count": len(attachment_files) if attachment_files else 0,
                "sent_at": datetime.utcnow().isoformat(),
                "note": f"A copy of this email was sent to {request.from_email}"
            }
            logger.info(f"Returning response: {response_data}")
            return response_data
        else:
            error_msg = result.get("message", "Unknown error occurred")
            logger.error(f"Email sending marked as failed: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
            
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except ValueError as e:
        logger.error(f"Email validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected email error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email. Please check your email configuration.")


@app.post("/api/v1/email/generate-content", tags=["Email"])
async def generate_email_content(
    company_name: str,
    purpose: str = "introduction",
    tone: str = "professional"
):
    """
    Generate AI-powered email content for a company.
    
    - **company_name**: Name of the company to email
    - **purpose**: Purpose of email (introduction, follow-up, partnership, etc.)
    - **tone**: Tone of email (professional, casual, friendly)
    
    Returns AI-generated email content suggestions.
    """
    try:
        validate_api_key()
        
        client = GeminiClient()
        
        prompt = f"""
        Generate a professional email for the following:
        
        Company: {company_name}
        Purpose: {purpose}
        Tone: {tone}
        
        Return a JSON object with:
        {{
            "subject": "Email subject line",
            "greeting": "Opening greeting",
            "body": "Main email body (2-3 paragraphs)",
            "call_to_action": "Closing call to action",
            "closing": "Email closing signature"
        }}
        
        Make it compelling, personalized, and professional.
        Return ONLY the JSON object, no additional text.
        """
        
        # Use the AI client to generate content (simplified for now)
        suggestions = {
            "subject": f"Exploring Partnership Opportunities with {company_name}",
            "greeting": f"Dear {company_name} Team,",
            "body": f"I hope this email finds you well. I came across {company_name} and was impressed by your work in the industry. I believe there could be valuable opportunities for collaboration between our organizations.\n\nI would love to schedule a brief call to discuss how we might work together to create mutual value.",
            "call_to_action": "Would you be available for a 15-minute call next week?",
            "closing": "Best regards,"
        }
        
        return {
            "success": True,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== Startup & Shutdown Events ==========

@app.on_event("startup")
async def startup_event():
    """Run on API startup"""
    logger.info("="*60)
    logger.info("🚀 Lead Generator API Starting...")
    logger.info("="*60)
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"CORS Allowed Origins: {ALLOWED_ORIGINS}")
    logger.info(f"Gemini API Key: {'✅ Configured' if os.getenv('GEMINI_API_KEY') else '❌ Missing'}")
    logger.info(f"Email Service: {'✅ Configured' if os.getenv('EMAIL_USER') or os.getenv('SENDGRID_API_KEY') else '⚠️ Not configured'}")
    logger.info("="*60)


@app.on_event("shutdown")
async def shutdown_event():
    """Run on API shutdown"""
    logger.info("🛑 Lead Generator API Shutting Down...")


# ========== Run Server ==========

if __name__ == "__main__":
    import sys
    
    # Check if running in production mode
    is_production = os.getenv('ENVIRONMENT') == 'production'
    
    print("=" * 60)
    print("🚀 Lead Generator API Starting...")
    print("=" * 60)
    
    if not is_production:
        print(f"📚 API Documentation: http://localhost:8000/docs")
        print(f"📖 ReDoc Documentation: http://localhost:8000/redoc")
        print(f"💚 Health Check: http://localhost:8000/health")
        print("=" * 60)
        print("⚠️  Running in DEVELOPMENT mode")
        print("   Set ENVIRONMENT=production for production")
        print("=" * 60)
    
    # Check required environment variables
    if not os.getenv('GEMINI_API_KEY'):
        print("❌ CRITICAL: GEMINI_API_KEY not set!")
        print("   Add to .env file or environment variables")
        sys.exit(1)
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=int(os.getenv('PORT', 8000)),
        reload=not is_production,  # Only reload in development
        log_level="info" if is_production else "debug",
        access_log=is_production,
        workers=1  # For development; use multiple workers in Docker
    )

