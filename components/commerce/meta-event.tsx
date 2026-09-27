"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type MetaEventProps = {
  eventName: "InitiateCheckout" | "Purchase";
  value?: number;
  currency?: string;
  eventId?: string;
};

export function MetaEvent({
  eventName,
  value,
  currency = "GBP",
  eventId,
}: MetaEventProps) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fbq !== "function") {
      return;
    }

    const params: Record<string, unknown> = {
      currency,
    };

    if (typeof value === "number") {
      params.value = value;
    }

    if (eventName === "Purchase" && eventId) {
      window.fbq(
        "track",
        "Purchase",
        params,
        { eventID: eventId },
      );
      return;
    }

    window.fbq("track", eventName, params);
  }, [currency, eventId, eventName, value]);

  return null;
}