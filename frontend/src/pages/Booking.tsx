import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { services } from "../data/services";
import { fetchAvailability, createBooking, createCheckout, fetchBooking, BookingApiError, type BookingResult } from "../services/bookingApi";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Booking() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("service") || services[0].id;

  const [serviceId, setServiceId] = useState(preselected);
  const [date, setDate] = useState(searchParams.get("date") || todayIso());
  const [time, setTime] = useState(searchParams.get("time") || "");
  const [slots, setSlots] = useState<string[]>([]);
  const [closed, setClosed] = useState<{ closed: boolean; reason: string | null }>({ closed: false, reason: null });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

  const [name, setName] = useState(searchParams.get("name") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [notes, setNotes] = useState(searchParams.get("notes") || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<BookingResult | null>(null);

  const [returning, setReturning] = useState<boolean>(!!searchParams.get("booking_id"));
  const [pendingBooking, setPendingBooking] = useState<BookingResult | null>(null);

  // Customer comes back from the payment page: /book?booking_id=12&paid=1 (or &cancelled=1).
  // The payment confirmation can take a few seconds to arrive, so we check a few times.
  useEffect(() => {
    const id = Number(searchParams.get("booking_id"));
    if (!id) return;
    const cancelled = searchParams.get("cancelled") === "1";
    let stop = false;
    (async () => {
      for (let i = 0; i < 10 && !stop; i++) {
        try {
          const b = await fetchBooking(id);
          if (b.payment_status === "paid") { setConfirmed(b); break; }
          if (cancelled || i === 9) {
            setPendingBooking(b);
            setError(cancelled
              ? "Payment was cancelled. Your time slot is held for a short while - you can pay now to confirm it."
              : "We have not received your payment yet. Please wait a moment and refresh, or try paying again.");
            break;
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not load your booking.");
          break;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!stop) setReturning(false);
    })();
    return () => { stop = true; };
  }, [searchParams]);

  async function startPayment(bookingId: number) {
    setSubmitting(true);
    try {
      window.location.href = await createCheckout(bookingId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment.");
      setSubmitting(false);
    }
  }

  const service = useMemo(() => services.find((s) => s.id === serviceId)!, [serviceId]);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    setError(null);
    setFetchFailed(false);
    setLoadingSlots(true);
    fetchAvailability(date, serviceId)
      .then((res) => {
        setSlots(res.available_slots);
        setClosed({ closed: res.closed, reason: res.reason });
      })
      .catch((e) => { setError(e.message); setFetchFailed(true); })
      .finally(() => setLoadingSlots(false));
  }, [date, serviceId]);

  const timeStatus: "empty" | "checking" | "available" | "taken" | "closed" | "error" = !time
    ? "empty"
    : fetchFailed
    ? "error"
    : loadingSlots
    ? "checking"
    : closed.closed
    ? "closed"
    : slots.includes(time)
    ? "available"
    : "taken";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!time) {
      setError("Please choose a time.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createBooking({
        service_id: serviceId,
        booking_date: date,
        start_time: time,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        notes: notes || undefined,
      });
      if (result.payment_required) {
        await startPayment(result.id);   // redirects to the payment page
        return;
      }
      setConfirmed(result);
    } catch (e) {
      if (e instanceof BookingApiError && e.status === 409) {
        setError(e.message);
        setLoadingSlots(true);
        fetchAvailability(date, serviceId)
          .then((res) => setSlots(res.available_slots))
          .finally(() => setLoadingSlots(false));
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (returning) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar transparent={false} />
        <div className="mx-auto max-w-[600px] px-6 py-24 text-center text-steel md:px-12">Checking your payment...</div>
        <Footer />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar transparent={false} />
        <div className="mx-auto max-w-[600px] px-6 py-24 text-center md:px-12">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-bordeaux">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5f1ee" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-paper">You're booked.</h1>
          <p className="mt-3 text-steel">
            {confirmed.payment_status === "paid" ? "Payment received. " : ""}
            We sent a confirmation by email and text message to {confirmed.customer_name}.
          </p>

          <div className="mt-8 rounded-sm border border-bordeaux-light/40 bg-bordeaux/10 p-6">
            <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">PLEASE ARRIVE AT</div>
            <div className="mt-2 font-display text-3xl text-paper">
              {new Date(confirmed.booking_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="mt-1 font-display text-4xl text-bordeaux-light">{confirmed.start_time.slice(0, 5)}</div>
          </div>

          <div className="mt-6 rounded-sm border border-paper/10 bg-ink-2 p-6 text-left">
            <div className="flex justify-between border-b border-paper/10 py-3 text-[14px]">
              <span className="text-steel">Service</span>
              <span className="text-paper">{confirmed.service_name}</span>
            </div>
            <div className="flex justify-between py-3 text-[14px]">
              <span className="text-steel">Booking ID</span>
              <span className="text-paper">BK-{String(confirmed.id).padStart(5, "0")}</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar transparent={false} />

      <div className="mx-auto max-w-[700px] px-6 pb-24 pt-16 md:px-12">
        <h1 className="font-display text-4xl text-paper">Book a Service</h1>
        <p className="mt-2 text-[14px] text-steel">Pick a service, date, and time. We'll confirm your spot when you submit.</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-bordeaux-light">SERVICE</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="mt-2 w-full rounded-sm border border-paper/15 bg-ink-2 px-4 py-3 text-[14px] text-paper">
              {services.filter((s) => s.id !== "other").map((s) => (
                <option key={s.id} value={s.id}>{s.name} - ${s.price} ({s.durationMin} min)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-bordeaux-light">DATE</label>
              <input type="date" value={date} min={todayIso()} max={maxDate} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-sm border border-paper/15 bg-ink-2 px-4 py-3 text-[14px] text-paper" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-bordeaux-light">TIME</label>
              <input type="time" step="1800" value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 w-full rounded-sm border border-paper/15 bg-ink-2 px-4 py-3 text-[14px] text-paper" />
              {timeStatus === "checking" && <p className="mt-1.5 text-[12px] text-steel">Checking...</p>}{timeStatus === "error" && <p className="mt-1.5 text-[12px] text-bordeaux-light">Could not reach the server to check availability. Make sure the backend is running, then change the date to retry.</p>}
              {timeStatus === "closed" && <p className="mt-1.5 text-[12px] text-steel">{closed.reason}</p>}
              {timeStatus === "available" && <p className="mt-1.5 text-[12px] text-bordeaux-light">This time is available.</p>}
              {timeStatus === "taken" && <p className="mt-1.5 text-[12px] text-bordeaux-light">This time is reserved. Please choose another.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-bordeaux-light">FULL NAME</label>
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-sm border border-paper/15 bg-ink-2 px-4 py-3 text-[14px] text-paper" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-bordeaux-light">PHONE</label>
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full rounded-sm border border-paper/15 bg-ink-2 px-4 py-3 text-[14px] text-paper" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-bordeaux-light">EMAIL</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-sm border border-paper/15 bg-ink-2 px-4 py-3 text-[14px] text-paper" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-bordeaux-light">NOTES (OPTIONAL)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Tell us anything we should know about your vehicle." className="mt-2 w-full rounded-sm border border-paper/15 bg-ink-2 px-4 py-3 text-[14px] text-paper" />
          </div>

          {error && <p className="rounded-sm border border-bordeaux-light/40 bg-bordeaux/10 px-4 py-3 text-[13px] text-bordeaux-light">{error}</p>}

          {pendingBooking && (
            <button type="button" disabled={submitting} onClick={() => startPayment(pendingBooking.id)} className="w-full rounded-sm border border-bordeaux-light px-7 py-3.5 text-[13.5px] font-semibold tracking-wide text-bordeaux-light transition-colors hover:bg-bordeaux/20 disabled:opacity-60">
              Pay now for {pendingBooking.service_name}
            </button>
          )}

          <button type="submit" disabled={submitting} className="w-full rounded-sm bg-bordeaux px-7 py-3.5 text-[13.5px] font-semibold tracking-wide text-paper transition-colors hover:bg-bordeaux-light disabled:opacity-60">
            {submitting ? "Please wait..." : `Book & pay ${service.name} - $${service.price}`}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

