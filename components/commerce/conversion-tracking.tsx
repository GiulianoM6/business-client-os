"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { parseLifetimeStatus } from "@/lib/commerce/access-status";
import { verifiedPurchaseEvent } from "@/lib/commerce/meta-event";

type Pixel = ((...args: unknown[]) => void) & { queue: unknown[][]; callMethod?: (...args: unknown[]) => void; loaded: boolean; version: string; push: Pixel };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel; } }
const initialized = new Set<string>();
const recorded = new Set<string>();
const consentKey = "bcos-meta-consent-v3";
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
  return choice === "unset" ? (
    <aside aria-label="Cookie preferences" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[9999] mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#141827] p-4 text-white shadow-[0_12px_55px_rgba(0,0,0,0.45)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <p className="flex-1 text-sm leading-5 text-slate-200">
          <span className="font-semibold text-white">Your privacy matters.</span>{" "}
          Allow optional cookies to help us measure visits and improve our ads.
        </p>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <button type="button" className="min-h-11 flex-1 rounded-xl border border-slate-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:flex-none" onClick={() => setConsent(false)}>Decline</button>
          <button type="button" className="min-h-11 flex-1 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 sm:flex-none" onClick={() => setConsent(true)}>Accept</button>
        </div>
      </div>
    </aside>
  ) : null;
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
