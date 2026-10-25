const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface AvailabilityResponse {
  date: string;
  service_id: string;
  duration_minutes: number;
  available_slots: string[];
  closed: boolean;
  reason: string | null;
}

export interface BookingPayload {
  service_id: string;
  booking_date: string;
  start_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
}

export interface BookingResult {
  id: number;
  service_name: string;
  booking_date: string;
  start_time: string;
  duration_minutes: number;
  customer_name: string;
  status: string;
  payment_status: string;
  amount_cents: number;
  payment_required: boolean;
}

export class BookingApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchAvailability(date: string, serviceId: string): Promise<AvailabilityResponse> {
  const res = await fetch(`${API_BASE}/api/bookings/availability?date=${date}&service_id=${serviceId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new BookingApiError(body.detail || "Could not check availability.", res.status);
  }
  return res.json();
}

export async function createBooking(payload: BookingPayload): Promise<BookingResult> {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new BookingApiError(body.detail || "Could not create booking.", res.status);
  }
  return res.json();
}

export async function createCheckout(bookingId: number): Promise<string> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/checkout`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new BookingApiError(body.detail || "Could not start payment.", res.status);
  }
  const data = await res.json();
  return data.checkout_url as string;
}

export async function fetchBooking(bookingId: number): Promise<BookingResult> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new BookingApiError(body.detail || "Could not load booking.", res.status);
  }
  return res.json();
}
