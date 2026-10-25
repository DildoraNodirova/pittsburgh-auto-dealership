import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import MobileMenu from "./MobileMenu";

const links: { label: string; to: string }[] = [
  { label: "Services", to: "/services" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/location" },
];

export default function Navbar({ transparent = true }: { transparent?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const wrapClass = transparent
    ? "absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-ink/95 from-0% via-ink/55 via-60% to-transparent"
    : "sticky top-0 z-20 border-b border-paper/10 bg-ink";

  return (
    <header className={wrapClass}>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 md:px-12">
        <Link to="/" className="font-display text-lg tracking-wide text-paper">
          PITTSBURGH <span className="text-bordeaux-light">AUTO</span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {links.map((link) => (
            <Link key={link.label} to={link.to} className="text-[13.5px] text-steel transition-colors hover:text-paper">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Button href="/book" variant="ghost" className="hidden sm:inline-flex">
            Book Appointment
          </Button>
          <button aria-label="Open menu" onClick={() => setMenuOpen(true)} className="flex flex-col gap-[5px] lg:hidden">
            <span className="block h-[1.5px] w-6 bg-paper" />
            <span className="block h-[1.5px] w-6 bg-paper" />
          </button>
        </div>
      </div>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

