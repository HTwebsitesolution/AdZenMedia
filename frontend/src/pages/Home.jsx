import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Seo } from "@/components/site/Seo";
import { CtaBand, QuoteCta } from "@/components/site/Blocks";
import Hero from "@/components/hero/Hero";
import { LeadJourney } from "@/components/home/LeadJourney";
import { BookingMock, BrowserMock, FlowMock, PortalMock, TrainingMock, VideoStrip } from "@/components/home/Mockups";
import { PROJECTS, SERVICES, showPortfolio } from "@/lib/content";
import { ProjectCard, ReviewNote } from "@/components/home/ProjectCard";

const ServiceIndex = () => (
  <section className="container-x py-16 lg:py-24" aria-labelledby="services-heading">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 id="services-heading" className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em]">What we do</h2>
      <Link to="/services" className="text-[#2247FF] font-semibold inline-flex items-center gap-1" data-testid="home-all-services">All services <ArrowRight size={16} /></Link>
    </div>
    <ul className="mt-10 border-t border-black/15" data-testid="home-service-index">
      {SERVICES.map((s) => (
        <li key={s.slug} className="border-b border-black/15">
          <Link to={`/services/${s.slug}`} className="group grid md:grid-cols-12 gap-2 md:gap-6 py-6 md:py-7 items-baseline" data-testid={`home-service-${s.service}`}>
            <span className={`md:col-span-6 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.02em] transition-colors duration-200 group-hover:text-[#2247FF] ${s.featured ? "text-[#2247FF]" : ""}`}>{s.name}</span>
            <span className="md:col-span-5 text-[#565a63]">{s.short}</span>
            <ArrowUpRight className="hidden md:block md:col-span-1 justify-self-end text-[#15171C] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

const Split = ({ kicker, title, body, to, service, visual, flip, testid }) => (
  <section className="container-x py-14 lg:py-20 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center" data-testid={testid}>
    <div className={`lg:col-span-5 ${flip ? "lg:order-2" : ""}`}>
      <p className="kicker">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] leading-[1.06]">{title}</h2>
      <p className="mt-5 text-lg text-[#3a3d45] leading-relaxed">{body}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link to={to} className="btn-secondary">Learn more</Link>
        <QuoteCta service={service} label="Get a quote" testid={`${testid}-quote`} />
      </div>
    </div>
    <div className={`lg:col-span-7 ${flip ? "lg:order-1" : ""}`}>{visual}</div>
  </section>
);

export default function Home() {
  return (
    <>
      <Seo title="Websites, marketing and AI for growing businesses" description="AdZenMedia designs websites, creates social content, runs Facebook and Instagram ads, builds AI follow-up and booking systems, develops custom software and trains teams, for businesses in the US and Canada." />
      <Hero />
      <ServiceIndex />

      <Split testid="home-web" kicker="Website Design & Development" title="A website that explains you in five seconds and captures the inquiry."
        body="Business sites, landing pages and redesigns with SEO foundations and forms that record where every inquiry came from."
        to="/services/website-design-development" service="website" visual={<BrowserMock />} />

      <section className="bg-[#EBE6DB] py-16 lg:py-24" data-testid="home-social">
        <div className="container-x grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="kicker">Social Media & Video Editing</p>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] leading-[1.05]">Your footage, cut into content people stop for.</h2>
            <p className="mt-5 text-lg text-[#3a3d45]">Short-form video, editing and repurposing, social posts and campaign creative, delivered on a steady monthly rhythm.</p>
            <Link to="/services/social-media-video-editing" className="mt-7 btn-secondary" data-testid="home-social-link">See social & video</Link>
          </div>
          <div className="lg:col-span-7 pt-6"><VideoStrip /></div>
        </div>
      </section>

      <section className="container-x py-16 lg:py-24" data-testid="home-meta">
        <div className="max-w-3xl mb-10">
          <p className="kicker">Facebook & Instagram Ads + AI follow-up</p>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] leading-[1.05]">Ads that bring in leads. AI that books them before they go cold.</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/services/meta-lead-generation-ai-follow-up" className="btn-secondary" data-testid="home-meta-combined-link">Meta Lead Generation + AI Follow-up</Link>
            <Link to="/services/facebook-instagram-ads" className="btn-secondary" data-testid="home-meta-ads-link">Facebook & Instagram Ads</Link>
          </div>
        </div>
        <LeadJourney />
      </section>

      <Split testid="home-ai" flip kicker="AI Automation & Agents · AI Appointment Booking" title="AI that does the repetitive work and answers when you can't."
        body="Connect your everyday tools, route leads automatically, and let an AI receptionist answer calls or messages and book into your calendar, with a person taking over when needed."
        to="/services/ai-appointment-booking" service="ai_booking"
        visual={<div className="grid sm:grid-cols-2 gap-6"><FlowMock /><div className="pt-8"><BookingMock /></div></div>} />
      <div className="container-x -mt-6 mb-6"><Link to="/services/ai-automation-agents" className="text-[#2247FF] font-semibold inline-flex items-center gap-1" data-testid="home-ai-automation-link">AI Automation & Agents <ArrowRight size={16} /></Link></div>

      <section className="bg-[#15171C] text-[#F4F1EA] py-16 lg:py-28 on-ink" data-testid="home-software">
        <div className="container-x grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm font-semibold text-[#8fa3ff]">Custom Software, Portals & SaaS</p>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] leading-[1.05]">When off-the-shelf doesn't fit, we build it.</h2>
            <p className="mt-5 text-lg text-[#F4F1EA]/80">Customer portals, internal tools and SaaS products, scoped in phases. We built a customer portal for a multi-site inspection and testing provider in the UK so their customers find their own records.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/services/custom-software-portals-saas" className="btn-ghost text-[#F4F1EA]" data-testid="home-software-link">Software & portals</Link>
              <Link to="/work" className="btn-ghost text-[#F4F1EA]">See the work</Link>
            </div>
          </div>
          <div className="lg:col-span-7 text-[#15171C]"><PortalMock /></div>
        </div>
      </section>

      <section className="container-x py-16 lg:py-28 grid lg:grid-cols-12 gap-10 items-center" data-testid="home-training">
        <div className="lg:col-span-7">
          <p className="kicker">AI Training & Business Development</p>
          <p className="mt-4 font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.02]">The tools only pay off when your team actually uses them.</p>
          <p className="mt-6 text-lg text-[#3a3d45] max-w-xl">Practical AI workshops on your own work, adoption support for the first weeks, and business development sessions on where AI can grow revenue.</p>
          <Link to="/services/ai-training-business-development" className="mt-7 btn-secondary" data-testid="home-training-link">Training for teams</Link>
        </div>
        <div className="lg:col-span-5"><TrainingMock /></div>
      </section>

      {showPortfolio() && (
        <section className="container-x py-16 lg:py-24" data-testid="home-selected-work">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-[-0.03em]">Selected work</h2>
            <Link to="/work" className="text-[#2247FF] font-semibold inline-flex items-center gap-1" data-testid="home-work-link">Full portfolio <ArrowRight size={16} /></Link>
          </div>
          <ReviewNote />
          <div className="mt-12 grid lg:grid-cols-2 gap-x-12 gap-y-20">
            {PROJECTS.filter((p) => p.featured).map((p, i) => <div key={p.id} className={i % 2 ? "lg:mt-24" : ""}><ProjectCard p={p} /></div>)}
          </div>
        </section>
      )}

      <section className="container-x py-12 lg:py-16 border-t border-black/15" data-testid="home-start">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em]">How to start</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-8 text-lg">
          <p><strong className="block font-display text-2xl">Tell us the goal.</strong><span className="text-[#565a63]">Pick one or more services in the quote form. No call needed to start.</span></p>
          <p><strong className="block font-display text-2xl">Joseph replies personally.</strong><span className="text-[#565a63]">Questions or a short call, then a written scope and quote.</span></p>
          <p><strong className="block font-display text-2xl">Start small, measure it.</strong><span className="text-[#565a63]">One site, campaign or pilot first. Expand when it works.</span></p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <QuoteCta testid="home-steps-quote-btn" />
          <Link to="/systems-check" className="btn-secondary" data-testid="home-systems-check-btn">Take the 2-minute systems check</Link>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
