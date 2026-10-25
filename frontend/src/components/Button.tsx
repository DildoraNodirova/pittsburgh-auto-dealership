import type { ReactNode, MouseEventHandler } from "react";
import { Link } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
  onClick?: MouseEventHandler;
  className?: string;
}

const base = "inline-flex items-center justify-center rounded-sm px-7 py-3.5 text-[13.5px] font-semibold tracking-wide transition-colors";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-bordeaux text-paper hover:bg-bordeaux-light",
  secondary: "border border-paper/25 text-paper hover:border-paper/60",
  ghost: "border border-bordeaux-light/40 px-5 py-2.5 text-[13px] text-bordeaux-light hover:border-bordeaux-light hover:bg-bordeaux/20",
};

export default function Button({ children, variant = "primary", href, onClick, className = "" }: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href && !href.startsWith("#")) {
    return (
      <Link to={href} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
