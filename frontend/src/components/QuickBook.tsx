import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, Wrench, Calendar, Clock, FileText } from "lucide-react";
import { services } from "../data/services";

function Field({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steel" />
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-sm border border-paper/15 bg-ink py-2.5 pl-10 pr-4 text-[13.5px] text-paper placeholder:text-steel";

export default function QuickBook() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState(services[0].id);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ service: serviceId });
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (name) params.set("name", name);
    if (phone) params.set("phone", phone);
    if (email) params.set("email", email);
    if (notes) params.set("notes", notes);
    navigate(`/book?${params.toString()}`);
  }

  return (
    <section className="bg-ink px-6 py-24 md:px-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">BEFORE &amp; AFTER</div>
          <h2 className="mt-2 font-display text-3xl text-paper">Real Results. Real Satisfaction.</h2>
          <p className="mt-3 max-w-md text-[14px] text-steel">We bring your car back to its best. See the difference our work makes.</p>

          <div className="mt-8 grid grid-cols-2 gap-3 overflow-hidden rounded-sm border border-paper/10">
            <div className="relative flex h-56 flex-col items-center justify-center bg-ink-3">
              <span className="absolute left-3 top-3 z-10 rounded-sm bg-paper/10 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-steel">BEFORE</span>
              <svg width="120" height="56" viewBox="0 0 150 70" fill="none" className="text-paper/10">
                <path d="M8 48 Q16 30 40 28 Q48 14 70 12 Q92 10 104 26 Q128 24 140 40 Q146 44 146 50 L146 54 L8 54 Z" stroke="currentColor" strokeWidth="2" />
                <circle cx="42" cy="54" r="9" stroke="currentColor" strokeWidth="2" fill="#0d0a0b" />
                <circle cx="116" cy="54" r="9" stroke="currentColor" strokeWidth="2" fill="#0d0a0b" />
              </svg>
              <img src="/images/before.avif" alt="Vehicle before service" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div className="relative flex h-56 flex-col items-center justify-center bg-ink-3">
              <span className="absolute left-3 top-3 z-10 rounded-sm bg-bordeaux px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-paper">AFTER</span>
              <svg width="120" height="56" viewBox="0 0 150 70" fill="none" className="text-bordeaux-light/50">
                <path d="M8 48 Q16 30 40 28 Q48 14 70 12 Q92 10 104 26 Q128 24 140 40 Q146 44 146 50 L146 54 L8 54 Z" stroke="currentColor" strokeWidth="2" />
                <circle cx="42" cy="54" r="9" stroke="currentColor" strokeWidth="2" fill="#0d0a0b" />
                <circle cx="116" cy="54" r="9" stroke="currentColor" strokeWidth="2" fill="#0d0a0b" />
              </svg>
              <img src="/images/after.jpg" alt="Vehicle after service" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-paper/10 bg-ink-2 p-7">
          <h3 className="font-display text-xl text-paper">Book Your Appointment</h3>
          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={User}>
              <input required type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </Field>
            <Field icon={Phone}>
              <input required type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </Field>
            <div className="col-span-full">
              <Field icon={Mail}>
                <input required type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <div className="col-span-full">
              <Field icon={Wrench}>
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputClass}>
                  {services.filter((s) => s.id !== "other").map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] text-steel">Preferred Date</label>
              <Field icon={Calendar}>
                <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] text-steel">Preferred Time</label>
              <Field icon={Clock}>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <div className="col-span-full">
              <Field icon={FileText}>
                <textarea placeholder="Additional Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputClass} pt-2.5`} />
              </Field>
            </div>
            <button type="submit" className="col-span-full mt-1 rounded-sm bg-bordeaux px-7 py-3.5 text-[13.5px] font-semibold tracking-wide text-paper transition-colors hover:bg-bordeaux-light">
              Book Now
            </button>
            <p className="col-span-full text-center text-[11.5px] text-steel">
              If your preferred time is available, we will select it for you automatically.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
