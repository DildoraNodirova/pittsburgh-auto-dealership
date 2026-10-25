"""Send one test email and one test SMS to check your settings.

    python notify_test.py you@example.com +14125550123
"""
import sys

from app import config
from app.notifications import send_email, send_sms

if len(sys.argv) != 3:
    sys.exit("usage: python notify_test.py <email> <phone>")
email, phone = sys.argv[1], sys.argv[2]
print("email mode:", "REAL (SMTP)" if config.email_configured() else "TEST (saved to outbox/)")
print("sms mode:  ", "REAL (Twilio)" if config.sms_configured() else "TEST (saved to outbox/)")
print("email sent:", send_email(email, "Test from " + config.BUSINESS_NAME, "If you read this, email works."))
print("sms sent:  ", send_sms(phone, config.BUSINESS_NAME + ": test message. SMS works."))
