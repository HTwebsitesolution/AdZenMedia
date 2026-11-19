const Demo = ({ children }) => (
  <span className="absolute -top-3 left-5 rounded-full bg-[#15171C] text-[#F4F1EA] text-[11px] px-3 py-1" data-testid="demo-label">{children || "Demonstration"}</span>
);

export const BrowserMock = () => (
  <div className="relative paper-card overflow-hidden" aria-hidden="true">
    <Demo>Demonstration layout</Demo>
    <div className="h-8 bg-[#23262E] flex items-center gap-1.5 px-4"><i className="w-2.5 h-2.5 rounded-full bg-[#CDC6B6]" /><i className="w-2.5 h-2.5 rounded-full bg-[#CDC6B6]" /><i className="w-2.5 h-2.5 rounded-full bg-[#2247FF]" /></div>
    <div className="p-6 grid grid-cols-5 gap-5">
      <div className="col-span-3 space-y-3">
        <div className="h-6 w-4/5 rounded bg-[#15171C]" /><div className="h-6 w-3/5 rounded bg-[#15171C]" />
        <div className="h-2.5 w-full rounded bg-[#CDC6B6]" /><div className="h-2.5 w-5/6 rounded bg-[#CDC6B6]" />
        <div className="mt-4 h-9 w-32 rounded-full bg-[#2247FF]" />
      </div>
      <div className="col-span-2 rounded-xl bg-[#F4F1EA] p-4 space-y-2.5">
        <p className="text-xs font-semibold">Request a quote</p>
        {[0, 1, 2].map((k) => <div key={k} className="h-7 rounded-md bg-white border border-black/10" />)}
        <div className="h-8 rounded-md bg-[#15171C]" />
      </div>
    </div>
  </div>
);

export const VideoStrip = () => (
  <div className="relative flex gap-4 sm:gap-6 overflow-hidden" aria-hidden="true">
    <Demo>Demonstration frames</Demo>
    {[["0–3s", "Hook", "#15171C"], ["3–12s", "Before / after", "#2247FF"], ["12–20s", "Offer + call to action", "#23262E"]].map(([t, label, bg], k) => (
      <div key={t} className="relative shrink-0 w-[30%] max-w-[220px] aspect-[9/16] rounded-[22px] p-4 flex flex-col justify-between text-[#F4F1EA]" style={{ background: bg, transform: `translateY(${k === 1 ? -18 : 0}px) rotate(${(k - 1) * 3}deg)` }}>
        <span className="text-xs opacity-70">{t}</span>
        <span className="font-display text-xl sm:text-2xl font-bold leading-tight">{label}</span>
        <span className="h-1 rounded bg-white/25"><span className="block h-1 rounded bg-white" style={{ width: `${35 + k * 25}%` }} /></span>
      </div>
    ))}
  </div>
);

export const FlowMock = () => (
  <div className="relative paper-card p-6 space-y-3" aria-hidden="true">
    <Demo>Demonstration workflow</Demo>
    {[["New inquiry arrives", "Website form or email"], ["AI reads and sorts it", "Service, urgency, location"], ["CRM updated", "Contact and source saved"], ["Right person notified", "With a draft reply to approve"]].map(([a, b], k) => (
      <div key={a} className="flex items-center gap-4">
        <span className={`w-9 h-9 rounded-full grid place-items-center text-sm font-bold ${k === 1 ? "bg-[#2247FF] text-white" : "bg-[#EBE6DB]"}`}>{k + 1}</span>
        <div><p className="font-semibold">{a}</p><p className="text-sm text-[#6b6f78]">{b}</p></div>
      </div>
    ))}
  </div>
);

export const BookingMock = () => (
  <div className="relative grid grid-cols-5 gap-4" aria-hidden="true">
    <Demo>Demonstration · sample data</Demo>
    <div className="col-span-3 space-y-2 text-sm">
      <p className="paper-card px-4 py-2.5 rounded-2xl">Hi, can I book a furnace tune-up?</p>
      <p className="px-4 py-2.5 rounded-2xl bg-[#2247FF] text-white">Sure. I have Tuesday at 9:00 or 1:30. Which works?</p>
      <p className="paper-card px-4 py-2.5 rounded-2xl">1:30</p>
      <p className="px-4 py-2.5 rounded-2xl bg-[#2247FF] text-white">Booked for Tuesday 1:30 PM. You'll get a reminder.</p>
    </div>
    <div className="col-span-2 paper-card p-3 grid grid-cols-3 gap-1.5 content-start">
      {Array.from({ length: 12 }).map((_, k) => <span key={k} className={`h-7 rounded ${k === 7 ? "bg-[#2247FF]" : "bg-[#EBE6DB]"}`} />)}
      <p className="col-span-3 text-xs mt-1 font-semibold">Tue 1:30 PM booked</p>
    </div>
  </div>
);

export const PortalMock = () => (
  <div className="relative paper-card overflow-hidden" aria-hidden="true">
    <Demo>Representative layout, not the client's screens</Demo>
    <div className="flex">
      <div className="w-36 bg-[#15171C] text-[#F4F1EA]/80 p-4 space-y-3 text-xs hidden sm:block"><p className="text-white font-semibold">Customer portal</p><p>Sites</p><p className="text-white">Documents</p><p>Requests</p></div>
      <div className="flex-1 p-5">
        <p className="font-semibold">Documents · 3 sites</p>
        <ul className="mt-3 divide-y divide-black/5 text-sm">
          {[["Site A · North depot", "Inspection report", "Current"], ["Site B · Main office", "Test certificate", "Current"], ["Site C · Warehouse", "Inspection report", "Due soon"]].map(([a, b, c]) => (
            <li key={a} className="py-2.5 flex justify-between gap-3"><span>{a}</span><span className="text-[#6b6f78] hidden sm:inline">{b}</span><span className={c === "Current" ? "text-[#0b7a4b]" : "text-[#2247FF]"}>{c}</span></li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export const TrainingMock = () => (
  <div className="relative paper-card p-6" aria-hidden="true">
    <Demo>Sample workshop outline</Demo>
    <ol className="space-y-3">
      {["What AI is good at in your role, and what it isn't", "Live practice on your own emails, quotes and reports", "Rules for customer data and review", "Templates your team keeps using"].map((t) => (
        <li key={t} className="flex gap-3"><span className="mt-2 w-2 h-2 rounded-full bg-[#2247FF] shrink-0" /><span>{t}</span></li>
      ))}
    </ol>
  </div>
);

export const AdMock = () => (
  <div className="relative paper-card p-4 max-w-sm" aria-hidden="true">
    <Demo>Demonstration ad</Demo>
    <p className="text-xs text-[#6b6f78]">Your business · Sponsored</p>
    <div className="mt-3 aspect-square rounded-xl bg-gradient-to-br from-[#2247FF] to-[#15171C] grid place-items-end p-4 text-white font-display text-2xl font-bold">Spring offer: 15% off installs</div>
    <div className="mt-3 flex justify-between items-center"><span className="text-sm font-semibold">Get a free quote</span><span className="rounded-full bg-[#15171C] text-white text-xs px-3 py-1.5">Learn more</span></div>
  </div>
);

export const MOCKS = { browser: BrowserMock, video: VideoStrip, ad: AdMock, flow: FlowMock, booking: BookingMock, portal: PortalMock, training: TrainingMock };
