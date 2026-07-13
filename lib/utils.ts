export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getBookingHref() {
  return process.env.NEXT_PUBLIC_BOOKING_URL || "#contacto";
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://solutiogeniz.com"
      : "http://localhost:3000")
  );
}
