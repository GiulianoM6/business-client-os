"use client";

import { useEffect } from "react";
type Fbq = (...args: unknown[]) => void;


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
    const fbq = (window as Window & { fbq?: Fbq }).fbq;

if (typeof fbq !== "function") {
  return;
}

    const params: Record<string, unknown> = {
      currency,
    };

    if (typeof value === "number") {
      params.value = value;
    }

    if (eventName === "Purchase" && eventId) {
      fbq(
        "track",
        "Purchase",
        params,
        { eventID: eventId },
      );
      return;
    }

    fbq("track", eventName, params);
  }, [currency, eventId, eventName, value]);

  return null;
}
