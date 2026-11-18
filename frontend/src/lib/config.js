import { createContext, createElement, useContext, useEffect, useState } from "react";
import { api } from "./api";

const Ctx = createContext(null);

export function ConfigProvider({ children }) {
  const [cfg, setCfg] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let tries = 0;
    const load = () =>
      api.get("/public/config").then((r) => setCfg(r.data)).catch(() => {
        tries += 1;
        if (tries < 4) setTimeout(load, 1500);
        else setFailed(true);
      });
    load();
  }, []);
  return createElement(Ctx.Provider, { value: { cfg, failed } }, children);
}

export const useConfig = () => useContext(Ctx);

export function waLink(number, text) {
  const digits = (number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const telLink = (n) => `tel:${(n || "").replace(/[^\d+]/g, "")}`;

function zonedToUtc(dateStr, time, tz) {
  const guess = new Date(`${dateStr}T${time}:00Z`);
  const inTz = new Date(guess.toLocaleString("en-US", { timeZone: tz }));
  const inUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() - (inTz - inUtc));
}

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function availabilityText(raw) {
  try {
    const a = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    const fmt = { hour: "numeric", minute: "2-digit" };
    const start = zonedToUtc(today, a.start, a.timezone).toLocaleTimeString([], fmt);
    const end = zonedToUtc(today, a.end, a.timezone).toLocaleTimeString([], fmt);
    const days = (a.days || []).map((d) => DAY[d]).join(", ");
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${days}, ${start} – ${end} your time (${local})`;
  } catch {
    return "";
  }
}
