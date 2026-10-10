"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { parseLifetimeStatus } from "@/lib/commerce/access-status";
import { verifiedPurchaseEvent } from "@/lib/commerce/meta-event";

type Pixel = ((...args: unknown[]) => void) & { queue: unknown[][]; callMethod?: (...args: unknown[]) => void; loaded: boolean; version: string; push: Pixel };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel; } }
const initialized = new Set<string>();
const recorded = new Set<string>();
const consentKey = "bcos-meta-consent-v1";
let memoryConsent = false;
let lastPage = "";
function consentSnapshot() {
  try { return localStorage.getItem(consentKey) === "granted"; } catch { return memoryConsent; }
}
function subscribe(callback: () => void) {
  window.addEventListener("bcos-consent", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("bcos-consent", callback); window.removeEventListener("storage", callback); };
}
function choiceSnapshot(): "granted" | "denied" | "unset" {
  try {
    const choice = localStorage.getItem(consentKey);
    return choice === "granted" || choice === "denied" ? choice : "unset";
  } catch {
    return memoryConsent ? "granted" : "unset";
  }
}
function useConsentChoice() { return useSyncExternalStore(subscribe, choiceSnapshot, () => "unset"); }
function useConsent() { return useConsentChoice() === "granted"; }
function setConsent(value: boolean) {
  memoryConsent = value;
  try { localStorage.setItem(consentKey, value ? "granted" : "denied"); } catch { /* In-memory consent remains usable. */ }
  window.fbq?.("consent", value ? "grant" : "revoke");
  if (!value) lastPage = "";
  window.dispatchEvent(new Event("bcos-consent"));
}
function pixel(id: string) {
  if (!/^[0-9]+$/.test(id) || !consentSnapshot()) return null;
  if (!window.fbq) {
    const fn = function (...args: unknown[]) { if (fn.callMethod) fn.callMethod(...args); else fn.queue.push(args); } as Pixel;
    fn.queue = []; fn.loaded = true; fn.version = "2.0"; fn.push = fn;
    window.fbq = fn; window._fbq = fn;
    const script = document.createElement("script");
    script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  if (!initialized.has(id)) {
    window.fbq("consent", "grant");
    window.fbq("init", id, {}, { autoConfig: false });
    window.fbq("set", "autoConfig", false, id);
    initialized.add(id);
  }
  return window.fbq;
}
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export function MetaMeasurement() {
  const choice = useConsentChoice();
  const consent = choice === "granted";
  const [showChoices, setShowChoices] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    // Public funnel only: never send workspace routes, IDs or records to Meta.
    const publicPage = ["/", "/checkout", "/thank-you", "/auth/login", "/auth/sign-up"].includes(pathname);
    if (!consent || !publicPage) { lastPage = ""; return; }
    if (lastPage !== pathname && pixel(pixelId)) {
      window.fbq?.("track", "PageView");
      if (pathname === "/") {
        window.fbq?.("track", "ViewContent", {
          content_name: "Business Client OS",
          content_category: "SaaS",
          content_ids: ["business-client-os-lifetime"],
          content_type: "product",
          value: 50,
          currency: "GBP",
        });
      }
      lastPage = pathname;
    }
  }, [consent, pathname]);
  if (!/^[0-9]+$/.test(pixelId)) return null;
  return (
    <aside aria-label="Cookie preferences" className="border-t bg-white px-5 py-3 text-center text-xs text-muted-foreground">
      {(choice === "unset" || showChoices) ? (
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p>We use optional cookies to understand visits and improve our advertising. You can accept or decline.</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="rounded border px-3 py-2" onClick={() => { setConsent(false); setShowChoices(false); }}>Decline</button>
            <button type="button" className="rounded bg-primary px-3 py-2 text-white" onClick={() => { setConsent(true); setShowChoices(false); }}>Accept</button>
          </div>
        </div>
      ) : (
        <button type="button" className="underline underline-offset-2" onClick={() => setShowChoices(true)}>Cookie settings</button>
      )}
    </aside>
  );
}

export function trackMetaRegistration() {
  pixel(pixelId)?.("track", "CompleteRegistration", {
    content_name: "Business Client OS account",
    status: true,
  });
}

export function CheckoutLink({ href, needsLogin, testMode }: { href: string; needsLogin: boolean; testMode: boolean }) {
  return <a className="rounded-xl bg-primary px-5 py-4 text-center font-medium text-white" href={href} rel="noreferrer" onClick={() => {
    if (!needsLogin && !testMode) pixel(pixelId)?.("track", "InitiateCheckout", { content_name: "Business Client OS lifetime", num_items: 1 });
  }}>{needsLogin ? "Sign in before checkout" : "Continue to secure checkout ↗"}</a>;
}

export function PurchaseTracking() {
  const consent = useConsent();
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!consent || !/^[0-9]+$/.test(pixelId)) return;
    let cancelled = false;
    async function measure() {
      try {
        const response = await fetch("/api/commerce/status", { cache: "no-store", credentials: "same-origin" });
        if (!response.ok || cancelled || !consentSnapshot()) return;
        const event = verifiedPurchaseEvent(parseLifetimeStatus(await response.json()));
        if (!event || cancelled || !consentSnapshot()) return;
        const key = `${pixelId}:${event.eventId}`;
        let stored = false;
        try { stored = localStorage.getItem(key) === "sent"; } catch { /* Storage is optional. */ }
        if (!recorded.has(key) && !stored && pixel(pixelId)) {
          window.fbq?.("track", "Purchase", { value: event.value, currency: event.currency }, { eventID: event.eventId });
          recorded.add(key);
          try { localStorage.setItem(key, "sent"); } catch { /* In-memory deduplication remains. */ }
        }
      } catch { if (!cancelled) setMessage("Measurement is unavailable. Your access is unchanged."); }
    }
    void measure();
    return () => { cancelled = true; };
  }, [consent]);
  return message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null;
}
