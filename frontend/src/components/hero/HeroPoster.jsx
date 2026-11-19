const PAPER = "#F4F1EA";
const LINE = "#CDC6B6";
const INK = "#23262E";
const BLUE = "#2247FF";

const FRONT = { web: ["web"], marketing: ["marketing"], ai: ["chat", "cal"] };
const order = (mode) => [...["web", "marketing", "chat", "cal"].filter((k) => !FRONT[mode].includes(k)), ...FRONT[mode]];

// Lightweight static stand-in for the 3D scene (reduced motion, no WebGL, slow devices, loading).
export const HeroPoster = ({ mode }) => {
  const f = (m) => (mode === m ? 1 : 0.55);
  const G = {
    web: (
      <g opacity={f("web")} filter={mode === "web" ? "url(#lift)" : "url(#sh)"} transform={mode === "web" ? "translate(120 120)" : "translate(40 60) scale(.8)"}>
        <rect width="300" height="200" rx="14" fill={PAPER} />
        <rect width="300" height="28" rx="12" fill={INK} />
        <circle cx="18" cy="14" r="4" fill={LINE} /><circle cx="32" cy="14" r="4" fill={LINE} /><circle cx="46" cy="14" r="4" fill={BLUE} />
        <image href="/brand/adzenmedia-horizontal-charcoal.svg" x="20" y="46" width="130" height="22" />
        <rect x="20" y="76" width="110" height="8" rx="4" fill={LINE} /><rect x="20" y="92" width="100" height="8" rx="4" fill={LINE} />
        <rect x="20" y="116" width="70" height="24" rx="12" fill={BLUE} />
        <rect x="170" y="48" width="110" height="110" rx="8" fill={LINE} />
      </g>
    ),
    marketing: (
      <g opacity={f("marketing")} filter={mode === "marketing" ? "url(#lift)" : "url(#sh)"} transform={mode === "marketing" ? "translate(250 70)" : "translate(440 210) scale(.75)"}>
        <rect width="120" height="220" rx="20" fill="#15171C" />
        <rect x="9" y="12" width="102" height="180" rx="12" fill="#1B2340" />
        <image href="/brand/adzenmedia-favicon.svg" x="16" y="20" width="16" height="16" />
        <image href="/brand/adzenmedia-horizontal-white.svg" x="38" y="23" width="56" height="10" />
        <path d="M50 70 L80 88 L50 106 Z" fill={PAPER} />
        <rect x="20" y="140" width="80" height="4" rx="2" fill={INK} /><rect x="20" y="140" width="34" height="4" rx="2" fill={BLUE} />
        <rect x="24" y="158" width="72" height="20" rx="10" fill={BLUE} />
      </g>
    ),
    chat: (
      <g opacity={f("ai")} filter={mode === "ai" ? "url(#lift)" : "url(#sh)"} transform={mode === "ai" ? "translate(70 150)" : "translate(30 300) scale(.75)"}>
        <rect width="190" height="44" rx="22" fill={PAPER} />
        <rect x="50" y="60" width="160" height="44" rx="22" fill={BLUE} />
        <rect x="0" y="120" width="120" height="44" rx="22" fill={PAPER} />
      </g>
    ),
    cal: (
      <g opacity={f("ai")} filter={mode === "ai" ? "url(#lift)" : "url(#sh)"} transform={mode === "ai" ? "translate(320 190)" : "translate(450 40) scale(.65)"}>
        <rect width="200" height="190" rx="14" fill={PAPER} />
        <rect width="200" height="36" rx="12" fill={INK} />
        {Array.from({ length: 20 }).map((_, i) => (
          <rect key={i} x={14 + (i % 5) * 36} y={50 + Math.floor(i / 5) * 34} width="28" height="24" rx="5" fill={i === 13 ? BLUE : LINE} />
        ))}
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 600 480" className="absolute inset-0 w-full h-full" role="img" aria-label="A website, a social video ad, an AI chat and a booked calendar slot" data-testid="hero-poster">
      <defs>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.35" /></filter>
        <filter id="lift" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="26" stdDeviation="22" floodColor="#000" floodOpacity="0.55" /></filter>
      </defs>
      {order(mode).map((k) => <g key={k}>{G[k]}</g>)}
    </svg>
  );
};
