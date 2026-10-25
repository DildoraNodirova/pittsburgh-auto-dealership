import { Link } from "react-router-dom";
import { business } from "../data/business";

export default function Footer() {
  return (
    <footer className="bg-ink px-6 pb-10 pt-16 md:px-12">
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 gap-10 border-b border-paper/10 pb-12 sm:grid-cols-3">
        <div>
          <div className="font-display text-lg text-paper">
            PITTSBURGH <span className="text-bordeaux-light">AUTO</span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-steel">
            Professional care, premium results. Your trusted local shop for honest automotive service.
          </p>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">QUICK LINKS</div>
          <div className="mt-4 flex flex-col gap-2.5 text-[13.5px] text-steel">
            <Link to="/services" className="hover:text-paper">Services</Link>
            <Link to="/book" className="hover:text-paper">Book Appointment</Link>
            <Link to="/location" className="hover:text-paper">Location & Hours</Link>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-wide text-bordeaux-light">CONTACT</div>
          <div className="mt-4 flex flex-col gap-2.5 text-[13.5px] text-steel">
            <span>{business.address}</span>
            <a href={`tel:${business.phoneHref}`} className="hover:text-paper">{business.phone}</a>
            <a href={`mailto:${business.email}`} className="hover:text-paper">{business.email}</a>
          </div>
        </div>
      </div>

      <p className="mx-auto max-w-[1400px] pt-6 text-center text-[12px] text-steel">
        (c) {new Date().getFullYear()} Pittsburgh Auto. All rights reserved.
      </p>
    </footer>
  );
}
