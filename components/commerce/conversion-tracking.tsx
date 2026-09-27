"use client";

import { useState } from "react";
import { parseLifetimeStatus } from "@/lib/commerce/access-status";
import { verifiedPurchaseEvent } from "@/lib/commerce/meta-event";

type Pixel = ((...args: unknown[]) => void) & { queue: unknown[][]; callMethod?: (...args: unknown[]) => void; loaded: boolean; version: string; push: Pixel };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel; } }
const initialized = new Set<string>();
const recorded = new Set<string>();

function pixel(id: string) {
  if (!/^[0-9]+$/.test(id)) return null;
  if (!window.fbq) {
    const fn = function (...args: unknown[]) { if (fn.callMethod) fn.callMethod(...args); else fn.queue.push(args); } as Pixel;
    fn.queue = []; fn.loaded = true; fn.version = "2.0"; fn.push = fn;
    window.fbq = fn; window._fbq = fn;
    const script = document.createElement("script");
    script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  if (!initialized.has(id)) { window.fbq("init", id); initialized.add(id); }
  return window.fbq;
}

// No script or event is loaded until the visitor explicitly opts in here.
export function CheckoutLink({ href, needsLogin, testMode }: { href: string; needsLogin: boolean; testMode: boolean }) {
  const [consent, setConsent] = useState(false);
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
  return <>
    <a className="rounded-xl bg-primary px-5 py-4 text-center font-medium text-white" href={href} rel="noreferrer" onClick={() => {
      if (consent && !needsLogin && !testMode) pixel(pixelId)?.("track", "InitiateCheckout", { content_name: "Business Client OS lifetime", num_items: 1 });
    }}>{needsLogin ? "Sign in before checkout" : "Continue to secure checkout ↗"}</a>
    {pixelId && !needsLogin && !testMode && <label className="flex items-start gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />Allow optional Meta conversion measurement for this checkout.</label>}
  </>;
}

export function PurchaseTracking() {
  const [message, setMessage] = useState("");
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
  if (!/^[0-9]+$/.test(pixelId)) return null;
  async function allow() {
    try {
      // Recheck live server status, ignoring redirects and client-supplied order IDs.
      const response = await fetch("/api/commerce/status", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) return;
      const event = verifiedPurchaseEvent(parseLifetimeStatus(await response.json()));
      if (!event) return;
      const key = `${pixelId}:${event.eventId}`;
      let stored = false;
      try { stored = localStorage.getItem(key) === "sent"; } catch { /* Storage is optional. */ }
      if (!recorded.has(key) && !stored) {
        pixel(pixelId)?.("track", "Purchase", { value: event.value, currency: event.currency }, { eventID: event.eventId });
        recorded.add(key);
        try { localStorage.setItem(key, "sent"); } catch { /* In-memory deduplication remains. */ }
      }
      setMessage("Conversion measurement preference saved for this purchase.");
    } catch { setMessage("Measurement is unavailable. Your access is unchanged."); }
  }
  return <div className="text-sm text-muted-foreground"><button type="button" className="underline" onClick={allow}>Allow optional Meta purchase measurement</button><p role="status">{message}</p></div>;
}
