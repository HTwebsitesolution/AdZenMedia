import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdmin } from "./FounderLayout";
import { useConfig } from "@/lib/config";

const inp = "w-full bg-[#0F141C] border border-white/15 rounded-md px-3 py-2 text-sm";

export const ManualLeadDialog = ({ onCreated }) => {
  const call = useAdmin();
  const nav = useNavigate();
  const { cfg } = useConfig() || {};
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ channel: "phone", service: "", summary: "", source: "", name: "", email: "", company: "", phone: "", country: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    const contact = Object.fromEntries(["name", "email", "company", "phone", "country"].filter((k) => f[k]).map((k) => [k, f[k]]));
    try {
      const r = await call("post", "/admin/leads", { channel: f.channel, service: f.service || null, summary: f.summary, source: f.source || null, contact });
      toast.success(`Saved ${r.reference}`);
      setOpen(false); onCreated?.(); nav(`/founder/leads/${r.id}`);
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(Array.isArray(d) ? d.map((x) => x.msg).join(", ") : d || "Could not save");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="btn-primary !py-2 text-sm" data-testid="manual-lead-btn"><Plus size={16} /> Add inquiry</button>
      </DialogTrigger>
      <DialogContent className="dash bg-[#131924] text-white border-white/10 max-w-lg">
        <DialogHeader><DialogTitle>Log a phone, WhatsApp or email inquiry</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3" data-testid="manual-lead-form">
          <div className="grid grid-cols-2 gap-3">
            <select value={f.channel} onChange={set("channel")} className={inp} data-testid="manual-channel" aria-label="Channel">
              {["phone", "whatsapp", "email", "calendar", "other"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={f.service} onChange={set("service")} className={inp} data-testid="manual-service" aria-label="Service">
              <option value="">Service (optional)</option>{(cfg?.services || []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <input required placeholder="Name *" value={f.name} onChange={set("name")} className={inp} data-testid="manual-name" />
            <input placeholder="Company" value={f.company} onChange={set("company")} className={inp} data-testid="manual-company" />
            <input type="email" placeholder="Email" value={f.email} onChange={set("email")} className={inp} data-testid="manual-email" />
            <input placeholder="Phone" value={f.phone} onChange={set("phone")} className={inp} data-testid="manual-phone" />
            <select value={f.country} onChange={set("country")} className={inp} data-testid="manual-country" aria-label="Country">
              <option value="">Country</option>{["United States", "Canada", "Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <input placeholder="Source (e.g. referral)" value={f.source} onChange={set("source")} className={inp} data-testid="manual-source" />
          </div>
          <textarea required minLength={3} rows={4} placeholder="What did they ask for? *" value={f.summary} onChange={set("summary")} className={inp} data-testid="manual-summary" />
          <button className="btn-primary w-full" data-testid="manual-save-btn">Save inquiry</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
