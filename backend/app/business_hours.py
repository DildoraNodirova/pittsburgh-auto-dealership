from datetime import time

BUSINESS_HOURS: dict[int, tuple[time, time] | None] = {
    0: (time(8, 0), time(19, 0)),
    1: (time(8, 0), time(19, 0)),
    2: (time(8, 0), time(19, 0)),
    3: (time(8, 0), time(19, 0)),
    4: (time(8, 0), time(19, 0)),
    5: (time(9, 0), time(15, 0)),
    6: None,
}

SLOT_INTERVAL_MINUTES = 30
MAX_BOOKING_DAYS_AHEAD = 30
