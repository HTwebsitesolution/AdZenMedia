import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "./FounderLayout";
import { CaseStudyBody } from "@/pages/InfoPages";

export default function SystemPage() {
  const call = useAdmin();
  const [ints, setInts] = useState(null);
  const [drafts, setDrafts] = useState([]);
  useEffect(() => {
    call("get", "/admin/integrations").then(setInts);
    call("get", "/admin/drafts").then((r) => setDrafts(r.case_studies));
  }, [call]);

  async function clearSamples() {
    if (!window.confirm("Delete all sample leads? Real leads are not affected.")) return;
    const r = await call("delete", "/admin/samples");
    toast.success(`Deleted ${r.deleted} sample leads`);
  }

  return (
    <div className="space-y-8" data-testid="founder-system">
      <h1 className="text-3xl font-bold tracking-tight">System</h1>
      <section className="surface p-5" data-testid="integrations-status">
        <h2 className="text-lg font-semibold mb-3">Integrations</h2>
        {ints && (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {Object.entries(ints).map(([k, v]) => (
              <li key={k} className="rounded-lg border border-white/10 p-3" data-testid={`integration-${k}`}>
                <p className="font-semibold capitalize">{k.replace("_", " ")}</p>
                <p className={v.status === "configured" ? "text-emerald-300" : "text-slate-500"}>{v.status.replace("_", " ")}</p>
                {v.mode && <p className="text-xs text-slate-400">Mode: {v.mode}{v.mode === "test" && " (all email goes to the provider test inbox)"}</p>}
                {v.outbox && <p className="text-xs text-slate-400 font-mono">{Object.entries(v.outbox).map(([s, n]) => `${s}:${n}`).join(" ")}</p>}
                {"enabled" in v && <p className="text-xs text-slate-400">Calls {v.enabled ? "enabled" : "off"}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-4" data-testid="drafts-section">
        <h2 className="text-lg font-semibold">Draft case studies (not public)</h2>
        {drafts.map((c) => (
          <details key={c.slug} className="surface p-5" data-testid={`draft-${c.slug}`}>
            <summary className="cursor-pointer font-semibold">{c.title} <span className="text-xs text-amber-300 font-mono ml-2">{c.published ? "PUBLISHED" : "DRAFT"}</span></summary>
            <p className="text-sm text-slate-400 mt-2">Client: {c.client} · Approvals: {Object.entries(c.approval).map(([k, v]) => `${k} ${v ? "✓" : "✗"}`).join(", ")}</p>
            <div className="mt-4"><CaseStudyBody c={c} /></div>
          </details>
        ))}
      </section>
      <section className="surface p-5">
        <h2 className="text-lg font-semibold">Sample data</h2>
        <p className="text-sm text-slate-400 mt-1">Sample US and Canadian leads are marked SAMPLE. Delete them before going live.</p>
        <button onClick={clearSamples} className="btn-secondary mt-3 !py-2 text-sm" data-testid="delete-samples-btn">Delete sample leads</button>
      </section>
    </div>
  );
}
