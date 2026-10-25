import Button from "./Button";

export default function Hero() {
  return (
    <section className="relative flex items-center overflow-hidden bg-ink pb-12 pt-28 md:pb-16 md:pt-32">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/hero-bg.jpg)", filter: "saturate(1.2) contrast(1.08) brightness(1.05)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink from-10% via-ink/70 via-35% to-transparent to-60%" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink from-0% via-transparent via-30% to-transparent" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full opacity-20 blur-[120px]" style={{ background: "radial-gradient(circle, #7a1229, transparent 70%)" }} />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 md:px-12">
        <div className="max-w-2xl">
          <h1 className="font-display text-[12vw] font-bold leading-[0.95] tracking-tight text-paper sm:text-[58px] md:text-[70px]">
            YOUR CAR.
            <br />
            <span className="text-bordeaux-light">OUR EXPERTISE.</span>
          </h1>

          <p className="mt-7 max-w-md text-[15.5px] leading-relaxed text-steel">
            Professional care, premium results. Keep your car running like new with honest diagnostics and repairs done right the first time.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/book" variant="primary">Book a Service</Button>
            <Button href="/services" variant="secondary">Our Services</Button>
          </div>
        </div>

        <div className="mt-16 flex max-w-2xl flex-wrap items-center gap-x-8 gap-y-5 border-t border-paper/10 pt-6">
          <span className="text-[12.5px] tracking-wide text-steel">FAST SERVICE</span>
          <div className="hidden h-4 w-px bg-paper/10 sm:block" />
          <span className="text-[12.5px] tracking-wide text-steel">FAIR PRICES</span>
          <div className="hidden h-4 w-px bg-paper/10 sm:block" />
          <span className="text-[12.5px] tracking-wide text-steel">QUALITY GUARANTEED</span>
        </div>
      </div>
    </section>
  );
}


