import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Mail, MessageCircle, Phone, PhoneCall } from "lucide-react";
import { Seo } from "@/components/site/Seo";
import { PageHero } from "@/components/site/Blocks";
import { ShortContactForm } from "@/components/contact/ShortContactForm";
import { VoiceAssistant } from "@/components/contact/VoiceAssistant";
import { track } from "@/lib/api";
import { availabilityText, telLink, useConfig, waLink } from "@/lib/config";

const Channel = ({ icon: Icon, title, desc, href, channel, testid, external }) => (
  <a href={href} onClick={() => track("channel_click", channel)} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
    className="surface p-5 flex gap-4 items-start hover:border-amber-400/40 transition-colors" data-testid={testid}>
    <Icon className="text-amber-400 shrink-0 mt-0.5" size={20} aria-hidden />
    <span><span className="block font-semibold">{title}</span><span className="block text-sm text-slate-400 mt-0.5 break-all">{desc}</span></span>
  </a>
);

const Channels = ({ ch }) => {
  const avail = ch.availability ? availabilityText(ch.availability) : "";
  const list = [
    ch.whatsapp_number && { icon: MessageCircle, title: "Chat on WhatsApp", desc: "Opens WhatsApp with a short starter message", href: waLink(ch.whatsapp_number, "Hi AdZenMedia, I have a question about a project."), channel: "whatsapp_chat", testid: "channel-whatsapp-chat", external: true },
    ch.whatsapp_call_enabled && { icon: PhoneCall, title: "Call on WhatsApp", desc: "On supported devices with WhatsApp installed", href: `whatsapp://call?phone=${ch.whatsapp_number.replace(/\D/g, "")}`, channel: "whatsapp_call", testid: "channel-whatsapp-call" },
    ch.email && { icon: Mail, title: "Email", desc: ch.email, href: `mailto:${ch.email}`, channel: "email", testid: "channel-email" },
    ch.phone && { icon: Phone, title: "Phone", desc: ch.phone, href: telLink(ch.phone), channel: "phone", testid: "channel-phone" },
    ch.booking_url && { icon: CalendarClock, title: "Book a call", desc: "Times shown in your local time zone", href: ch.booking_url, channel: "calendar", testid: "channel-calendar", external: true },
  ].filter(Boolean);
  if (!list.length && !avail) return null;
  return (
    <div className="space-y-3" data-testid="contact-channels">
      <h2 className="text-xl font-semibold">Other ways to reach us</h2>
      <div className="grid sm:grid-cols-2 gap-3">{list.map((c) => <Channel key={c.testid} {...c} />)}</div>
      {avail && <p className="text-sm text-slate-400" data-testid="contact-availability">Available: {avail}</p>}
    </div>
  );
};

export default function ContactPage() {
  const { cfg, failed } = useConfig() || {};
  const ch = cfg?.channels || {};
  return (
    <>
      <Seo title="Contact" description="Request a quote, ask a quick question, or reach AdZenMedia by WhatsApp, email, phone or a booked call." />
      <PageHero eyebrow="Contact" title="Tell us what you need.">
        The quickest route is the quote request. For anything else, send a short question and Joseph will reply personally.
      </PageHero>
      <section className="container-x py-14 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <Link to="/quote" className="surface p-7 block border-amber-400/40 hover:border-amber-400 transition-colors" data-testid="contact-quote-card">
            <p className="eyebrow">Recommended</p>
            <h2 className="mt-2 text-2xl font-bold">Request a quote</h2>
            <p className="mt-2 text-slate-400">Four short steps. You'll get a reference straight away.</p>
            <span className="mt-5 btn-primary">Start the quote request <ArrowRight size={16} /></span>
          </Link>
          {ch.voice_enabled && (
            <div className="surface p-7" data-testid="contact-voice-card">
              <h2 className="text-xl font-semibold mb-4">Talk to our AI assistant</h2>
              <VoiceAssistant recordingNotice={ch.voice_recording_notice} />
            </div>
          )}
        </div>
        <div id="contact-form-section" className="lg:col-span-7 surface p-7 sm:p-9 scroll-mt-24">
          <h2 className="text-2xl font-bold">Ask a quick question</h2>
          <p className="mt-2 mb-6 text-slate-400">Name, email, company and your message. That's all.</p>
          <ShortContactForm />
        </div>
      </section>
      <section className="container-x">
        {failed && <p className="text-sm text-slate-400">Some contact options couldn't load. The forms above still work.</p>}
        <Channels ch={ch} />
      </section>
    </>
  );
}
