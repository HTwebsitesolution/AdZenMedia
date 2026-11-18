import { Link } from "react-router-dom";
import { CalendarClock, CheckCircle2, MessageCircle } from "lucide-react";
import { track } from "@/lib/api";
import { useConfig, waLink } from "@/lib/config";

export const QuoteConfirmation = ({ reference, kind = "quote request" }) => {
  const { cfg } = useConfig() || {};
  const ch = cfg?.channels || {};
  return (
    <div className="max-w-2xl surface p-8 sm:p-10 border-emerald-500/30" role="status" data-testid="lead-confirmation">
      <CheckCircle2 className="text-emerald-400" size={32} aria-hidden />
      <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">Your {kind} is saved.</h2>
      <p className="mt-3 text-slate-300">Your reference is</p>
      <p className="mt-1 font-mono text-2xl text-amber-300" data-testid="lead-reference">{reference}</p>
      <p className="mt-4 text-slate-400">
        Joseph will review it and reply by email. A confirmation email is on its way.
        {kind === "quote request" && " This is a request for a scoped quote: no price, delivery date or commitment has been made yet."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {ch.booking_url && (
          <a href={ch.booking_url} target="_blank" rel="noopener noreferrer" className="btn-primary" onClick={() => track("channel_click", "calendar")} data-testid="confirmation-book-call">
            <CalendarClock size={16} /> Book an optional call
          </a>
        )}
        {ch.whatsapp_number && (
          <a href={waLink(ch.whatsapp_number, `Hi AdZenMedia, I'm following up on quote reference ${reference}.`)} target="_blank" rel="noopener noreferrer" className="btn-secondary" onClick={() => track("channel_click", "whatsapp_chat")} data-testid="confirmation-whatsapp">
            <MessageCircle size={16} /> Message us on WhatsApp
          </a>
        )}
        <Link to="/" className="btn-secondary" data-testid="confirmation-home">Back to home</Link>
      </div>
      {ch.booking_url && <p className="mt-3 text-xs text-slate-500">Mention reference {reference} when you book.</p>}
    </div>
  );
};
