import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "./FounderLayout";
import { StageBadge } from "./Dashboard";

const inp = "w-full bg-[#0F141C] border border-white/15 rounded-md px-3 py-2 text-sm";
const STAGES = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];
const Card = ({ title, children, testid }) => (
  <section className="surface p-5" data-testid={testid}><h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">{title}</h2>{children}</section>
);
const StatusPill = ({ s }) => {
  const c = { sent: "text-emerald-300", failed: "text-rose-300", rejected: "text-rose-300", unknown: "text-amber-300" }[s] || "text-slate-300";
  return <span className={`font-mono text-xs ${c}`}>{s}</span>;
};

const Pipeline = ({ lead, save }) => {
  const [f, setF] = useState({ next_action: lead.next_action || "", follow_up_date: lead.follow_up_date || "", project_label: lead.project_label || "" });
  useEffect(() => { setF({ next_action: lead.next_action || "", follow_up_date: lead.follow_up_date || "", project_label: lead.project_label || "" }); }, [lead]);
  return (
    <Card title="Pipeline" testid="lead-pipeline">
      <div className="flex flex-wrap gap-2 mb-4">
        {STAGES.map((s) => (
          <button key={s} onClick={() => save({ stage: s })} className={`px-3 py-1.5 rounded-md text-sm border ${lead.stage === s ? "border-amber-400 bg-amber-400/10 text-amber-200" : "border-white/10 text-slate-400 hover:text-white"}`} data-testid={`stage-btn-${s.toLowerCase().replace(" ", "-")}`}>{s}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-xs text-slate-400 sm:col-span-2">Next action<input value={f.next_action} onChange={(e) => setF({ ...f, next_action: e.target.value })} className={inp} data-testid="lead-next-action" /></label>
        <label className="text-xs text-slate-400">Follow-up date<input type="date" value={f.follow_up_date} onChange={(e) => setF({ ...f, follow_up_date: e.target.value })} className={inp} data-testid="lead-follow-up-date" /></label>
        <label className="text-xs text-slate-400 sm:col-span-2">Project label (separates projects from the same client)<input value={f.project_label} onChange={(e) => setF({ ...f, project_label: e.target.value })} className={inp} data-testid="lead-project-label" /></label>
        <div className="flex items-end"><button onClick={() => save(f)} className="btn-primary !py-2 w-full text-sm" data-testid="lead-save-followup">Save</button></div>
      </div>
    </Card>
  );
};

const Qualification = ({ lead, save }) => {
  const [q, setQ] = useState(lead.qualification || {});
  const [p, setP] = useState(lead.proposal || {});
  return (
    <Card title="Qualification, proposal & booking" testid="lead-qualification">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs text-slate-400">Fit<select value={q.fit || "unknown"} onChange={(e) => setQ({ ...q, fit: e.target.value })} className={inp} data-testid="lead-fit">{["unknown", "good", "possible", "poor"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-xs text-slate-400">Proposal status<select value={p.status || "not_started"} onChange={(e) => setP({ ...p, status: e.target.value })} className={inp} data-testid="lead-proposal-status">{["not_started", "drafting", "sent", "accepted", "declined"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <textarea rows={2} placeholder="Qualification notes (budget fit, decision maker, timing)" value={q.notes || ""} onChange={(e) => setQ({ ...q, notes: e.target.value })} className={inp} data-testid="lead-qual-notes" />
        <textarea rows={2} placeholder="Proposal notes (pricing set by you, never automated)" value={p.notes || ""} onChange={(e) => setP({ ...p, notes: e.target.value })} className={inp} data-testid="lead-proposal-notes" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => save({ qualification: q, proposal: p })} className="btn-primary !py-2 text-sm" data-testid="lead-save-qual">Save</button>
        {lead.booking?.status === "confirmed" ? (
          <button onClick={() => save({ booking_status: "none" })} className="btn-secondary !py-2 text-sm" data-testid="lead-unconfirm-booking">Booked call confirmed ✓ (undo)</button>
        ) : (
          <button onClick={() => save({ booking_status: "confirmed" })} className="btn-secondary !py-2 text-sm" data-testid="lead-confirm-booking">Confirm a booked call</button>
        )}
      </div>
    </Card>
  );
};

const Activity = ({ lead, post }) => {
  const [note, setNote] = useState("");
  const [conv, setConv] = useState({ channel: "whatsapp", summary: "" });
  const feed = [...(lead.notes || []).map((n) => ({ ...n, kind: "note" })), ...(lead.conversations || []).map((c) => ({ text: c.summary, at: c.occurred_at, kind: c.channel }))].sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  return (
    <Card title="Notes & conversations" testid="lead-activity">
      <div className="grid sm:grid-cols-2 gap-3">
        <form onSubmit={(e) => { e.preventDefault(); post("notes", { text: note }).then(() => setNote("")); }} className="space-y-2">
          <textarea required rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className={inp} data-testid="lead-note-input" />
          <button className="btn-secondary !py-1.5 text-sm" data-testid="lead-note-add">Add note</button>
        </form>
        <form onSubmit={(e) => { e.preventDefault(); post("conversations", conv).then(() => setConv({ ...conv, summary: "" })); }} className="space-y-2">
          <div className="flex gap-2">
            <select value={conv.channel} onChange={(e) => setConv({ ...conv, channel: e.target.value })} className={`${inp} !w-36`} data-testid="lead-conv-channel" aria-label="Conversation channel">{["whatsapp", "phone", "email", "calendar", "other"].map((c) => <option key={c}>{c}</option>)}</select>
            <input required value={conv.summary} onChange={(e) => setConv({ ...conv, summary: e.target.value })} placeholder="What was discussed?" className={inp} data-testid="lead-conv-input" />
          </div>
          <button className="btn-secondary !py-1.5 text-sm" data-testid="lead-conv-add">Log conversation</button>
        </form>
      </div>
      <ul className="mt-4 space-y-2">
        {feed.map((x, i) => (
          <li key={i} className="text-sm border-l-2 border-white/10 pl-3"><span className="font-mono text-xs text-slate-500">{x.at?.slice(0, 16).replace("T", " ")} · {x.kind}</span><p className="text-slate-300 whitespace-pre-wrap">{x.text}</p></li>
        ))}
      </ul>
    </Card>
  );
};

const Delivery = ({ emails, lead, retry, resend }) => (
  <Card title="Delivery status" testid="lead-delivery">
    <ul className="space-y-2 text-sm">
      {emails.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-2" data-testid={`email-status-${e.kind}`}>
          <span>{e.kind.replace("_", " ")} <span className="text-slate-500">({e.mode})</span></span>
          <span className="flex items-center gap-2"><StatusPill s={e.status} />{e.status === "failed" && <button onClick={() => retry(e.id)} className="text-amber-300 text-xs underline" data-testid="email-retry-btn">Retry</button>}</span>
        </li>
      ))}
      {!emails.length && <li className="text-slate-500">No emails for this lead.</li>}
      <li className="flex items-center justify-between gap-2 pt-2 border-t border-white/5" data-testid="formspree-status">
        <span>Formspree backup</span>
        <span className="flex items-center gap-2"><StatusPill s={lead.formspree?.status || "pending"} />
          {["rejected", "unknown"].includes(lead.formspree?.status) && <button onClick={resend} className="text-amber-300 text-xs underline" data-testid="formspree-resend-btn">Resend</button>}
        </span>
      </li>
    </ul>
  </Card>
);

const Related = ({ related, link, unlink }) => {
  const [ref, setRef] = useState("");
  return (
    <Card title="Same contact, other projects" testid="lead-related">
      <ul className="space-y-1 text-sm">
        {related.map((r) => <li key={r.id}><Link to={`/founder/leads/${r.id}`} className="text-amber-300 font-mono">{r.reference}</Link> <span className="text-slate-400">{r.project_label || r.brief?.headline}</span></li>)}
        {!related.length && <li className="text-slate-500">No linked inquiries.</li>}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); link(ref.trim()); }} className="mt-3 flex gap-2">
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Link by reference, e.g. AZM-…" className={inp} data-testid="lead-link-input" />
        <button className="btn-secondary !py-1.5 text-sm" data-testid="lead-link-btn">Link</button>
      </form>
      {related.length > 0 && <button onClick={unlink} className="mt-2 text-xs text-slate-400 underline" data-testid="lead-unlink-btn">Unlink this inquiry</button>}
    </Card>
  );
};

