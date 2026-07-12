"use client";

export type ConversionEventName =
  | "primary_cta_click"
  | "diagnostic_started"
  | "diagnostic_step_viewed"
  | "diagnostic_completed"
  | "service_selected"
  | "booking_click";

export function trackConversionEvent(
  name: ConversionEventName,
  properties: Record<string, string | number | boolean> = {},
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("solutiogeniz:conversion", {
      detail: { name, properties },
    }),
  );

  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({
      event: name,
      ...properties,
    });
  }
}
