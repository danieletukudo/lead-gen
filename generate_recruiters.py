import os
import json
import time
import logging
from openai import OpenAI, APIError, APIConnectionError, RateLimitError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class GeminiClient:
    def __init__(self):
        # Gemini's OpenAI-compatible endpoint
        base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
        
        self.client = OpenAI(
            api_key=os.getenv('GEMINI_API_KEY'),
            base_url=base_url
        )
    
    def generate_recruiters(self, industry, number, country, max_retries=2, initial_delay=5):
        """
        Generate a list of recruiters with automatic retry logic for 503 errors.
        
        Args:
            industry: Industry/job role to target (e.g., "software engineering", "data science")
            number: Number of recruiters to generate
            country: Country to focus on
            max_retries: Maximum number of retry attempts (default: 5)
            initial_delay: Initial delay in seconds before first retry (default: 2)
        
        Returns:
            JSON response with recruiters data
        
        Raises:
            Exception: If all retries are exhausted
        """
        prompt = f"""
        Find {number} real recruiters or hiring managers who posted job openings for {industry} roles in {country} within the LAST 48 HOURS.

        Only include jobs posted in the last 2 days. Do not include older postings.

        Return ONLY a valid JSON object, no markdown, no extra text:
        {{
            "recruiters": [
                {{
                    "recruiter_name": "Full name of the person who posted the job",
                    "company_name": "Company they are hiring for",
                    "contact_email": "Their professional email (firstname.lastname@company.com format)",
                    "job_posted": "Job title (e.g., Senior Data Scientist)",
                    "job_description": "Brief 1-2 sentence description of the role and key requirements",
                    "time_posted": "When it was posted (e.g., 2 hours ago, Yesterday, 1 day ago)"
                }}
            ]
        }}

        RULES:
        - ONLY jobs posted within the last 48 hours
        - Use real company email domains (firstname.lastname@company.com)
        - If you cannot determine the email, construct it from their name and company domain
        - Keep job_description brief but useful
        Return ONLY the JSON object.
        """
        
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model="gemini-2.5-flash",
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                
                # Success - break out of retry loop
                break
                
            except Exception as e:
                last_exception = e
                error_str = str(e).lower()
                
                # Try to extract status code from various exception attributes
                error_code = None
                if hasattr(e, 'status_code'):
                    error_code = e.status_code
                elif hasattr(e, 'response') and hasattr(e.response, 'status_code'):
                    error_code = e.response.status_code
                elif hasattr(e, 'code'):
                    error_code = e.code
                
                # Check if it's a 503 or overload error
                is_503_error = (
                    error_code == 503 or
                    '503' in str(e) or
                    'overloaded' in error_str or
                    'unavailable' in error_str or
                    'service unavailable' in error_str or
                    'model is overloaded' in error_str
                )
                
                # Check if it's a rate limit error (429)
                try:
                    is_rate_limit_type = isinstance(e, RateLimitError)
                except (NameError, TypeError):
                    is_rate_limit_type = False
                
                is_rate_limit = (
                    error_code == 429 or
                    is_rate_limit_type or
                    'rate limit' in error_str or
                    'too many requests' in error_str
                )
                
                # Check if it's a connection error
                try:
                    is_connection_error_type = isinstance(e, APIConnectionError)
                except (NameError, TypeError):
                    is_connection_error_type = False
                
                is_connection_error = (
                    is_connection_error_type or
                    'connection' in error_str or
                    'timeout' in error_str or
                    'network' in error_str
                )
                
                # Only retry on 503, 429, or connection errors
                if not (is_503_error or is_rate_limit or is_connection_error):
                    logger.error(f"Non-retryable error: {e}")
                    raise Exception(f"Error code: {error_code or 'UNKNOWN'} - {str(e)}")
                
                if attempt == max_retries - 1:
                    logger.error(f"All {max_retries} retry attempts exhausted. Last error: {e}")
                    raise Exception(
                        f"Error code: {error_code or 'UNKNOWN'} - {str(e)}"
                    )
                
                # Calculate exponential backoff delay
                delay = initial_delay * (2 ** attempt)
                delay = min(delay, 60)
                
                logger.warning(
                    f"API error (attempt {attempt + 1}/{max_retries}): {e}. "
                    f"Retrying in {delay} seconds..."
                )
                time.sleep(delay)
        
        if 'response' not in locals():
            raise Exception(f"Failed to get response after {max_retries} attempts")
        
        response_text = response.choices[0].message.content
        
        # Clean up the response if it contains markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parse the JSON response
        try:
            json_response = json.loads(response_text)
            return json_response
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            print(f"Raw response: {response_text}")
            return {"error": "Failed to parse response", "raw_response": response_text}


# Keep backward compatibility - alias the old method name
GeminiClient.generate_companies = GeminiClient.generate_recruiters


if __name__ == '__main__':
    industry = "software engineering"
    output_number = 10
    country = "USA"
    
    client = GeminiClient()
    result = client.generate_recruiters(industry, output_number, country)
    
    print("\n" + "="*50)
    print("RESULTS")
    print("="*50)
    print(json.dumps(result, indent=2))
    
    with open('recruiters.json', 'w') as f:
        json.dump(result, f, indent=2)
    print("\nResults saved to recruiters.json")