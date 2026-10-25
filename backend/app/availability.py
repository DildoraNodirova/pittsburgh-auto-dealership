from datetime import date, time, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import config
from .models import Booking
from .business_hours import BUSINESS_HOURS, SLOT_INTERVAL_MINUTES, MAX_BOOKING_DAYS_AHEAD


def _to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def _to_time(minutes: int) -> time:
    return time(hour=minutes // 60, minute=minutes % 60)


def _intervals_overlap(start1: int, end1: int, start2: int, end2: int) -> bool:
    return start1 < end2 and start2 < end1


def active_bookings(db: Session, target_date: date) -> list[Booking]:
    """Bookings that block a time slot: confirmed ones, plus unpaid ones still inside the hold window."""
    rows = db.scalars(
        select(Booking).where(Booking.booking_date == target_date, Booking.status != "cancelled")
    ).all()
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=config.PAYMENT_HOLD_MINUTES)
    result = []
    for b in rows:
        if b.status == "pending_payment":
            created = b.created_at if b.created_at.tzinfo else b.created_at.replace(tzinfo=timezone.utc)
            if created < cutoff:
                continue  # hold expired, slot is free again
        result.append(b)
    return result


def get_day_hours(target_date: date) -> tuple[time, time] | None:
    return BUSINESS_HOURS.get(target_date.weekday())


def is_date_bookable(target_date: date) -> tuple[bool, str | None]:
    today = date.today()
    if target_date < today:
        return False, "This date is in the past."
    if target_date > today + timedelta(days=MAX_BOOKING_DAYS_AHEAD):
        return False, f"Bookings are only available up to {MAX_BOOKING_DAYS_AHEAD} days in advance."
    if get_day_hours(target_date) is None:
        return False, "We are closed on this day."
    return True, None


def get_available_slots(db: Session, target_date: date, duration_minutes: int) -> list[str]:
    bookable, _ = is_date_bookable(target_date)
    if not bookable:
        return []

    day_hours = get_day_hours(target_date)
    open_time, close_time = day_hours
    open_min, close_min = _to_minutes(open_time), _to_minutes(close_time)

    existing = active_bookings(db, target_date)
    existing_intervals = [
        (_to_minutes(b.start_time), _to_minutes(b.start_time) + b.duration_minutes) for b in existing
    ]

    now = datetime.now()
    min_start_min = open_min
    if target_date == now.date():
        min_start_min = max(open_min, _round_up_to_interval(now.hour * 60 + now.minute))

    slots: list[str] = []
    candidate = min_start_min
    while candidate + duration_minutes <= close_min:
        candidate_end = candidate + duration_minutes
        conflict = any(
            _intervals_overlap(candidate, candidate_end, s, e) for s, e in existing_intervals
        )
        if not conflict:
            slots.append(_to_time(candidate).strftime("%H:%M"))
        candidate += SLOT_INTERVAL_MINUTES

    return slots


def _round_up_to_interval(minutes: int) -> int:
    remainder = minutes % SLOT_INTERVAL_MINUTES
    if remainder == 0:
        return minutes
    return minutes + (SLOT_INTERVAL_MINUTES - remainder)


def is_slot_available(db: Session, target_date: date, start: time, duration_minutes: int) -> bool:
    bookable, _ = is_date_bookable(target_date)
    if not bookable:
        return False

    open_time, close_time = get_day_hours(target_date)
    start_min = _to_minutes(start)
    end_min = start_min + duration_minutes
    if start_min < _to_minutes(open_time) or end_min > _to_minutes(close_time):
        return False

    existing = active_bookings(db, target_date)
    for b in existing:
        b_start = _to_minutes(b.start_time)
        b_end = b_start + b.duration_minutes
        if _intervals_overlap(start_min, end_min, b_start, b_end):
            return False
    return True
