"""Email (SMTP) and SMS (Twilio) notifications.

If SMTP / Twilio are not configured, messages are NOT sent. They are printed to the log and
saved as text files in backend/outbox/ so you can test the whole flow without any account.
"""
import base64
import json
import logging
import re
import smtplib
import ssl
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.message import EmailMessage
from html import escape

from . import config
from .database import SessionLocal
from .models import Booking

log = logging.getLogger("notifications")
OUTBOX = config.BASE_DIR / "outbox"


# ------------------------------------------------------------------ helpers
def normalize_phone(raw: str) -> str | None:
    """Return E.164 (+1XXXXXXXXXX for US numbers) or None if it cannot be a valid number."""
    digits = re.sub(r"\D", "", raw or "")
    if raw.strip().startswith("+") and 8 <= len(digits) <= 15:
        return "+" + digits
    if len(digits) == 10:
        return "+1" + digits
    if len(digits) == 11 and digits.startswith("1"):
        return "+" + digits
    return None


def _when(b: Booking) -> tuple[str, str]:
    """('Thursday, October 23', '2:30 PM') - written without %-d so it also works on Windows."""
    d = b.booking_date
    day = f"{d:%A, %B} {d.day}"
    h12 = b.start_time.hour % 12 or 12
    ampm = "AM" if b.start_time.hour < 12 else "PM"
    return day, f"{h12}:{b.start_time.minute:02d} {ampm}"


def booking_ref(b: Booking) -> str:
    return f"BK-{b.id:05d}"


def _money(cents: int) -> str:
    return f"${cents / 100:,.2f}"


def _outbox(kind: str, to: str, content: str) -> None:
    OUTBOX.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    safe = re.sub(r"[^A-Za-z0-9@.+_-]", "_", to)
    (OUTBOX / f"{stamp}_{kind}_{safe}.txt").write_text(content, encoding="utf-8")
    log.info("[%s not configured - saved to outbox] to=%s\n%s", kind.upper(), to, content)


# ------------------------------------------------------------------ transports
def send_email(to: str, subject: str, text: str, html: str | None = None) -> bool:
    """Returns True if the message was really sent (or saved to outbox in dev mode)."""
    if not config.email_configured():
        _outbox("email", to, f"To: {to}\nSubject: {subject}\n\n{text}")
        return True
    msg = EmailMessage()
    msg["From"] = f"{config.BUSINESS_NAME} <{config.SMTP_FROM}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")
    ctx = ssl.create_default_context()
    if config.SMTP_SECURITY == "ssl":
        server = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, context=ctx, timeout=20)
    else:
        server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=20)
    try:
        if config.SMTP_SECURITY == "starttls":
            server.starttls(context=ctx)
        if config.SMTP_USER:
            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
        server.send_message(msg)
    finally:
        try:
            server.quit()
        except Exception:  # noqa: BLE001
            pass
    return True


def send_sms(to: str, body: str) -> bool:
    number = normalize_phone(to)
    if not number:
        log.warning("SMS skipped: invalid phone number %r", to)
        return False
    if not config.sms_configured():
        _outbox("sms", number, f"To: {number}\n\n{body}")
        return True
    url = f"https://api.twilio.com/2010-04-01/Accounts/{config.TWILIO_ACCOUNT_SID}/Messages.json"
    fields = {"To": number, "Body": body}
    if config.TWILIO_MESSAGING_SERVICE_SID:
        fields["MessagingServiceSid"] = config.TWILIO_MESSAGING_SERVICE_SID
    else:
        fields["From"] = config.TWILIO_FROM_NUMBER
    req = urllib.request.Request(url, data=urllib.parse.urlencode(fields).encode(), method="POST")
    token = base64.b64encode(f"{config.TWILIO_ACCOUNT_SID}:{config.TWILIO_AUTH_TOKEN}".encode()).decode()
    req.add_header("Authorization", f"Basic {token}")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            json.loads(resp.read().decode())
        return True
    except urllib.error.HTTPError as e:
        log.error("Twilio error %s: %s", e.code, e.read().decode(errors="replace")[:300])
        return False


# ------------------------------------------------------------------ message content
def _email_html(title: str, lines: list[tuple[str, str]], intro: str) -> str:
    rows = "".join(
        f'<tr><td style="padding:8px 0;color:#6b7280">{escape(k)}</td>'
        f'<td style="padding:8px 0;text-align:right;font-weight:600">{escape(v)}</td></tr>'
        for k, v in lines
    )
    return f"""<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
<h2 style="margin:0 0 8px">{escape(title)}</h2>
<p style="color:#374151">{escape(intro)}</p>
<table style="width:100%;border-top:1px solid #e5e7eb;border-collapse:collapse">{rows}</table>
<p style="color:#6b7280;font-size:13px;margin-top:20px">{escape(config.BUSINESS_NAME)}<br>
{escape(config.BUSINESS_ADDRESS)}<br>{escape(config.BUSINESS_PHONE)}</p></div>"""


