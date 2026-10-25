"""All settings come from environment variables (backend/.env). Never commit .env."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _get(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


# --- business info shown in messages -------------------------------------------------
BUSINESS_NAME = _get("BUSINESS_NAME", "Pittsburgh Auto")
BUSINESS_ADDRESS = _get("BUSINESS_ADDRESS", "273 Moon Clinton Rd, Moon Township, PA 15108")
BUSINESS_PHONE = _get("BUSINESS_PHONE", "(724) 780-0707")
# The auto service itself (the shop) is told about every new booking and every payment:
OWNER_EMAIL = _get("OWNER_EMAIL")   # shop email
OWNER_PHONE = _get("OWNER_PHONE")   # shop mobile number for SMS, e.g. +17247800707
OWNER_NOTIFY_ON_BOOKING = _get("OWNER_NOTIFY_ON_BOOKING", "true").lower() not in ("0", "false", "no", "off")

# --- URLs -----------------------------------------------------------------------------
FRONTEND_URL = _get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
API_PUBLIC_URL = _get("API_PUBLIC_URL", "http://localhost:8000").rstrip("/")

# --- email (SMTP) ---------------------------------------------------------------------
SMTP_HOST = _get("SMTP_HOST")
SMTP_PORT = int(_get("SMTP_PORT", "587") or 587)
SMTP_USER = _get("SMTP_USER")
SMTP_PASSWORD = _get("SMTP_PASSWORD")
SMTP_FROM = _get("SMTP_FROM") or SMTP_USER
SMTP_SECURITY = _get("SMTP_SECURITY", "starttls").lower()  # starttls | ssl | none

# --- SMS (Twilio) ---------------------------------------------------------------------
TWILIO_ACCOUNT_SID = _get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = _get("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = _get("TWILIO_FROM_NUMBER")
TWILIO_MESSAGING_SERVICE_SID = _get("TWILIO_MESSAGING_SERVICE_SID")

# --- payments -------------------------------------------------------------------------
# off    -> no payment step, booking is confirmed immediately
# mock   -> built-in TEST payment page (no real money) to try the whole flow
# stripe -> real card payments through Stripe Checkout
PAYMENT_MODE = _get("PAYMENT_MODE", "mock").lower()
STRIPE_SECRET_KEY = _get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = _get("STRIPE_WEBHOOK_SECRET")
PAYMENT_HOLD_MINUTES = int(_get("PAYMENT_HOLD_MINUTES", "30") or 30)


def email_configured() -> bool:
    return bool(SMTP_HOST and SMTP_FROM)


def sms_configured() -> bool:
    return bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and (TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID))
