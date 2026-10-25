import { Link } from "react-router-dom";
import type { Service } from "../types/service";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="flex flex-col justify-between rounded-sm border border-paper/10 bg-ink-2 p-6 transition-colors hover:border-bordeaux-light/40">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-xl text-paper">{service.name}</h3>
          <span className="whitespace-nowrap text-lg font-semibold text-paper">
            {service.price > 0 ? `$${service.price}` : "Quote"}
          </span>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-steel">{service.description}</p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-paper/10 pt-4">
        <span className="text-[12px] text-steel">~{service.durationMin} min</span>
        <Link to={`/book?service=${service.id}`} className="text-[12.5px] font-semibold tracking-wide text-bordeaux-light">
          Book This Service
        </Link>
      </div>
    </div>
  );
}
