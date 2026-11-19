import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Pause, Play } from "lucide-react";
import { HeroPoster } from "./HeroPoster";

export const MODES = [
  { id: "web", label: "Web", caption: "Websites and landing pages that turn visits into inquiries.", tag: "On screen: Inspired by Nicola (client website)", to: "/services/website-design-development" },
  { id: "marketing", label: "Marketing", caption: "Social video and Facebook & Instagram ads that bring in leads.", tag: "On screen: Pilates Barn site with a demo ad overlay", to: "/services/facebook-instagram-ads" },
  { id: "ai", label: "AI", caption: "AI that replies to every lead and books the appointment.", tag: "Demo workflow, sample data", to: "/services/ai-appointment-booking" },
];

function canRender3D() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator;
  if (nav.connection?.saveData) return false;
  if ((nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2)) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const ModeSwitch = ({ mode, setMode }) => {
  const refs = useRef([]);
  const onKey = (e, i) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + MODES.length) % MODES.length;
    setMode(MODES[n].id);
    refs.current[n]?.focus();
  };
  return (
    <div role="group" aria-label="Show what we build" className="inline-flex rounded-full p-1 bg-white/10 border border-white/15 backdrop-blur" data-testid="hero-mode-switch">
      {MODES.map((m, i) => (
        <button key={m.id} ref={(el) => { refs.current[i] = el; }} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} onKeyDown={(e) => onKey(e, i)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${mode === m.id ? "bg-[#F4F1EA] text-[#15171C]" : "text-[#F4F1EA]/80 hover:text-white"}`}
          data-testid={`hero-mode-${m.id}`}>
          {m.label}
        </button>
      ))}
    </div>
  );
};

const Scene = ({ mode, paused, onState }) => {
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    let io;
    import("./heroScene").then(({ createHeroScene }) => {
      if (disposed || !canvasRef.current) return;
      try {
        apiRef.current = createHeroScene(canvasRef.current, mode);
        setReady(true);
        onState("3d");
        io = new IntersectionObserver(([e]) => (e.isIntersecting ? apiRef.current?.resume() : apiRef.current?.pause()));
        io.observe(canvasRef.current);
      } catch {
        onState("poster");
      }
    }).catch(() => onState("poster"));
    const vis = () => (document.hidden ? apiRef.current?.pause() : apiRef.current?.resume());
    document.addEventListener("visibilitychange", vis);
    return () => { disposed = true; io?.disconnect(); document.removeEventListener("visibilitychange", vis); apiRef.current?.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { apiRef.current?.setMode(mode); }, [mode]);
  useEffect(() => { if (paused) apiRef.current?.pause(); else apiRef.current?.resume(); }, [paused]);
  return (
    <canvas ref={canvasRef} aria-hidden="true" data-testid="hero-canvas"
      className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />
  );
};

export default function Hero() {
  const [mode, setMode] = useState("web");
  const [use3D] = useState(canRender3D);
  const [state, setState] = useState(use3D ? "loading" : "poster");
  const [paused, setPaused] = useState(false);
  const active = MODES.find((m) => m.id === mode);
  return (
    <section className="relative overflow-hidden bg-[#15171C] text-[#F4F1EA]" data-testid="hero" data-render={state}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 72% 45%, rgba(34,71,255,0.28), transparent 70%)" }} />
      <div className="relative container-x grid lg:grid-cols-12 gap-8 pt-14 pb-10 lg:pt-20 lg:pb-16 min-h-[640px]">
        <div className="lg:col-span-6 relative z-10 flex flex-col justify-center">
          <h1 className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.6rem] font-extrabold tracking-[-0.03em] rise" data-testid="home-headline">
            Websites, marketing and AI for growing businesses.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#F4F1EA]/80 max-w-xl rise rise-2">
            We design websites, create social content, run Facebook and Instagram campaigns, and build AI systems that follow up with leads and book appointments. We also develop custom software and train teams to use it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 rise rise-3">
            <Link to="/quote" className="btn-cta" data-testid="home-request-quote-btn">Request a quote <ArrowRight size={16} aria-hidden /></Link>
            <Link to="/work" className="btn-ghost text-[#F4F1EA]" data-testid="home-see-work-btn">See our work</Link>
            <Link to="/contact" className="text-sm underline underline-offset-4 text-[#F4F1EA]/80 hover:text-white ml-1" data-testid="home-contact-link">Contact</Link>
          </div>
        </div>
        <div className="lg:col-span-6 relative h-[360px] sm:h-[440px] lg:h-auto lg:min-h-[560px]">
          {state !== "3d" && <HeroPoster mode={mode} />}
          {use3D && state !== "poster" && <Scene mode={mode} paused={paused} onState={setState} />}
        </div>
        <div className="lg:col-span-12 relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <ModeSwitch mode={mode} setMode={setMode} />
          <p className="text-sm text-[#F4F1EA]/80" aria-live="polite" data-testid="hero-mode-caption">
            {active.caption} <Link to={active.to} className="underline underline-offset-4 text-white">Explore</Link>
            <span className="block text-xs text-[#F4F1EA]/55 mt-1" data-testid="hero-screen-label">{active.tag}</span>
          </p>
          {use3D && state !== "poster" && (
            <button type="button" onClick={() => setPaused(!paused)} disabled={state !== "3d"} className={`${state === "3d" ? "" : "invisible"} sm:ml-auto inline-flex items-center gap-2 text-xs text-[#F4F1EA]/70 hover:text-white`} aria-pressed={paused} data-testid="hero-pause-btn">
              {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? "Play animation" : "Pause animation"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
