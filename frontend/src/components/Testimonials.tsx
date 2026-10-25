import { Star } from "lucide-react";

const reviews = [
  {
    name: "Mark Silvio",
    initials: "MS",
    time: "2 weeks ago",
    text: "I called on a Saturday morning and really needed my brakes done that day, not to mention it was Labor Day weekend. They fit me in and took great care of it.",
  },
  {
    name: "Karen Barr",
    initials: "KB",
    time: "a month ago",
    text: "I had an excellent experience. Easy to make an appointment, and my wait was less than an hour. The mechanic took the time to explain everything calmly, without acting rushed even though the shop was busy. He did not try to upsell me anything, just gave me honest, factual information. I am definitely going back and would recommend to a friend.",
  },
  {
    name: "Zokir Zokirov",
    initials: "ZZ",
    time: "3 months ago",
    text: "Best repair shop I have been to! The staff was super professional and friendly from the moment I walked in. They got my car done quickly and the quality of work was outstanding. No hidden fees, very transparent about everything. This is my go-to shop from now on. 10/10 recommend to everyone!",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-ink-2 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="text-center font-display text-3xl text-paper">What Our Customers Say</h2>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-sm border border-paper/10 bg-ink p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bordeaux text-[12px] font-semibold text-paper">
                  {r.initials}
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-paper">{r.name}</div>
                  <div className="text-[11.5px] text-steel">{r.time}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-0.5 text-bordeaux-light">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-steel">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
