import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "./FounderLayout";
import { ManualLeadDialog } from "./ManualLeadDialog";
import { useConfig } from "@/lib/config";

const STAGE_CLS = {
  New: "bg-sky-500/15 text-sky-300", Contacted: "bg-indigo-500/15 text-indigo-300", Qualified: "bg-amber-500/15 text-amber-300",
  "Proposal Sent": "bg-fuchsia-500/15 text-fuchsia-300", Won: "bg-emerald-500/15 text-emerald-300", Lost: "bg-slate-500/20 text-slate-400",
};
export const StageBadge = ({ stage }) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${STAGE_CLS[stage]}`}>{stage}</span>;

const sel = "bg-[#0F141C] border border-white/15 rounded-md px-3 py-2 text-sm";

export default function Dashboard() {
  const call = useAdmin();
  const { cfg } = useConfig() || {};
  const [f, setF] = useState({ q: "", stage: "", service: "", channel: "", country: "", overdue: false, include_samples: true });
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    call("get", "/admin/leads", null, { params: f }).then(setData).catch(() => toast.error("Could not load leads"));
  }, [call, f]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function exportCsv() {
    const blob = await call("get", "/admin/export.csv", null, { params: { include_samples: f.include_samples }, responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `adzenmedia-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const items = data?.items || [];
  return (
    <div className="space-y-6" data-testid="founder-dashboard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-slate-400 text-sm mt-1">{items.length} shown</p>
        </div>
        <div className="flex gap-2">
          <ManualLeadDialog onCreated={load} />
          <button onClick={exportCsv} className="btn-secondary !py-2 text-sm" data-testid="export-csv-btn"><Download size={16} /> Export CSV</button>
        </div>
      </div>
      {data?.overdue_count > 0 && (
        <button onClick={() => setF({ ...f, overdue: true })} className="w-full text-left rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 flex items-center gap-3 text-rose-200" data-testid="overdue-banner">
          <AlertTriangle size={18} /> {data.overdue_count} follow-up{data.overdue_count > 1 ? "s" : ""} overdue. Show them.
        </button>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={f.q} onChange={set("q")} placeholder="Search reference, name, company, brief…" className={`${sel} w-full pl-9`} data-testid="leads-search-input" />
        </div>
        <select value={f.stage} onChange={set("stage")} className={sel} data-testid="filter-stage" aria-label="Stage">
          <option value="">All stages</option>{(data?.stages || []).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={f.service} onChange={set("service")} className={sel} data-testid="filter-service" aria-label="Service">
          <option value="">All services</option>{(cfg?.services || []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={f.channel} onChange={set("channel")} className={sel} data-testid="filter-channel" aria-label="Channel">
          <option value="">All channels</option>
          {["quote_wizard", "contact_form", "systems_check", "voice_ai", "whatsapp", "phone", "email", "calendar", "other"].map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </select>
        <select value={f.country} onChange={set("country")} className={sel} data-testid="filter-country" aria-label="Country">
          <option value="">All countries</option>{["United States", "Canada", "Other"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-300"><Switch checked={f.overdue} onCheckedChange={(v) => setF({ ...f, overdue: v })} data-testid="filter-overdue" /> Overdue</label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><Switch checked={f.include_samples} onCheckedChange={(v) => setF({ ...f, include_samples: v })} data-testid="filter-samples" /> Samples</label>
      </div>
      <div className="surface overflow-x-auto">
        <table className="w-full text-sm" data-testid="leads-table">
          <thead className="text-left text-xs uppercase tracking-wider text-slate-500 font-mono">
            <tr>{["Reference", "Contact", "Brief", "Channel", "Source", "Country", "Stage", "Follow-up", "Created"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((l) => (
              <tr key={l.id} className="hover:bg-white/[0.03]" data-testid={`lead-row-${l.reference}`}>
                <td className="px-4 py-3 font-mono"><Link to={`/founder/leads/${l.id}`} className="text-amber-300 hover:underline">{l.reference}</Link>{l.is_sample && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-600/40 text-slate-300">SAMPLE</span>}</td>
                <td className="px-4 py-3"><div className="font-medium">{l.contact?.name}</div><div className="text-slate-500 text-xs">{l.contact?.company}</div></td>
                <td className="px-4 py-3 max-w-xs"><div className="truncate text-slate-300">{l.brief?.headline}</div><div className="truncate text-xs text-amber-200/80" data-testid="lead-row-services">{l.service_label}</div></td>
                <td className="px-4 py-3 text-slate-400">{l.channel_label}</td>
                <td className="px-4 py-3 text-slate-400">{l.source}</td>
                <td className="px-4 py-3 text-slate-400">{l.contact?.country || "–"}</td>
                <td className="px-4 py-3"><StageBadge stage={l.stage} /></td>
                <td className={`px-4 py-3 font-mono text-xs ${l.overdue ? "text-rose-300" : "text-slate-400"}`}>{l.follow_up_date || "–"}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
            {data && !items.length && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">No leads match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
