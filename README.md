# Lead Generator

A powerful AI-powered lead generation tool that extracts comprehensive company information including contact details and social media accounts.

## Features

- ✅ **AI-Powered Data Generation** - Uses Gemini AI to gather company information
- ✅ **Web Scraping** - Automatically scrapes websites for contact emails and social media links
- ✅ **Comprehensive Data** - Extracts company details, financials, customers, and more
- ✅ **JSON Output** - Easy integration with APIs and databases
- ✅ **Customizable** - Filter by industry, country, and number of companies

## Installation

Install the required dependencies:

```bash
pip install openai python-dotenv beautifulsoup4 requests
```

## Setup

1. Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

2. Get your Gemini API key from: https://aistudio.google.com/app/apikey

## Usage

### Basic Usage (AI-Generated Data Only)

```python
from generate_health_insurance import GeminiClient

client = GeminiClient()
result = client.generate_companies(
    industry="health insurance",
    number=10,
    country="USA"
)
```

### With Web Scraping Enhancement

Edit `generate_health_insurance.py` and set:

```python
use_web_scraper = True
```

Then run:

```bash
python generate_health_insurance.py
```

### Standalone Web Scraper

```python
from web_scraper import WebScraper

scraper = WebScraper()
result = scraper.scrape_website("https://example.com")

print(f"Emails: {result['all_emails']}")
print(f"Social Media: {result['social_media']}")
```

## Output Format

The tool generates JSON data with the following structure:

```json
{
  "companies": [
    {
      "company_name": "Company Name",
      "website_url": "https://example.com",
      "company_size": "10,000+",
      "headquarters_location": "City, Country",
      "revenue_market_cap": "$100B annual revenue",
      "key_products_services": "Description of offerings",
      "target_market": "Target customer segments",
      "number_of_users": "50 million users",
      "notable_customers": ["Customer 1", "Customer 2"],
      "social_media": {
        "linkedin": "https://linkedin.com/company/...",
        "twitter": "https://twitter.com/...",
        "facebook": "https://facebook.com/...",
        "instagram": "https://instagram.com/...",
        "youtube": "https://youtube.com/..."
      },
      "contact_email": "contact@example.com",
      "additional_emails": ["sales@example.com", "info@example.com"],
      "recent_news_insights": "Recent company developments",
      "decision_maker_roles": ["CEO", "CFO", "VP of Sales"]
    }
  ]
}
```

## Configuration

### Main Script Parameters

In `generate_health_insurance.py`:

- `industry` - Industry to target (e.g., "health insurance", "technology", "finance")
- `output_number` - Number of companies to generate (e.g., 10, 20, 50)
- `country` - Country to focus on (e.g., "USA", "UK", "Canada", "Germany")
- `use_web_scraper` - Enable/disable web scraping enhancement (True/False)

### Web Scraper Settings

In `web_scraper.py`, you can adjust:

- `timeout` - Request timeout in seconds (default: 10)
- `contact_keywords` - Keywords to identify contact pages
- Excluded email patterns for filtering

## Features Explained

### 1. AI-Powered Data Generation

The tool uses Gemini AI to generate:
- Company names and website URLs
- Employee count and headquarters
- Revenue and market cap
- Products/services and target markets
- Number of users/customers
- Notable customers/partners
- Social media accounts
- Recent news and insights
- Decision maker roles

### 2. Web Scraping Enhancement

The web scraper:
- **Finds Contact Emails**: Scrapes homepage and contact pages for email addresses
- **Extracts Social Media**: Locates LinkedIn, Twitter, Facebook, Instagram, and YouTube profiles
- **Smart Filtering**: Filters out placeholder emails and focuses on real contacts
- **Prioritization**: Ranks emails based on keywords like "contact", "info", "sales"
- **Respectful Crawling**: Includes delays between requests to avoid overloading servers

### 3. Data Quality

- Returns `null` for unavailable information (not placeholder text)
- Validates URLs and email formats
- Filters out test/example emails
- Prioritizes contact-related emails
- Cross-references multiple pages for accuracy

## Use Cases

- **B2B Sales** - Generate qualified leads for outreach campaigns
- **Market Research** - Analyze competitors and market trends
- **Partnership Development** - Identify potential partners and their contacts
- **CRM Integration** - Import leads directly into your CRM system
- **Investor Research** - Gather company intelligence for investment decisions

## Tips for Best Results

1. **Be Specific**: Use precise industry names (e.g., "SaaS companies" vs "software")
2. **Use Web Scraping**: Enable scraping for the most accurate contact information
3. **Check Multiple Countries**: Run for different regions to expand your reach
4. **Save Results**: Output is automatically saved to `leads.json`
5. **Rate Limiting**: For large batches, add delays to respect website rate limits

## Limitations

- Web scraping depends on website structure and may not find all emails
- Some companies don't publicly list contact emails
- AI-generated data is based on training data and may need verification
- Social media links are only found if publicly listed on websites
- Respects robots.txt and includes user-agent headers

## Legal & Ethical Use

⚠️ **Important**: This tool is for legitimate business purposes only.

- Respect website terms of service
- Comply with GDPR, CAN-SPAM, and other regulations
- Only contact businesses for legitimate purposes
- Always provide opt-out options in communications
- Don't scrape excessively or cause server load

## Output Files

- `leads.json` - Complete lead data in JSON format
- Can be imported into CRMs, databases, or spreadsheets

## Troubleshooting

**"Error parsing JSON"**
- The AI response may need retry due to formatting
- Check your GEMINI_API_KEY is valid

**"Error scraping [URL]"**
- Website may be blocking requests
- Check your internet connection
- Some sites require JavaScript (not supported by basic scraper)

**"No emails found"**
- Many companies don't list public emails
- Try enabling web scraping if not already enabled
- Check the company's contact form instead

## Future Enhancements

- [ ] Add Selenium for JavaScript-heavy sites
- [ ] Export to CSV/Excel formats
- [ ] Direct CRM integration (Salesforce, HubSpot)
- [ ] Phone number extraction
- [ ] Decision maker name extraction from LinkedIn
- [ ] Automated email verification

## License

This project is for educational and business use. Please use responsibly and ethically.

## Support

For issues or questions, please check the code comments or modify as needed for your use case.

# lead-gen
# lead-gen
