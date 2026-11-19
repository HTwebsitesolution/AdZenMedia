import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { captureAttribution } from "@/lib/api";
import { SERVICES } from "@/lib/content";

const NAV = [
  ["/services", "Services"],
  ["/work", "Work"],
  ["/about", "About"],
  ["/systems-check", "Systems check"],
  ["/contact", "Contact"],
];

const Logo = ({ light }) => (
  <Link to="/" aria-label="AdZenMedia home" className="flex items-center shrink-0" data-testid="nav-logo">
    <img src="/favicon.svg" alt="" width="32" height="32" className="w-8 h-8 min-[420px]:hidden" />
    <img src={`/brand/adzenmedia-horizontal-${light ? "white" : "charcoal"}.svg`} alt="AdZenMedia" width="148" height="25" className="hidden min-[420px]:block h-6 w-auto" />
  </Link>
);

const Header = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onDark = pathname === "/";
  useEffect(() => { setOpen(false); }, [pathname]);
  const linkCls = ({ isActive }) => `text-sm font-medium transition-colors ${isActive ? "text-[#2247FF]" : onDark ? "text-[#F4F1EA]/80 hover:text-white" : "text-[#3a3d45] hover:text-[#15171C]"}`;
  return (
    <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${onDark ? "bg-[#15171C]/85 border-white/10" : "bg-[#F4F1EA]/85 border-black/10"}`}>
      <div className="container-x h-16 flex items-center justify-between gap-3">
        <Logo light={onDark} />
        <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} className={linkCls} data-testid={`nav-link-${label.toLowerCase().replace(/\s/g, "-")}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/contact" className={`lg:hidden text-sm font-medium px-2 py-2 ${onDark ? "text-[#F4F1EA]" : ""}`} data-testid="nav-contact-mobile">Contact</Link>
          <Link to="/quote" className="btn-cta !py-2 !px-4 text-sm whitespace-nowrap" data-testid="nav-request-quote-btn">Request a quote</Link>
          <button className={`lg:hidden p-2 ${onDark ? "text-[#F4F1EA]" : ""}`} onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open} data-testid="nav-menu-toggle">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className={`lg:hidden border-t container-x py-4 flex flex-col gap-3 ${onDark ? "bg-[#15171C] border-white/10" : "bg-[#F4F1EA] border-black/10"}`} aria-label="Mobile" data-testid="nav-mobile-menu">
          {NAV.map(([to, label]) => <NavLink key={to} to={to} className={linkCls} data-testid={`mobile-nav-${label.toLowerCase().replace(/\s/g, "-")}`}>{label}</NavLink>)}
        </nav>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="mt-24 bg-[#15171C] text-[#F4F1EA] on-ink">
    <div className="container-x py-16 grid gap-10 md:grid-cols-12 text-sm">
      <div className="md:col-span-5 space-y-4">
        <Logo light />
        <p className="text-[#F4F1EA]/70 max-w-sm">A founder-led digital, marketing and AI agency for businesses in the United States and Canada.</p>
        <Link to="/quote" className="btn-cta !py-2 text-sm" data-testid="footer-quote-btn">Request a quote</Link>
      </div>
      <div className="md:col-span-4 space-y-2">
        <p className="font-semibold mb-3">Services</p>
        {SERVICES.map((s) => <Link key={s.slug} className="block text-[#F4F1EA]/70 hover:text-white" to={`/services/${s.slug}`}>{s.name}</Link>)}
      </div>
      <div className="md:col-span-3 space-y-2">
        <p className="font-semibold mb-3">Company</p>
        <Link className="block text-[#F4F1EA]/70 hover:text-white" to="/work">Work</Link>
        <Link className="block text-[#F4F1EA]/70 hover:text-white" to="/about">About</Link>
        <Link className="block text-[#F4F1EA]/70 hover:text-white" to="/contact" data-testid="footer-contact-link">Contact</Link>
        <Link className="block text-[#F4F1EA]/70 hover:text-white" to="/systems-check">Systems check</Link>
        <Link className="block text-[#F4F1EA]/70 hover:text-white" to="/privacy">Privacy</Link>
      </div>
    </div>
    <div className="container-x pb-8 text-xs text-[#F4F1EA]/50">© {new Date().getFullYear()} AdZenMedia</div>
  </footer>
);

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { captureAttribution(); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="site min-h-screen flex flex-col bg-[#F4F1EA] text-[#15171C]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:p-3 focus:bg-[#2247FF] focus:text-white">Skip to content</a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
