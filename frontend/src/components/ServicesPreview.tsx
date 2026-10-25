import { Link } from "react-router-dom";
import { Droplet, Disc, ScanLine, Snowflake, ArrowRight } from "lucide-react";

const featured = [
  { icon: Droplet, name: "Oil Change", desc: "High quality oil for better performance and engine life.", to: "/book?service=oil-change", image: "service-oil-change" },
  { icon: Disc, name: "Brake Repair", desc: "Safe brakes start with genuine parts and honest work.", to: "/book?service=brake-replacement", image: "service-brake-repair" },
  { icon: ScanLine, name: "Engine Diagnostics", desc: "Advanced scanning for accurate, fast solutions.", to: "/book?service=engine-diagnostics", image: "service-diagnostics" },
  { icon: Snowflake, name: "AC Service", desc: "Stay cool with our expert AC repair and recharge.", to: "/book?service=ac-service", image: "service-ac", ext: "webp" },
];

export default function ServicesPreview() {
  return (
    <section className="bg-ink px-6 py-24 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-paper/10 pb-8">
          <div>
            <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">WHAT WE DO</div>
            <h2 className="mt-2 font-display text-3xl text-paper">Our Services</h2>
          </div>
          <Link to="/services" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-paper hover:text-bordeaux-light">
            View All Services <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((s) => (
            <Link key={s.name} to={s.to} className="group overflow-hidden rounded-sm border border-paper/10 bg-ink-2 transition-colors hover:border-bordeaux-light/40">
              <div className="relative h-36 overflow-hidden bg-ink-3">
                <img
                  src={`/images/${s.image}.${s.ext || "jpg"}`}
                  alt={s.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="absolute -bottom-5 left-5 flex h-11 w-11 items-center justify-center rounded-full border-4 border-ink-2 bg-bordeaux text-paper">
                  <s.icon size={18} strokeWidth={1.8} />
                </div>
              </div>
              <div className="p-6 pt-8">
                <h3 className="font-display text-lg text-paper">{s.name}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-steel">{s.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-bordeaux-light">
                  Learn More <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

