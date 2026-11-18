import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const api = axios.create({ baseURL: API, timeout: 20000 });

const ATTR_KEY = "azm_attr";

export function captureAttribution() {
  if (sessionStorage.getItem(ATTR_KEY)) return;
  const p = new URLSearchParams(window.location.search);
  const attr = {
    landing_page: window.location.pathname,
    referrer: document.referrer ? document.referrer.split("?")[0].slice(0, 300) : null,
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
  };
  sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
}

export const getAttribution = () => JSON.parse(sessionStorage.getItem(ATTR_KEY) || "{}");

export function track(type, channel) {
  const a = getAttribution();
  api.post("/events", { type, channel, page: window.location.pathname, source: a.utm_source || null }).catch(() => {});
}

export function idemKey(scope) {
  const k = `azm_idem_${scope}`;
  let v = sessionStorage.getItem(k);
  if (!v) {
    v = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`).replace(/-/g, "");
    sessionStorage.setItem(k, v);
  }
  return v;
}

export const resetIdem = (scope) => sessionStorage.removeItem(`azm_idem_${scope}`);

export function errorMap(err) {
  const d = err?.response?.data?.detail;
  if (!Array.isArray(d)) return {};
  const out = {};
  d.forEach((e) => {
    const loc = (e.loc || []).filter((x) => x !== "body").join(".");
    out[loc] = e.msg;
  });
  return out;
}

export function errorText(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return "Please check the highlighted fields.";
  if (!err?.response) return "We couldn't reach our server. Your answers are kept, so you can try again.";
  return "Something went wrong. Your answers are kept, so you can try again.";
}
