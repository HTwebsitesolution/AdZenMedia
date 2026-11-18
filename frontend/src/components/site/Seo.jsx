import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const CANONICAL_ORIGIN = "https://adzenmedia.com";

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export const Seo = ({ title, description, noindex = false }) => {
  const { pathname } = useLocation();
  useEffect(() => {
    const full = title ? `${title} | AdZenMedia` : "AdZenMedia | Digital systems for service businesses";
    document.title = full;
    setMeta("name", "description", description || "");
    setMeta("property", "og:title", full);
    setMeta("property", "og:description", description || "");
    setMeta("property", "og:url", CANONICAL_ORIGIN + pathname);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", "summary");
    const isCanonicalHost = window.location.hostname.replace(/^www\./, "") === "adzenmedia.com";
    setMeta("name", "robots", noindex || !isCanonicalHost ? "noindex, nofollow" : "index, follow");
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = CANONICAL_ORIGIN + (pathname === "/" ? "/" : pathname.replace(/\/$/, ""));
  }, [title, description, noindex, pathname]);
  return null;
};
