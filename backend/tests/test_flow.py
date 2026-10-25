import hashlib, hmac, importlib, json, os, sqlite3, sys, time
from datetime import date, timedelta
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))


def next_weekday(skip=1):
    d = date.today() + timedelta(days=skip)
    while d.weekday() == 6:
        d += timedelta(days=1)
    return d


def load_app(tmp_path, monkeypatch, mode="mock", old_db=False, **extra):
    db = tmp_path / "t.db"
    if old_db:  # a database created by the ORIGINAL version of the app
        con = sqlite3.connect(db)
        con.execute("""CREATE TABLE bookings (id INTEGER PRIMARY KEY, service_id VARCHAR(64), service_name VARCHAR(120),
            duration_minutes INTEGER, booking_date DATE, start_time TIME, customer_name VARCHAR(120),
            customer_email VARCHAR(255), customer_phone VARCHAR(40), notes VARCHAR(1000), status VARCHAR(30),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)""")
        con.execute("INSERT INTO bookings (service_id,service_name,duration_minutes,booking_date,start_time,customer_name,"
                    "customer_email,customer_phone,status) VALUES ('oil-change','Oil Change',45,'2030-01-07','09:00:00','Old','o@x.com','7245550000','confirmed')")
        con.commit(); con.close()
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db}")
    monkeypatch.setenv("PAYMENT_MODE", mode)
    for k in ["SMTP_HOST", "TWILIO_ACCOUNT_SID", "OWNER_EMAIL"]:
        monkeypatch.delenv(k, raising=False)
    for k, v in extra.items():
        monkeypatch.setenv(k, v)
    for m in [m for m in sys.modules if m == "app" or m.startswith("app.")]:
        del sys.modules[m]
    import app.config as cfg
    monkeypatch.setattr(cfg, "BASE_DIR", tmp_path)
    cfg.PAYMENT_MODE = mode
    import app.notifications as n
    n.OUTBOX = tmp_path / "outbox"
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app), n.OUTBOX, cfg


def booking_payload(day, t="10:00", service="oil-change", phone="(412) 555-0123"):
    return {"service_id": service, "booking_date": day.isoformat(), "start_time": t, "customer_name": "Dildora N",
            "customer_email": "cust@example.com", "customer_phone": phone}


def files(box, kind):
    return sorted(p for p in box.glob(f"*_{kind}_*")) if box.exists() else []


def test_payment_flow_sends_email_and_sms(tmp_path, monkeypatch):
    c, box, _ = load_app(tmp_path, monkeypatch, "mock")
    day = next_weekday()
    r = c.post("/api/bookings", json=booking_payload(day))
    assert r.status_code == 201, r.text
    b = r.json()
    assert b["status"] == "pending_payment" and b["payment_required"] is True and b["amount_cents"] == 8900
    assert len(files(box, "email")) == 1 and "complete payment" in files(box, "email")[0].read_text().lower()
    assert files(box, "sms") == []  # no SMS before payment

    url = c.post(f"/api/bookings/{b['id']}/checkout").json()["checkout_url"]
    assert url.endswith(f"/api/payments/mock/{b['id']}")
    assert c.get(f"/api/payments/mock/{b['id']}").status_code == 200

    assert c.post(f"/api/payments/mock/{b['id']}/complete").status_code == 200
    got = c.get(f"/api/bookings/{b['id']}").json()
    assert got["status"] == "confirmed" and got["payment_status"] == "paid"
    emails, sms = files(box, "email"), files(box, "sms")
    assert len(emails) == 2 and len(sms) == 1
    sms_text = sms[0].read_text()
    assert "+14125550123" in sms_text and "Payment received" in sms_text and "Oil Change" in sms_text
    assert "10:00 AM" in sms_text and f"{day:%A, %B} {day.day}" in sms_text
    assert "Payment received" in emails[-1].read_text()

    # paying twice must not send more messages
    c.post(f"/api/payments/mock/{b['id']}/complete")
    assert len(files(box, "email")) == 2 and len(files(box, "sms")) == 1
    # a paid booking cannot be paid again
    assert c.post(f"/api/bookings/{b['id']}/checkout").status_code == 409


def test_slot_held_while_unpaid_and_released_after_expiry(tmp_path, monkeypatch):
    c, _, _ = load_app(tmp_path, monkeypatch, "mock")
    day = next_weekday()
    assert c.post("/api/bookings", json=booking_payload(day)).status_code == 201
    assert c.post("/api/bookings", json=booking_payload(day)).status_code == 409  # held
    # age the pending booking beyond the hold window
    from app.database import SessionLocal
    from app.models import Booking
    from datetime import datetime, timezone
    with SessionLocal() as db:
        b = db.get(Booking, 1)
        b.created_at = datetime.now(timezone.utc) - timedelta(minutes=45)
        db.commit()
    assert c.post("/api/bookings", json=booking_payload(day)).status_code == 201  # free again


def test_payments_off_confirms_immediately(tmp_path, monkeypatch):
    c, box, _ = load_app(tmp_path, monkeypatch, "off")
    r = c.post("/api/bookings", json=booking_payload(next_weekday(), "11:30"))
    assert r.json()["status"] == "confirmed" and r.json()["payment_required"] is False
    assert len(files(box, "email")) == 1 and len(files(box, "sms")) == 1
    assert "11:30 AM" in files(box, "sms")[0].read_text()


def test_invalid_phone_skips_sms_but_sends_email(tmp_path, monkeypatch):
    c, box, _ = load_app(tmp_path, monkeypatch, "off")
    c.post("/api/bookings", json=booking_payload(next_weekday(), phone="12345"))
    assert len(files(box, "email")) == 1 and files(box, "sms") == []


def test_old_database_is_upgraded_and_kept(tmp_path, monkeypatch):
    c, _, _ = load_app(tmp_path, monkeypatch, "mock", old_db=True)
    old = c.get("/api/bookings/1").json()
    assert old["customer_name"] == "Old" and old["status"] == "confirmed" and old["payment_status"] == "unpaid"
    assert c.post("/api/bookings", json=booking_payload(next_weekday())).status_code == 201


def test_stripe_webhook(tmp_path, monkeypatch):
    secret = "whsec_test123"
    c, box, _ = load_app(tmp_path, monkeypatch, "stripe", STRIPE_WEBHOOK_SECRET=secret, STRIPE_SECRET_KEY="sk_test_x")
    b = c.post("/api/bookings", json=booking_payload(next_weekday(), "13:00")).json()

    def post_event(event, key=secret):
        payload = json.dumps(event).encode()
        ts = str(int(time.time()))
        sig = hmac.new(key.encode(), f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
        return c.post("/api/payments/stripe/webhook", content=payload, headers={"stripe-signature": f"t={ts},v1={sig}"})

    ev = {"id": "evt_1", "object": "event", "type": "checkout.session.completed",
          "data": {"object": {"id": "cs_1", "object": "checkout.session", "payment_status": "paid",
                              "metadata": {"booking_id": str(b["id"])}}}}
    assert post_event(ev, key="wrong").status_code == 400          # forged request rejected
    assert c.get(f"/api/bookings/{b['id']}").json()["payment_status"] == "unpaid"
    assert post_event(ev).status_code == 200
    assert c.get(f"/api/bookings/{b['id']}").json()["status"] == "confirmed"
    assert len(files(box, "sms")) == 1 and "1:00 PM" in files(box, "sms")[0].read_text()
    post_event(ev)                                                   # Stripe retries -> no duplicate SMS
    assert len(files(box, "sms")) == 1
