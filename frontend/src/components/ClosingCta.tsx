import Button from "./Button";

export default function ClosingCta() {
  return (
    <section className="relative overflow-hidden bg-ink-2 px-6 py-24 text-center md:px-12">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-[110px]" style={{ background: "radial-gradient(circle, #7a1229, transparent 70%)" }} />
      <div className="relative mx-auto max-w-xl">
        <h2 className="font-display text-3xl text-paper sm:text-4xl">We Keep You Moving.</h2>
        <p className="mt-4 text-[14.5px] text-steel">
          Whatever it takes to get your car back on the road, we are ready. Book online in under a minute.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/book" variant="primary">Book a Service</Button>
        </div>
      </div>
    </section>
  );
}
