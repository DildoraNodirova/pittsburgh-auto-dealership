import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

from . import config  # noqa: F401  (loads .env before DATABASE_URL is read)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dealership.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Columns added after the first version of the app. create_all() does not alter existing
# tables, so we add missing columns here and old dealership.db files keep working.
_NEW_BOOKING_COLUMNS = {
    "payment_status": "VARCHAR(20) DEFAULT 'unpaid'",
    "amount_cents": "INTEGER DEFAULT 0",
    "paid_at": "TIMESTAMP",
    "stripe_session_id": "VARCHAR(255)",
    "email_sent_at": "TIMESTAMP",
    "sms_sent_at": "TIMESTAMP",
}


def ensure_columns() -> None:
    insp = inspect(engine)
    if "bookings" not in insp.get_table_names():
        return
    existing = {c["name"] for c in insp.get_columns("bookings")}
    with engine.begin() as conn:
        for name, ddl in _NEW_BOOKING_COLUMNS.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {name} {ddl}"))
        # old rows were created confirmed and unpaid; keep them as they are
        conn.execute(text("UPDATE bookings SET payment_status='unpaid' WHERE payment_status IS NULL"))
        conn.execute(text("UPDATE bookings SET amount_cents=0 WHERE amount_cents IS NULL"))
