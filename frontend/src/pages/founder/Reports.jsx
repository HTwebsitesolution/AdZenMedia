import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "./FounderLayout";

const COLS = [["leads", "Leads"], ["qualified", "Qualified"], ["booked", "Booked calls"], ["proposals", "Proposals"], ["won", "Won"]];

const Table = ({ title, rows, testid }) => (
  <section className="surface overflow-x-auto" data-testid={testid}>
    <h2 className="px-5 pt-5 text-lg font-semibold">{title}</h2>
    <table className="w-full text-sm mt-3">
      <thead className="text-xs font-mono uppercase text-slate-500"><tr><th className="text-left px-5 py-2">Key</th>{COLS.map(([, l]) => <th key={l} className="text-right px-5 py-2">{l}</th>)}</tr></thead>
      <tbody className="divide-y divide-white/5">
        {Object.entries(rows).sort((a, b) => b[1].leads - a[1].leads).map(([k, v]) => (
          <tr key={k}><td className="px-5 py-2">{k}</td>{COLS.map(([c]) => <td key={c} className="text-right px-5 py-2 font-mono">{v[c]}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default function Reports() {
  const call = useAdmin();
  const [samples, setSamples] = useState(true);
  const [r, setR] = useState(null);
  useEffect(() => { call("get", "/admin/reports", null, { params: { include_samples: samples } }).then(setR); }, [call, samples]);
  if (!r) return <p className="text-slate-400">Loading…</p>;
  const ev = (type, channel) => r.events.filter((e) => e.type === type && (!channel || e.channel === channel)).reduce((s, e) => s + e.count, 0);
  const clicks = r.events.filter((e) => e.type === "channel_click");
  return (
    <div className="space-y-6" data-testid="founder-reports">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <label className="flex items-center gap-2 text-sm text-slate-300"><Switch checked={samples} onCheckedChange={setSamples} data-testid="reports-samples-toggle" /> Include sample leads</label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {COLS.map(([k, l]) => (
          <div key={k} className="surface p-5" data-testid={`report-total-${k}`}><p className="text-xs font-mono uppercase text-slate-500">{l}</p><p className="text-3xl font-bold mt-1">{r.totals[k]}</p></div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-3" data-testid="report-funnel">
        <div className="surface p-5"><p className="text-xs font-mono uppercase text-slate-500">Quote Wizard starts</p><p className="text-2xl font-bold">{ev("wizard_start")}</p></div>
        <div className="surface p-5"><p className="text-xs font-mono uppercase text-slate-500">Saved inquiries (site)</p><p className="text-2xl font-bold">{ev("lead_saved")}</p></div>
        <div className="surface p-5">
          <p className="text-xs font-mono uppercase text-slate-500">Contact-channel clicks</p>
          <ul className="mt-1 text-sm">{clicks.length ? clicks.map((c) => <li key={c.channel} className="flex justify-between"><span>{c.channel}</span><span className="font-mono">{c.count}</span></li>) : <li className="text-slate-500">None yet</li>}</ul>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Table title="By source" rows={r.by_source} testid="report-by-source" />
        <Table title="By country" rows={r.by_country} testid="report-by-country" />
      </div>
      <p className="text-xs text-slate-500">Clicks are counted as clicks only. Booked calls count only when confirmed on a lead. Analytics events contain no personal details.</p>
    </div>
  );
}
