from datetime import datetime, time as time_cls

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Booking
from ..schemas import AvailabilityResponse, BookingCreate, BookingOut, CheckoutOut
from ..services_data import SERVICES
from ..availability import get_available_slots, is_slot_available, is_date_bookable
from ..notifications import notify_booking
from ..payments import create_checkout_url, payment_required

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _get_service_or_404(service_id: str) -> dict:
    service = SERVICES.get(service_id)
    if not service:
        raise HTTPException(status_code=404, detail=f"Unknown service_id: {service_id}")
    return service


@router.get("/availability", response_model=AvailabilityResponse)
def check_availability(
    date: str = Query(..., description="YYYY-MM-DD"),
    service_id: str = Query(...),
    db: Session = Depends(get_db),
):
    service = _get_service_or_404(service_id)
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format.")

    bookable, reason = is_date_bookable(target_date)
    if not bookable:
        return AvailabilityResponse(
            date=target_date, service_id=service_id, duration_minutes=service["duration_minutes"],
            available_slots=[], closed=True, reason=reason,
        )

    slots = get_available_slots(db, target_date, service["duration_minutes"])
    return AvailabilityResponse(
        date=target_date, service_id=service_id, duration_minutes=service["duration_minutes"],
        available_slots=slots, closed=False,
    )


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(payload: BookingCreate, background: BackgroundTasks, db: Session = Depends(get_db)):
    service = _get_service_or_404(payload.service_id)

    try:
        start = datetime.strptime(payload.start_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="start_time must be in HH:MM format.")

    bookable, reason = is_date_bookable(payload.booking_date)
    if not bookable:
        raise HTTPException(status_code=400, detail=reason)

    if not is_slot_available(db, payload.booking_date, start, service["duration_minutes"]):
        raise HTTPException(
            status_code=409,
            detail="This time slot was just booked by someone else. Please choose another time.",
        )

    amount_cents = int(service.get("price", 0)) * 100
    needs_payment = payment_required(amount_cents)

    booking = Booking(
        service_id=payload.service_id,
        service_name=service["name"],
        duration_minutes=service["duration_minutes"],
        booking_date=payload.booking_date,
        start_time=start,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        notes=payload.notes,
        status="pending_payment" if needs_payment else "confirmed",
        payment_status="unpaid",
        amount_cents=amount_cents,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # no payment step -> confirmed right away: email + SMS now.
    # payment step   -> email "complete your payment"; email + SMS "payment received" after paying.
    background.add_task(notify_booking, booking.id, "booking_received" if needs_payment else "booking_confirmed")
    return booking


@router.post("/{booking_id}/checkout", response_model=CheckoutOut)
def start_checkout(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.payment_status == "paid":
        raise HTTPException(status_code=409, detail="This booking is already paid.")
    if booking.status == "cancelled":
        raise HTTPException(status_code=410, detail="This booking expired. Please book again.")
    if not payment_required(booking.amount_cents):
        raise HTTPException(status_code=400, detail="No payment is needed for this booking.")
    url = create_checkout_url(booking)
    db.commit()  # saves stripe_session_id
    return CheckoutOut(checkout_url=url)


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return booking
