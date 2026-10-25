import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { business } from "../data/business";

export default function Location() {
  const encodedAddress = encodeURIComponent(business.addressQuery);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  const embedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <div className="min-h-screen bg-ink">
      <Navbar transparent={false} />

      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-16 md:px-12">
        <div className="border-b border-paper/10 pb-8">
          <h1 className="font-display text-4xl text-paper">Visit Us</h1>
          <p className="mt-2 max-w-lg text-[14px] text-steel">
            Stop by, or get directions straight from your phone.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="rounded-sm border border-paper/10 bg-ink-2 p-7">
            <div className="mb-6">
              <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">ADDRESS</div>
              <p className="mt-2 text-[15px] text-paper">{business.address}</p>
            </div>

            <div className="mb-6">
              <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">PHONE</div>
              <a href={`tel:${business.phoneHref}`} className="mt-2 block text-[15px] text-paper hover:text-bordeaux-light">
                {business.phone}
              </a>
            </div>

            <div className="mb-6">
              <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">EMAIL</div>
              <a href={`mailto:${business.email}`} className="mt-2 block text-[15px] text-paper hover:text-bordeaux-light">
                {business.email}
              </a>
            </div>

            <div className="mb-8">
              <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">HOURS</div>
              <div className="mt-2 space-y-1.5">
                {business.hours.map((h) => (
                  <div key={h.day} className="flex justify-between text-[13.5px]">
                    <span className="text-steel">{h.day}</span>
                    <span className="text-paper">{h.open ? `${h.open} - ${h.close}` : "Closed"}</span>
                  </div>
                ))}
              </div>
            </div>

            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="block rounded-sm bg-bordeaux px-7 py-3.5 text-center text-[13.5px] font-semibold tracking-wide text-paper transition-colors hover:bg-bordeaux-light">
              Get Directions
            </a>
          </div>

          <div className="min-h-[420px] overflow-hidden rounded-sm border border-paper/10">
            <iframe
              title="Shop location map"
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "420px" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
