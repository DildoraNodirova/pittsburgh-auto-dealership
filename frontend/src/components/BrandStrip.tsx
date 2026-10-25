const brands = ["BMW", "Audi", "Mercedes-Benz", "Toyota", "Honda", "Ford", "Chevrolet"];

export default function BrandStrip() {
  return (
    <section className="border-y border-paper/10 bg-ink px-6 py-10 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <p className="text-center text-[11px] font-semibold tracking-wide text-steel">
          WE SERVICE ALL MAKES, INCLUDING
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {brands.map((b) => (
            <span key={b} className="font-display text-[15px] text-paper/50">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
