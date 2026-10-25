"""Payment flow: pending_payment -> (customer pays) -> confirmed + email + SMS."""
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from . import config
from .database import get_db
from .models import Booking
from .notifications import notify_booking

log = logging.getLogger("payments")
router = APIRouter(prefix="/api/payments", tags=["payments"])


def payment_required(amount_cents: int) -> bool:
    return config.PAYMENT_MODE in ("mock", "stripe") and amount_cents > 0


def mark_paid(db: Session, booking: Booking, background: BackgroundTasks | None = None) -> bool:
    """Idempotent. Returns True only the first time (so the customer is notified once)."""
    if booking.payment_status == "paid":
        return False
    if booking.status == "cancelled":
        log.warning("Payment arrived for cancelled booking %s", booking.id)
    booking.payment_status = "paid"
    booking.status = "confirmed"
    booking.paid_at = datetime.now(timezone.utc)
    db.commit()
    if background is not None:
        background.add_task(notify_booking, booking.id, "payment_accepted")
    else:
        notify_booking(booking.id, "payment_accepted")
    return True


def create_checkout_url(booking: Booking) -> str:
    if config.PAYMENT_MODE == "mock":
        return f"{config.API_PUBLIC_URL}/api/payments/mock/{booking.id}"
    if config.PAYMENT_MODE == "stripe":
        import stripe

        if not config.STRIPE_SECRET_KEY:
            raise HTTPException(500, "Stripe is not configured (STRIPE_SECRET_KEY missing).")
        stripe.api_key = config.STRIPE_SECRET_KEY
        session = stripe.checkout.Session.create(
            mode="payment",
            client_reference_id=str(booking.id),
            customer_email=booking.customer_email,
            line_items=[{
                "quantity": 1,
                "price_data": {
                    "currency": "usd",
                    "unit_amount": booking.amount_cents,
                    "product_data": {"name": f"{booking.service_name} - {booking.booking_date} {booking.start_time:%H:%M}"},
                },
            }],
            metadata={"booking_id": str(booking.id)},
            success_url=f"{config.FRONTEND_URL}/book?booking_id={booking.id}&paid=1",
            cancel_url=f"{config.FRONTEND_URL}/book?booking_id={booking.id}&cancelled=1",
        )
        booking.stripe_session_id = session.id
        return session.url
    raise HTTPException(400, "Payments are turned off.")


# ------------------------------------------------------------------ TEST payment page (PAYMENT_MODE=mock)
@router.get("/mock/{booking_id}", response_class=HTMLResponse)
def mock_page(booking_id: int, db: Session = Depends(get_db)):
    if config.PAYMENT_MODE != "mock":
        raise HTTPException(404)
    b = db.get(Booking, booking_id)
    if not b:
        raise HTTPException(404, "Booking not found.")
    amount = f"${b.amount_cents / 100:,.2f}"
    return f"""<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test payment</title>
<body style="font-family:Arial,sans-serif;background:#111;color:#eee;display:grid;place-items:center;min-height:100vh;margin:0">
<div style="max-width:420px;padding:32px;border:1px solid #333;border-radius:6px;background:#1b1b1b">
<div style="background:#b45309;color:#fff;padding:6px 10px;font-size:12px;border-radius:3px;display:inline-block">TEST MODE - no real money</div>
<h2>{b.service_name}</h2><p>{b.booking_date} at {b.start_time:%H:%M}</p><p style="font-size:28px;margin:8px 0">{amount}</p>
<button id="pay" style="width:100%;padding:14px;font-size:15px;background:#7a1f3d;color:#fff;border:0;border-radius:3px;cursor:pointer">Pay {amount} (test)</button>
<p id="msg" style="color:#fca5a5"></p></div>
<script>
document.getElementById('pay').onclick = async () => {{
  const r = await fetch('/api/payments/mock/{b.id}/complete', {{method:'POST'}});
  if (r.ok) location.href = '{config.FRONTEND_URL}/book?booking_id={b.id}&paid=1';
  else document.getElementById('msg').textContent = 'Payment failed.';
}};
</script></body>"""


@router.post("/mock/{booking_id}/complete")
def mock_complete(booking_id: int, background: BackgroundTasks, db: Session = Depends(get_db)):
    if config.PAYMENT_MODE != "mock":
        raise HTTPException(404)
    b = db.get(Booking, booking_id)
    if not b:
        raise HTTPException(404, "Booking not found.")
    mark_paid(db, b, background)
    return {"success": True}


# ------------------------------------------------------------------ Stripe webhook (PAYMENT_MODE=stripe)
@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, background: BackgroundTasks, db: Session = Depends(get_db)):
    if config.PAYMENT_MODE != "stripe" or not config.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(404)
    import stripe

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        stripe.Webhook.construct_event(payload, sig, config.STRIPE_WEBHOOK_SECRET)  # verifies the signature
    except Exception:  # bad payload or bad signature
        raise HTTPException(400, "Invalid webhook signature.")

    event = json.loads(payload)  # plain dict (the verified payload), works with every stripe-python version
    obj = event["data"]["object"]
    booking_id = (obj.get("metadata") or {}).get("booking_id") or obj.get("client_reference_id")
    booking = db.get(Booking, int(booking_id)) if booking_id else None
    if booking:
        if event["type"] in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
            if obj.get("payment_status") == "paid":
                mark_paid(db, booking, background)
        elif event["type"] == "checkout.session.expired" and booking.payment_status != "paid":
            booking.status = "cancelled"
            db.commit()
    return {"received": True}
