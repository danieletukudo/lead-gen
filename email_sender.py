"""
Email Sender Service - Gmail via Yagmail
"""

import os
import yagmail
from typing import List, Union
from dotenv import load_dotenv

load_dotenv()


class EmailSender:
    """Gmail email sender using yagmail with Reply-To header"""
    
    def __init__(self):
        self.email_user = os.getenv('EMAIL_USER', '')
        self.email_password = os.getenv('EMAIL_PASSWORD', '')
        
        if not self.email_user or not self.email_password:
            raise ValueError(
                "❌ Email not configured!\n\n"
                "Add these to your .env file:\n"
                "  EMAIL_USER=your@gmail.com\n"
                "  EMAIL_PASSWORD=your_app_password\n\n"
                "To get an app password:\n"
                "  1. Enable 2FA: https://myaccount.google.com/security\n"
                "  2. Create app password: https://myaccount.google.com/apppasswords\n"
            )
        
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '465'))
        
        self.yag = yagmail.SMTP(
            user=self.email_user,
            password=self.email_password,
            host=smtp_server,
            port=smtp_port,
            smtp_starttls=False,
            smtp_ssl=True
        )
        self.method = "gmail"
        print(f"✅ Email configured: {self.email_user} via {smtp_server}:{smtp_port}")
    
    def send_email(
        self,
        from_email: str,
        to_email: Union[str, List[str]],
        subject: str,
        contents: str,
        attachments: List[str] = None,
        cc_email: str = None
    ) -> dict:
        """
        Send email via Gmail.
        
        - Sent FROM your EMAIL_USER account
        - Reply-To set to from_email so replies go to the user
        - CC copy sent to cc_email
        """
        try:
            headers = {'Reply-To': from_email}
            cc_list = [cc_email] if cc_email else None
            
            self.yag.send(
                to=to_email,
                subject=subject,
                contents=contents,
                attachments=attachments,
                headers=headers,
                cc=cc_list
            )
            
            print(f"✅ Email sent to {to_email} (reply-to: {from_email})")
            if cc_email:
                print(f"   CC: {cc_email}")
            
            return {
                "success": True,
                "method": self.method,
                "message": f"Email sent to {to_email}",
                "from": from_email,
                "to": to_email,
                "cc": cc_email
            }
        except Exception as e:
            error_msg = f"Email failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "method": self.method,
                "message": error_msg,
                "from": from_email,
                "to": to_email,
                "cc": cc_email
            }


# Singleton
_email_sender = None

def get_email_sender():
    global _email_sender
    if _email_sender is None:
        _email_sender = EmailSender()
    return _email_sender