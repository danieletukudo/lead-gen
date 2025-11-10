"""
Example API Client
Demonstrates how to interact with the Lead Generator API
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "https://lead-gen-aes4.onrender.com"
API_VERSION = "v1"


class LeadGeneratorClient:
    """Client for interacting with the Lead Generator API"""
    
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
    
    def health_check(self):
        """Check API health status"""
        response = self.session.get(f"{self.base_url}/health")
        return response.json()
    
    def generate_leads_sync(self, industry: str, number: int, country: str, enable_web_scraping: bool = False):
        """
        Generate leads synchronously (waits for completion)
        
        Args:
            industry: Target industry
            number: Number of companies (1-50)
            country: Target country
            enable_web_scraping: Enable web scraping (slower but more accurate)
        
        Returns:
            API response with lead data
        """
        endpoint = f"{self.base_url}/api/{API_VERSION}/leads/generate"
        
        payload = {
            "industry": industry,
            "number": number,
            "country": country,
            "enable_web_scraping": enable_web_scraping
        }
        
        print(f"🔄 Generating {number} leads for {industry} in {country}...")
        if enable_web_scraping:
            print("⚠️  Web scraping enabled - this may take several minutes")
        
        response = self.session.post(endpoint, json=payload)
        
        if response.status_code == 200:
            print("✅ Leads generated successfully!")
            return response.json()
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.json())
            return None
    
    def generate_leads_async(self, industry: str, number: int, country: str, enable_web_scraping: bool = False):
        """
        Generate leads asynchronously (returns immediately with job ID)
        Recommended for web scraping enabled requests
        
        Returns:
            Job ID and status endpoint
        """
        endpoint = f"{self.base_url}/api/{API_VERSION}/leads/generate-async"
        
        payload = {
            "industry": industry,
            "number": number,
            "country": country,
            "enable_web_scraping": enable_web_scraping
        }
        
        print(f"🚀 Queuing async job for {number} leads...")
        
        response = self.session.post(endpoint, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Job queued: {result['job_id']}")
            return result
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.json())
            return None
    
    def get_job_status(self, job_id: str):
        """Check the status of an async job"""
        endpoint = f"{self.base_url}/api/{API_VERSION}/leads/status/{job_id}"
        
        response = self.session.get(endpoint)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error: {response.status_code}")
            return None
    
    def wait_for_job(self, job_id: str, poll_interval: int = 5, max_wait: int = 600):
        """
        Wait for an async job to complete
        
        Args:
            job_id: Job ID to wait for
            poll_interval: Seconds between status checks
            max_wait: Maximum seconds to wait
        
        Returns:
            Job result or None if timeout/error
        """
        print(f"⏳ Waiting for job {job_id} to complete...")
        
        elapsed = 0
        while elapsed < max_wait:
            status = self.get_job_status(job_id)
            
            if not status:
                return None
            
            current_status = status['status']
            print(f"   Status: {current_status} (elapsed: {elapsed}s)")
            
            if current_status == 'completed':
                print("✅ Job completed!")
                return status.get('result')
            elif current_status == 'failed':
                print(f"❌ Job failed: {status.get('error')}")
                return None
            
            time.sleep(poll_interval)
            elapsed += poll_interval
        
        print("⏰ Timeout waiting for job")
        return None
    
    def export_leads(self, job_id: str, format: str = "json"):
        """Export leads in specified format"""
        endpoint = f"{self.base_url}/api/{API_VERSION}/leads/export/{job_id}"
        
        response = self.session.get(endpoint, params={"format": format})
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error: {response.status_code}")
            return None


def example_1_sync_without_scraping():
    """Example 1: Quick lead generation without web scraping"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Synchronous Generation (No Web Scraping)")
    print("="*60)
    
    client = LeadGeneratorClient()
    
    # Check API health
    health = client.health_check()
    print(f"API Status: {health['status']}")
    
    # Generate leads
    result = client.generate_leads_sync(
        industry="technology",
        number=5,
        country="USA",
        enable_web_scraping=False
    )
    
    if result:
        companies = result['data']['companies']
        print(f"\n📊 Generated {len(companies)} companies:")
        for i, company in enumerate(companies[:3], 1):  # Show first 3
            print(f"\n{i}. {company['company_name']}")
            print(f"   Website: {company.get('website_url')}")
            print(f"   Location: {company.get('headquarters_location')}")


def example_2_async_with_scraping():
    """Example 2: Async generation with web scraping"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Async Generation (With Web Scraping)")
    print("="*60)
    
    client = LeadGeneratorClient()
    
    # Queue async job
    job_info = client.generate_leads_async(
        industry="health insurance",
        number=3,
        country="USA",
        enable_web_scraping=True
    )
    
    if job_info:
        job_id = job_info['job_id']
        
        # Wait for completion
        result = client.wait_for_job(job_id, poll_interval=3)
        
        if result:
            companies = result['companies']
            print(f"\n📊 Generated {len(companies)} companies with web scraping:")
            
            for i, company in enumerate(companies, 1):
                print(f"\n{i}. {company['company_name']}")
                print(f"   Email: {company.get('contact_email', 'Not found')}")
                print(f"   Additional Emails: {company.get('additional_emails', [])}")
                
                if company.get('social_media'):
                    print(f"   Social Media (LLM):")
                    for platform, url in company['social_media'].items():
                        if url:
                            print(f"     - {platform}: {url}")
                
                if company.get('social_media_scraped'):
                    print(f"   Social Media (Scraped):")
                    for platform, url in company['social_media_scraped'].items():
                        if url:
                            print(f"     - {platform}: {url}")


def example_3_save_to_file():
    """Example 3: Generate leads and save to file"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Generate and Save to File")
    print("="*60)
    
    client = LeadGeneratorClient()
    
    result = client.generate_leads_sync(
        industry="finance",
        number=5,
        country="UK",
        enable_web_scraping=False
    )
    
    if result:
        # Save to file
        filename = "leads_export.json"
        with open(filename, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"✅ Leads saved to {filename}")
        print(f"📊 Total companies: {len(result['data']['companies'])}")


# Run examples
if __name__ == "__main__":
    print("🚀 Lead Generator API Client Examples")
    print("Make sure the API server is running: python api.py")
    print()
    
    try:
        # Example 1: Quick generation without scraping
        example_1_sync_without_scraping()
        
        # Example 2: Async with web scraping (uncomment to run - takes longer)
        # example_2_async_with_scraping()
        
        # Example 3: Save to file
        # example_3_save_to_file()
        
        print("\n" + "="*60)
        print("✅ Examples completed!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to API")
        print("Make sure the API server is running: python api.py")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

