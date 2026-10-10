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
    <>
      {(choice === "unset" || showChoices) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#030712]/75 p-4 backdrop-blur-sm">
          <aside aria-label="Cookie preferences" role="dialog" aria-modal="true" aria-labelledby="cookie-heading" className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-violet-400/25 bg-gradient-to-br from-[#171b32] via-[#111526] to-[#0c1020] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.55)] sm:p-9">
            <div className="pointer-events-none absolute -left-16 top-8 h-52 w-52 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
              <div aria-hidden="true" className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-7xl shadow-[0_0_45px_rgba(139,92,246,0.22)] sm:h-36 sm:w-36 sm:text-8xl">🍪</div>
              <div className="w-full">
                <h2 id="cookie-heading" className="mb-3 text-center text-2xl font-bold tracking-tight sm:text-left sm:text-3xl">We use cookies 🍪</h2>
                <p className="mb-5 text-center text-sm leading-6 text-slate-300 sm:text-left sm:text-base">We use optional cookies to understand how visitors use our site and improve our advertising. You can accept or decline at any time.</p>
                <div className="flex gap-3">
                  <button type="button" className="flex-1 rounded-xl border border-slate-500/70 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20" onClick={() => { setConsent(false); setShowChoices(false); }}>Decline</button>
                  <button type="button" className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-[0_0_24px_rgba(109,40,217,0.4)] transition hover:from-violet-500 hover:to-indigo-500" onClick={() => { setConsent(true); setShowChoices(false); }}>Accept →</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
      {choice !== "unset" && !showChoices && (
        <button type="button" className="fixed bottom-4 right-4 z-[9998] rounded-full border border-violet-400/40 bg-[#171b32] px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-[#242944] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400" onClick={() => setShowChoices(true)} aria-label="Open cookie settings">Cookie settings</button>
      )}
    </>
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
