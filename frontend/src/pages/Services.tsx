import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ServiceCard from "../components/ServiceCard";
import { services } from "../data/services";

export default function Services() {
  return (
    <div className="min-h-screen bg-ink">
      <Navbar transparent={false} />

      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-16 md:px-12">
        <div className="border-b border-paper/10 pb-8">
          <h1 className="font-display text-4xl text-paper">Services & Pricing</h1>
          <p className="mt-2 max-w-lg text-[14px] text-steel">
            Straightforward pricing, no surprises. Pick a service below to check availability and book online.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