export default function LeadDetail() {
  const { id } = useParams();
  const call = useAdmin();
  const [d, setD] = useState(null);
  const load = useCallback(() => call("get", `/admin/leads/${id}`).then(setD).catch(() => toast.error("Lead not found")), [call, id]);
  useEffect(() => { load(); }, [load]);
  const wrap = (p, ok = "Saved") => p.then((r) => { if (r?.lead) setD(r); else load(); toast.success(ok); }).catch((e) => toast.error(e?.response?.data?.detail?.toString() || "Failed"));
  if (!d) return <p className="text-slate-400">Loading…</p>;
  const { lead } = d;
  const c = lead.contact || {};
  const a = lead.attribution || {};
  const save = (body) => wrap(call("patch", `/admin/leads/${id}`, body));
  const post = (kind, body) => wrap(call("post", `/admin/leads/${id}/${kind}`, body), "Added");
  async function link(reference) {
    const list = await call("get", "/admin/leads", null, { params: { q: reference } });
    const target = list.items.find((x) => x.reference === reference.toUpperCase());
    if (!target) return toast.error("No lead with that reference");
    wrap(call("post", `/admin/leads/${id}/link`, { target_lead_id: target.id }), "Linked");
  }
  return (
    <div className="space-y-5" data-testid="lead-detail">
      <Link to="/founder" className="text-sm text-slate-400 inline-flex items-center gap-1"><ArrowLeft size={14} /> All leads</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl text-amber-300" data-testid="lead-detail-reference">{lead.reference}</h1>
        <StageBadge stage={lead.stage} />
        {lead.is_sample && <span className="text-xs px-2 py-0.5 rounded bg-slate-600/40">SAMPLE</span>}
        <span className="text-sm text-slate-400">{lead.channel_label} · {lead.service_label || "No service"}</span>
      </div>
      <h2 className="text-xl font-semibold">{lead.brief?.headline}</h2>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Pipeline lead={lead} save={save} />
          <Card title="Structured brief" testid="lead-brief">
            <dl className="space-y-3">{(lead.brief?.rows || []).map((r, i) => <div key={i}><dt className="text-xs text-slate-500">{r.q}</dt><dd className="text-slate-200 whitespace-pre-wrap">{r.a}</dd></div>)}</dl>
          </Card>
          <Qualification lead={lead} save={save} />
          <Activity lead={lead} post={post} />
        </div>
        <div className="space-y-5">
          <Card title="Contact" testid="lead-contact">
            <p className="font-semibold">{c.name}</p><p className="text-slate-400">{c.company}</p>
            {c.email && <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${lead.reference}`)}`} className="block text-amber-300 text-sm mt-2 break-all">{c.email}</a>}
            {c.phone && <a href={`tel:${c.phone}`} className="block text-amber-300 text-sm">{c.phone}</a>}
            {c.website && <p className="text-sm text-slate-400 break-all">{c.website}</p>}
            <label className="block text-xs text-slate-500 mt-3">Country
              <select value={c.country || ""} onChange={(e) => save({ country: e.target.value })} className={inp} data-testid="lead-country">
                <option value="">Not given</option>{["United States", "Canada", "Other"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
          </Card>
          <Card title="Source & timestamps" testid="lead-source">
            <dl className="text-sm space-y-1 text-slate-300">
              <div>Source: <span className="text-white">{lead.source}</span></div>
              <div>Landing page: {a.landing_page || "–"}</div>
              <div>Campaign: {a.utm_campaign || "–"}</div>
              <div>Created: <span className="font-mono text-xs">{lead.created_at}</span></div>
              <div>Updated: <span className="font-mono text-xs">{lead.updated_at}</span></div>
            </dl>
          </Card>
          <Delivery emails={d.emails} lead={lead} retry={(eid) => wrap(call("post", `/admin/leads/${id}/emails/${eid}/retry`), "Retry queued")}
            resend={() => { const unknown = lead.formspree?.status === "unknown"; if (unknown && !window.confirm("Checked the Formspree dashboard and it was NOT received?")) return; wrap(call("post", `/admin/leads/${id}/formspree/resend`, { confirmed_not_received: unknown })); }} />
          <Related related={d.related} link={link} unlink={() => wrap(call("post", `/admin/leads/${id}/unlink`), "Unlinked")} />
        </div>
      </div>
    </div>
  );
}
