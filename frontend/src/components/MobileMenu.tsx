import { Link } from "react-router-dom";

const links: { label: string; to: string }[] = [
  { label: "Services", to: "/services" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/location" },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <div className={`fixed inset-0 z-30 bg-ink transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="flex items-center justify-between px-6 py-6">
        <span className="font-display text-lg tracking-wide text-paper">
          PITTSBURGH <span className="text-bordeaux-light">AUTO</span>
        </span>
        <button aria-label="Close menu" onClick={onClose} className="text-paper">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-6 pt-10">
        {links.map((link, i) => (
          <Link key={link.label} to={link.to} onClick={onClose} className={`border-b border-paper/10 py-4 font-display text-2xl text-paper transition-transform duration-300 ${isOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`} style={{ transitionDelay: isOpen ? `${i * 40}ms` : "0ms" }}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="px-6 pt-8">
        <Link to="/book" onClick={onClose} className="block rounded-sm bg-bordeaux px-7 py-3.5 text-center text-[13.5px] font-semibold tracking-wide text-paper">
          Book Appointment
        </Link>
      </div>
    </div>
  );
}
