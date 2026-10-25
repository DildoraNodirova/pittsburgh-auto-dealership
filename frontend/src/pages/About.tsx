import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import WhyChooseUs from "../components/WhyChooseUs";
import { business } from "../data/business";

export default function About() {
  return (
    <div className="min-h-screen bg-ink">
      <Navbar transparent={false} />

      <div className="mx-auto max-w-[1400px] px-6 pt-16 md:px-12">
        <div className="border-b border-paper/10 pb-8">
          <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">ABOUT US</div>
          <h1 className="mt-2 font-display text-4xl text-paper">Built on Honest Work</h1>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-paper">Our Story</h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-steel">
              Pittsburgh Auto was built around a simple idea: tell customers exactly
              what their car needs, charge a fair price for it, and do the work right
              the first time. No upselling, no confusing jargon, just honest
              diagnostics and quality repairs.
            </p>
            <p className="mt-4 text-[14.5px] leading-relaxed text-steel">
              Our certified mechanics work on every make and model, from daily
              drivers to performance vehicles, using genuine parts and modern
              diagnostic equipment. Whether it is a routine oil change or a complex
              repair, we treat every car like it is our own.
            </p>
            <div className="mt-8">
              <Button href="/book" variant="primary">Book a Service</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-sm border border-paper/10 bg-ink-2 p-6">
              <div className="font-display text-3xl text-paper">5,000+</div>
              <div className="mt-1 text-[12.5px] text-steel">Vehicles serviced</div>
            </div>
            <div className="rounded-sm border border-paper/10 bg-ink-2 p-6">
              <div className="font-display text-3xl text-paper">4.9</div>
              <div className="mt-1 text-[12.5px] text-steel">Average customer rating</div>
            </div>
            <div className="rounded-sm border border-paper/10 bg-ink-2 p-6">
              <div className="font-display text-3xl text-paper">13+</div>
              <div className="mt-1 text-[12.5px] text-steel">Services offered</div>
            </div>
            <div className="rounded-sm border border-paper/10 bg-ink-2 p-6">
              <div className="font-display text-3xl text-paper">100%</div>
              <div className="mt-1 text-[12.5px] text-steel">Transparent pricing</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <WhyChooseUs />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-4 md:px-12">
        <div className="rounded-sm border border-paper/10 bg-ink-2 p-8 text-center">
          <h2 className="font-display text-2xl text-paper">Visit Us</h2>
          <p className="mt-2 text-[14px] text-steel">{business.address}</p>
          <p className="mt-1 text-[14px] text-steel">{business.phone}</p>
          <div className="mt-6">
            <Button href="/location" variant="secondary">Get Directions</Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