def build_messages(b: Booking, kind: str) -> dict:
    day, time_ = _when(b)
    ref = booking_ref(b)
    details = [("Service", b.service_name), ("Date", day), ("Time", time_), ("Booking ID", ref)]
    if b.amount_cents:
        details.insert(1, ("Paid" if b.payment_status == "paid" else "Total", _money(b.amount_cents)))

    if kind == "payment_accepted":
        subject = f"Payment received - {b.service_name} on {day} at {time_}"
        intro = f"Hi {b.customer_name}, we received your payment. Your appointment is confirmed."
        sms = (f"{config.BUSINESS_NAME}: Payment received! Your {b.service_name} is booked for "
               f"{day} at {time_}. Booking {ref}. {config.BUSINESS_ADDRESS}. Questions? {config.BUSINESS_PHONE}")
        title = "Payment received"
    elif kind == "booking_confirmed":  # payments switched off
        subject = f"Booking confirmed - {b.service_name} on {day} at {time_}"
        intro = f"Hi {b.customer_name}, your appointment is confirmed."
        sms = (f"{config.BUSINESS_NAME}: Your {b.service_name} is booked for {day} at {time_}. "
               f"Booking {ref}. {config.BUSINESS_ADDRESS}. Questions? {config.BUSINESS_PHONE}")
        title = "Booking confirmed"
    else:  # booking_received (waiting for payment) - email only
        subject = f"Booking received - complete payment to confirm ({day}, {time_})"
        intro = (f"Hi {b.customer_name}, we are holding your spot for {config.PAYMENT_HOLD_MINUTES} minutes. "
                 "Please complete the payment to confirm your appointment.")
        sms = ""
        title = "Complete your payment"

    text = intro + "\n\n" + "\n".join(f"{k}: {v}" for k, v in details) + \
        f"\n\n{config.BUSINESS_NAME}\n{config.BUSINESS_ADDRESS}\n{config.BUSINESS_PHONE}\n"
    return {"subject": subject, "text": text, "html": _email_html(title, details, intro), "sms": sms}


# ------------------------------------------------------------------ orchestration
def _owner_messages(b: Booking, kind: str) -> tuple[str, str, str] | None:
    """(email subject, email text, sms text) for the auto service itself, or None if nothing to send."""
    day, time_ = _when(b)
    ref = booking_ref(b)
    amount = _money(b.amount_cents) if b.amount_cents else ""
    who = f"{b.customer_name}, {b.customer_phone}"
    what = f"{b.service_name}, {day} at {time_}"
    if kind == "payment_accepted":
        subject = f"PAID {ref}: {what} - please check the card"
        headline = f"PAYMENT RECEIVED {amount} - please check the card / payment account."
        sms = f"{config.BUSINESS_NAME}: PAYMENT RECEIVED {amount} for {ref} - {what}. Customer: {who}. Please check the card."
    elif kind == "booking_received":
        if not config.OWNER_NOTIFY_ON_BOOKING:
            return None
        subject = f"New booking {ref}: {what} (waiting for payment)"
        headline = f"NEW BOOKING - waiting for the customer's payment ({amount})."
        sms = f"{config.BUSINESS_NAME}: NEW BOOKING {ref} - {what}. Customer: {who}. Waiting for payment {amount}."
    else:  # booking_confirmed: online payment is switched off
        subject = f"New booking {ref}: {what}"
        headline = "NEW BOOKING (no online payment)."
        sms = f"{config.BUSINESS_NAME}: NEW BOOKING {ref} - {what}. Customer: {who}."
    text = (f"{headline}\n\nService: {b.service_name}\nDate: {day}\nTime: {time_}\nBooking ID: {ref}\n"
            f"Customer: {b.customer_name}\nPhone: {b.customer_phone}\nEmail: {b.customer_email}\n"
            f"Notes: {b.notes or '-'}\n")
    return subject, text, sms


def _notify_owner(b: Booking, kind: str) -> None:
    if not (config.OWNER_EMAIL or config.OWNER_PHONE):
        return
    msgs = _owner_messages(b, kind)
    if not msgs:
        return
    subject, text, sms = msgs
    if config.OWNER_EMAIL:
        try:
            send_email(config.OWNER_EMAIL, subject, text)
        except Exception:  # noqa: BLE001
            log.exception("Owner email failed for booking %s", b.id)
    if config.OWNER_PHONE:
        try:
            send_sms(config.OWNER_PHONE, sms)
        except Exception:  # noqa: BLE001
            log.exception("Owner SMS failed for booking %s", b.id)


def notify_booking(booking_id: int, kind: str) -> None:
    """Run in a background task. Opens its own DB session and never raises."""
    db = SessionLocal()
    try:
        b = db.get(Booking, booking_id)
        if not b:
            return
        m = build_messages(b, kind)
        now = datetime.now(timezone.utc)

        if b.email_sent_at is None or kind == "booking_received":
            try:
                if send_email(b.customer_email, m["subject"], m["text"], m["html"]) and kind != "booking_received":
                    b.email_sent_at = now
            except Exception:  # noqa: BLE001
                log.exception("Email failed for booking %s", booking_id)

        if m["sms"] and b.sms_sent_at is None:
            try:
                if send_sms(b.customer_phone, m["sms"]):
                    b.sms_sent_at = now
            except Exception:  # noqa: BLE001
                log.exception("SMS failed for booking %s", booking_id)

        _notify_owner(b, kind)
        db.commit()
    finally:
        db.close()
