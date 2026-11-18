import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { captureAttribution } from "@/lib/api";

const NAV = [
  ["/solutions", "Solutions"],
  ["/industries/commercial-field-service", "Field service"],
  ["/work", "Work"],
  ["/about", "About"],
  ["/systems-check", "Systems check"],
];

const Logo = () => (
  <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-lg" data-testid="nav-logo">
    <span className="grid place-items-center w-8 h-8 rounded-md bg-amber-400 text-slate-950 font-mono text-sm">AZ</span>
    AdZenMedia
  </Link>
);

const Header = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  const linkCls = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? "text-amber-300" : "text-slate-300 hover:text-white"}`;
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0D12]/85 border-b border-white/10">
      <div className="container-x h-16 flex items-center justify-between gap-3">
        <Logo />
        <nav className="hidden lg:flex items-center gap-7" aria-label="Main">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} className={linkCls} data-testid={`nav-link-${label.toLowerCase().replace(/\s/g, "-")}`}>
              {label}
            </NavLink>
          ))}
          <NavLink to="/contact" className={linkCls} data-testid="nav-link-contact">Contact</NavLink>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/contact" className="lg:hidden text-sm text-slate-200 px-2 py-2" data-testid="nav-contact-mobile">Contact</Link>
          <Link to="/quote" className="btn-primary !py-2 !px-3 sm:!px-4 text-sm whitespace-nowrap" data-testid="nav-request-quote-btn">Request a quote</Link>
          <button className="lg:hidden p-2 text-slate-200" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open} data-testid="nav-menu-toggle">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-white/10 bg-[#0A0D12] container-x py-4 flex flex-col gap-3" aria-label="Mobile" data-testid="nav-mobile-menu">
          {[...NAV, ["/contact", "Contact"]].map(([to, label]) => (
            <NavLink key={to} to={to} className={linkCls}>{label}</NavLink>
          ))}
        </nav>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="border-t border-white/10 mt-24">
    <div className="container-x py-14 grid gap-10 md:grid-cols-4 text-sm">
      <div className="md:col-span-2 space-y-3">
        <Logo />
        <p className="text-slate-400 max-w-sm">A founder-led digital systems partner for service businesses in the US and Canada.</p>
      </div>
      <div className="space-y-2">
        <p className="eyebrow mb-3">Solutions</p>
        <Link className="block text-slate-300 hover:text-white" to="/solutions/website-inquiry-system">Website & Inquiry System</Link>
        <Link className="block text-slate-300 hover:text-white" to="/solutions/workflow-automation-pilot">Workflow Automation Pilot</Link>
        <Link className="block text-slate-300 hover:text-white" to="/solutions/customer-portal-software-discovery">Customer Portal & Software</Link>
        <Link className="block text-slate-300 hover:text-white" to="/solutions/ai-training-for-teams">AI Training for Teams</Link>
      </div>
      <div className="space-y-2">
        <p className="eyebrow mb-3">Company</p>
        <Link className="block text-slate-300 hover:text-white" to="/about">About</Link>
        <Link className="block text-slate-300 hover:text-white" to="/work">Work</Link>
        <Link className="block text-slate-300 hover:text-white" to="/contact" data-testid="footer-contact-link">Contact</Link>
        <Link className="block text-slate-300 hover:text-white" to="/quote">Request a quote</Link>
        <Link className="block text-slate-300 hover:text-white" to="/privacy">Privacy</Link>
      </div>
    </div>
    <div className="container-x pb-8 text-xs text-slate-500">© {new Date().getFullYear()} AdZenMedia</div>
  </footer>
);

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { captureAttribution(); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-3 focus:bg-amber-400 focus:text-black">Skip to content</a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
