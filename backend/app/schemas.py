from datetime import date, time, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, computed_field, field_validator


class AvailabilityResponse(BaseModel):
    date: date
    service_id: str
    duration_minutes: int
    available_slots: list[str]
    closed: bool = False
    reason: str | None = None


class BookingCreate(BaseModel):
    service_id: str
    booking_date: date
    start_time: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    notes: str | None = None

    @field_validator("customer_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name is required.")
        return v.strip()

    @field_validator("customer_phone")
    @classmethod
    def phone_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Phone number is required.")
        return v.strip()


class BookingOut(BaseModel):
    id: int
    service_id: str
    service_name: str
    duration_minutes: int
    booking_date: date
    start_time: time
    customer_name: str
    customer_email: str
    customer_phone: str
    notes: str | None
    status: str
    payment_status: str = "unpaid"
    amount_cents: int = 0
    created_at: datetime

    @computed_field
    @property
    def payment_required(self) -> bool:
        return self.status == "pending_payment"

    model_config = ConfigDict(from_attributes=True)


class CheckoutOut(BaseModel):
    checkout_url: str
