import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, MessageSquareText, MousePointerClick, UserRoundPlus } from "lucide-react";

const STEPS = [
  {
    id: "ad", label: "Ad", icon: MousePointerClick, title: "Someone sees your ad on Instagram",
    body: "A short video ad with one clear offer runs to people in your service area.",
    panel: (
      <div className="paper-card p-4 max-w-xs">
        <p className="text-xs text-[#6b6f78]">Riverside Dental · Sponsored</p>
        <div className="mt-3 aspect-[4/3] rounded-lg bg-[#15171C] grid place-items-center text-[#F4F1EA] font-display text-2xl">Free whitening consult</div>
        <div className="mt-3 flex items-center justify-between"><span className="text-sm font-semibold">Book this week</span><span className="rounded-full bg-[#2247FF] text-white text-xs px-3 py-1.5">Get offer</span></div>
      </div>
    ),
  },
  {
    id: "lead", label: "Lead captured", icon: UserRoundPlus, title: "They tap and send their details",
    body: "A Meta instant form or landing page captures name, contact and what they want. The lead is saved with its campaign source.",
    panel: (
      <dl className="paper-card p-5 max-w-xs space-y-2 text-sm">
        {[["Name", "Jordan M."], ["Phone", "(555) 010-0199"], ["Interested in", "Whitening consult"], ["Campaign", "spring-offer-ig"]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-black/5 pb-2"><dt className="text-[#6b6f78]">{k}</dt><dd className="font-semibold">{v}</dd></div>
        ))}
      </dl>
    ),
  },
  {
    id: "followup", label: "AI follow-up", icon: MessageSquareText, title: "AI replies in under a minute",
    body: "An AI assistant texts back, answers simple questions from your approved information and offers real open times.",
    panel: (
      <div className="space-y-2 max-w-xs text-sm">
        <p className="paper-card px-4 py-2.5 rounded-2xl rounded-bl-sm">Hi Jordan, thanks for your interest in a whitening consult at Riverside Dental. Would you like to pick a time?</p>
        <p className="ml-10 px-4 py-2.5 rounded-2xl rounded-br-sm bg-[#2247FF] text-white">Thursday afternoon?</p>
        <p className="paper-card px-4 py-2.5 rounded-2xl rounded-bl-sm">I have 2:30 or 4:00 PM on Thursday. Which works?</p>
        <p className="ml-10 px-4 py-2.5 rounded-2xl rounded-br-sm bg-[#2247FF] text-white">2:30 please</p>
      </div>
    ),
  },
  {
    id: "booked", label: "Booked", icon: CalendarCheck, title: "The appointment lands in your calendar",
    body: "The booking goes into your calendar and your team gets a summary. Anything unusual is handed to a person.",
    panel: (
      <div className="paper-card p-5 max-w-xs">
        <p className="text-xs text-[#6b6f78]">Thursday</p>
        <p className="font-display text-3xl font-bold">2:30 PM</p>
        <p className="mt-1 font-semibold">Whitening consult · Jordan M.</p>
        <ul className="mt-4 space-y-1.5 text-sm text-[#3a3d45]">
          <li>Added to Google Calendar</li><li>Front desk notified with summary</li><li>Reminder scheduled for the day before</li>
        </ul>
      </div>
    ),
  },
];

export const LeadJourney = ({ dark = true }) => {
  const [i, setI] = useState(0);
  const tabs = useRef([]);
  const go = (n) => { const k = (n + STEPS.length) % STEPS.length; setI(k); tabs.current[k]?.focus(); };
  const s = STEPS[i];
  const tone = dark ? "bg-[#15171C] text-[#F4F1EA]" : "bg-[#EBE6DB] text-[#15171C]";
  return (
    <div className={`rounded-[28px] ${tone} p-6 sm:p-10 lg:p-14`} data-testid="lead-journey">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">From Meta lead to booked appointment</h3>
        <span className="text-xs rounded-full border border-current/30 px-3 py-1 opacity-80" data-testid="lead-journey-sample-label">Demonstration · sample data, not a client result</span>
      </div>
      <div role="tablist" aria-label="Lead journey steps" className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STEPS.map((st, k) => (
          <button key={st.id} ref={(el) => { tabs.current[k] = el; }} role="tab" id={`journey-tab-${st.id}`} aria-selected={i === k} aria-controls="journey-panel" tabIndex={i === k ? 0 : -1}
            onClick={() => setI(k)} onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 ${i === k ? "bg-[#2247FF] text-white" : dark ? "bg-white/5 hover:bg-white/10" : "bg-white/60 hover:bg-white"}`}
            data-testid={`journey-step-${st.id}`}>
            <st.icon size={16} aria-hidden /> {st.label}
          </button>
        ))}
      </div>
      <div id="journey-panel" role="tabpanel" aria-labelledby={`journey-tab-${s.id}`} aria-live="polite" className="mt-8 grid md:grid-cols-2 gap-8 items-center min-h-[300px]" data-testid="journey-panel">
        <div key={s.id} className="rise">
          <p className="text-sm opacity-70">Step {i + 1} of {STEPS.length}</p>
          <h4 className="mt-2 font-display text-2xl sm:text-3xl font-bold">{s.title}</h4>
          <p className="mt-3 opacity-80 text-lg leading-relaxed">{s.body}</p>
        </div>
        <div key={`${s.id}-p`} className="rise rise-2 text-[#15171C]">{s.panel}</div>
      </div>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="btn-ghost !py-2 disabled:opacity-40" data-testid="journey-prev-btn"><ArrowLeft size={16} /> Back</button>
        <button type="button" onClick={() => go(i + 1)} disabled={i === STEPS.length - 1} className="btn-cta !py-2 disabled:opacity-40" data-testid="journey-next-btn">Next step <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};
