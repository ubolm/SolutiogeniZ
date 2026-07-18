import { NextResponse } from "next/server";

import { getCrmSessionCookieName } from "@/lib/crm-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: getCrmSessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
