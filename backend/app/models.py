from datetime import datetime, date, time

from sqlalchemy import Integer, String, Date, Time, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    service_id: Mapped[str] = mapped_column(String(64))
    service_name: Mapped[str] = mapped_column(String(120))
    duration_minutes: Mapped[int] = mapped_column(Integer)

    booking_date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[time] = mapped_column(Time)

    customer_name: Mapped[str] = mapped_column(String(120))
    customer_email: Mapped[str] = mapped_column(String(255))
    customer_phone: Mapped[str] = mapped_column(String(40))
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # pending_payment -> confirmed (after payment) | cancelled
    status: Mapped[str] = mapped_column(String(30), default="confirmed")

    # payment
    payment_status: Mapped[str] = mapped_column(String(20), default="unpaid")  # unpaid | paid
    amount_cents: Mapped[int] = mapped_column(Integer, default=0)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # notifications (set once a message was actually delivered, so we never send twice)
    email_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sms_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
