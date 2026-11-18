import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mic, PhoneOff } from "lucide-react";
import { api, track } from "@/lib/api";

const MESSAGES = {
  mic: "We couldn't access your microphone. You can allow it in your browser settings, or use the options below.",
  unavailable: "The AI assistant isn't available right now.",
  failed: "The call couldn't connect.",
};

export const VoiceAssistant = ({ recordingNotice }) => {
  const clientRef = useRef(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("idle");
  const [problem, setProblem] = useState("");

  useEffect(() => () => clientRef.current?.stopCall(), []);

  function fail(kind) {
    setStatus("error"); setProblem(MESSAGES[kind]); track("voice_fallback", "voice");
  }

  async function start() {
    setProblem(""); setStatus("connecting"); track("channel_click", "voice");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch { return fail("mic"); }
    let data;
    try {
      data = (await api.post("/voice/web-call", { consent: true, page: window.location.pathname })).data;
    } catch (e) { return fail(e?.response?.status === 503 ? "unavailable" : "failed"); }
    try {
      const { RetellWebClient } = await import("retell-client-js-sdk");
      const c = new RetellWebClient();
      clientRef.current = c;
      c.on("call_started", () => setStatus("live"));
      c.on("call_ended", () => setStatus("ended"));
      c.on("error", () => { c.stopCall(); fail("failed"); });
      await c.startCall({ accessToken: data.access_token });
    } catch { fail("failed"); }
  }

  const active = status === "connecting" || status === "live";
  return (
    <div className="space-y-4" data-testid="voice-assistant">
      <p className="text-sm text-slate-300">
        You'll talk to an <strong>AI assistant</strong>, not a person. It can explain our services and how quoting works, and pass your details to Joseph if you ask for a follow-up. It can't agree prices, deadlines or bookings.
      </p>
      <p className="text-xs text-slate-500" data-testid="voice-recording-notice">
        {recordingNotice || "The call is processed by our voice provider. We keep only a short summary and any contact details you agree to share, not the audio or transcript."} <Link to="/privacy" className="underline">Privacy</Link>
      </p>
      {!active && status !== "ended" && (
        <label className="flex items-start gap-3 text-sm text-slate-300">
          <input type="checkbox" className="mt-1 accent-amber-400" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="voice-consent-checkbox" />
          I understand I'm speaking with an AI assistant and agree to the notice above.
        </label>
      )}
      <div className="flex gap-3">
        {!active ? (
          <button type="button" disabled={!consent} onClick={start} className="btn-primary disabled:opacity-50" data-testid="voice-start-btn">
            <Mic size={16} /> {status === "ended" ? "Start another call" : "Talk to our AI assistant"}
          </button>
        ) : (
          <button type="button" onClick={() => clientRef.current?.stopCall()} className="btn-secondary" data-testid="voice-end-btn">
            {status === "connecting" ? <Loader2 size={16} className="animate-spin" /> : <PhoneOff size={16} />} {status === "connecting" ? "Connecting…" : "End call"}
          </button>
        )}
      </div>
      {status === "live" && <p className="text-sm text-emerald-300" role="status" data-testid="voice-live">Connected. Speak when you're ready.</p>}
      {status === "ended" && <p className="text-sm text-slate-400" role="status">Call ended. Thanks for talking with us.</p>}
      {problem && (
        <div role="alert" className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100" data-testid="voice-fallback">
          {problem} <a href="#contact-form-section" className="underline">Send a short message</a> or <Link to="/quote" className="underline">request a quote</Link> instead.
        </div>
      )}
    </div>
  );
};
