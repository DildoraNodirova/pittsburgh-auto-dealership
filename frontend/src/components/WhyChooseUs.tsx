import { BadgeCheck, PackageCheck, DollarSign, Zap } from "lucide-react";

const points = [
  { icon: BadgeCheck, title: "Certified Mechanics", desc: "Skilled experts you can trust." },
  { icon: PackageCheck, title: "Genuine Parts", desc: "Quality parts for long-lasting performance." },
  { icon: DollarSign, title: "Transparent Pricing", desc: "No hidden charges, no surprises." },
  { icon: Zap, title: "Fast & Reliable Service", desc: "On-time service, every time." },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-ink-2 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="text-center font-display text-3xl text-paper">Why Choose Us</h2>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div key={p.title} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-bordeaux text-paper shadow-[0_0_0_6px_rgba(122,18,41,0.15)]">
                <p.icon size={26} strokeWidth={1.8} />
              </div>
              <h3 className="mt-5 font-display text-lg text-paper">{p.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-steel">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

