import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent
CONFIG = ROOT / "app" / "config.py"
NOTIF = ROOT / "app" / "notifications.py"
ENV_EX = ROOT / ".env.example"
ENV = ROOT / ".env"

OLD_CFG = 'OWNER_EMAIL = _get("OWNER_EMAIL")  # optional: gets a copy of every paid booking'
NEW_CFG = '''# The auto service itself (the shop) is told about every new booking and every payment:
OWNER_EMAIL = _get("OWNER_EMAIL")   # shop email
OWNER_PHONE = _get("OWNER_PHONE")   # shop mobile number for SMS, e.g. +17247800707
OWNER_NOTIFY_ON_BOOKING = _get("OWNER_NOTIFY_ON_BOOKING", "true").lower() not in ("0", "false", "no", "off")'''

OLD_ENV_EX = "# Optional: you get a copy of every paid booking here\nOWNER_EMAIL=\n"
NEW_ENV_EX = """# The auto service itself gets an email + SMS for every new booking and every received payment
# ("PAYMENT RECEIVED $89.00 for BK-00002 - please check the card").
OWNER_EMAIL=
OWNER_PHONE=
# true = also notify when a booking is made (before payment); false = only when payment is received
OWNER_NOTIFY_ON_BOOKING=true
"""

OWNER_FUNCS = '''
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
    text = (f"{headline}\\n\\nService: {b.service_name}\\nDate: {day}\\nTime: {time_}\\nBooking ID: {ref}\\n"
            f"Customer: {b.customer_name}\\nPhone: {b.customer_phone}\\nEmail: {b.customer_email}\\n"
            f"Notes: {b.notes or '-'}\\n")
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

'''


def read(p):
    return p.read_text(encoding="utf-8-sig")


def write(p, text):
    shutil.copy(p, p.with_name(p.name + ".bak"))
    p.write_text(text, encoding="utf-8", newline="\n")


def fail(msg):
    print("ERROR:", msg)
    print("Nothing was changed in this file. Send this message to Claude.")
    sys.exit(1)


for f in (CONFIG, NOTIF):
    if not f.exists():
        fail(f"{f} not found. Run this script from the backend folder (next to the 'app' folder).")

c = read(CONFIG)
if "OWNER_PHONE" in c:
    print("config.py: already done")
elif OLD_CFG not in c:
    fail("app/config.py does not contain the expected OWNER_EMAIL line.")
else:
    write(CONFIG, c.replace(OLD_CFG, NEW_CFG))
    print("config.py: updated")

n = read(NOTIF)
if "_notify_owner" in n:
    print("notifications.py: already done")
else:
    start = n.find("        if config.OWNER_EMAIL and kind in")
    end = n.find("        db.commit()\n    finally:")
    if start == -1 or end == -1 or "def notify_booking(" not in n:
        fail("app/notifications.py does not look like the version I sent (owner block not found).")
    n = n[:start] + "        _notify_owner(b, kind)\n" + n[end:]
    n = n.replace("\ndef notify_booking(", OWNER_FUNCS + "\ndef notify_booking(", 1)
    write(NOTIF, n)
    print("notifications.py: updated")

if ENV_EX.exists():
    e = read(ENV_EX)
    if "OWNER_PHONE" in e:
        print(".env.example: already done")
    elif OLD_ENV_EX in e:
        write(ENV_EX, e.replace(OLD_ENV_EX, NEW_ENV_EX))
        print(".env.example: updated")

if ENV.exists():
    t = read(ENV)
    add = [ln for ln in ("OWNER_PHONE=", "OWNER_NOTIFY_ON_BOOKING=true") if ln.split("=")[0] not in t]
    if "OWNER_EMAIL" not in t:
        add.insert(0, "OWNER_EMAIL=")
    if add:
        write(ENV, t.rstrip("\n") + "\n" + "\n".join(add) + "\n")
        print(".env: added", ", ".join(a.split("=")[0] for a in add))
    else:
        print(".env: already has the OWNER lines")
else:
    print(".env not found: copy .env.example to .env first (copy .env.example .env)")

print("\nDone. Now open backend\\.env and fill in:")
print("  OWNER_EMAIL=servis emaili")
print("  OWNER_PHONE=+1xxxxxxxxxx   (servis telefoni, + va davlat kodi bilan)")
print("Then restart the backend.")
