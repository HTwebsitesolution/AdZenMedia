import { useCallback, useEffect, useState } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { Show, UserButton, useAuth } from "@clerk/react";
import { api } from "@/lib/api";

export function useAdmin() {
  const { getToken } = useAuth();
  return useCallback(async (method, url, data, opts = {}) => {
    const token = await getToken();
    const r = await api.request({ method, url, data, headers: { Authorization: `Bearer ${token}` }, ...opts });
    return r.data;
  }, [getToken]);
}

const Gate = () => {
  const call = useAdmin();
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { call("get", "/me").then(setMe).catch((e) => setErr(e?.response?.data?.detail || "Could not verify access")); }, [call]);
  if (err) return <p className="p-10 text-rose-300" data-testid="founder-access-error">{err}</p>;
  if (!me) return <p className="p-10 text-slate-400">Checking access…</p>;
  if (me.role !== "admin") return (
    <div className="p-10 max-w-lg" data-testid="founder-access-restricted">
      <h1 className="text-2xl font-bold">Access restricted</h1>
      <p className="mt-2 text-slate-400">This dashboard is for the AdZenMedia founder only. Signed in as {me.email}.</p>
      <div className="mt-6"><UserButton /></div>
    </div>
  );
  const link = ({ isActive }) => `px-3 py-2 rounded-md text-sm ${isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`;
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-[#0A0D12]/90 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-amber-400">AZM · FOUNDER</span>
            <nav className="flex gap-1" aria-label="Dashboard">
              <NavLink end to="/founder" className={link} data-testid="founder-nav-leads">Leads</NavLink>
              <NavLink to="/founder/reports" className={link} data-testid="founder-nav-reports">Reports</NavLink>
              <NavLink to="/founder/system" className={link} data-testid="founder-nav-system">System</NavLink>
            </nav>
          </div>
          <UserButton />
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 py-8"><Outlet /></main>
    </div>
  );
};

export default function FounderLayout() {
  return (
    <>
      <Show when="signed-in"><Gate /></Show>
      <Show when="signed-out"><Navigate to="/sign-in" replace /></Show>
    </>
  );
}
