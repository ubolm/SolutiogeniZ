import { NextResponse } from "next/server";

import {
  createCrmSessionToken,
  getCrmSessionCookieName,
  getCrmSessionMaxAge,
  isCrmAuthConfigured,
  isValidCrmCredentials,
} from "@/lib/crm-auth";

type LoginPayload = {
  username?: string;
  password?: string;
  next?: string;
};

function resolveNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/crm")) {
    return "/crm";
  }

  return value;
}

export async function POST(request: Request) {
  if (!isCrmAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "La seguridad del CRM no esta configurada. Define CRM_AUTH_USER, CRM_AUTH_PASSWORD y CRM_AUTH_SECRET.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as LoginPayload | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer el acceso al CRM." },
      { status: 400 },
    );
  }

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "").trim();

  if (!isValidCrmCredentials(username, password)) {
    return NextResponse.json(
      { error: "Usuario o clave incorrectos." },
      { status: 401 },
    );
  }

  const token = await createCrmSessionToken(username);
  const response = NextResponse.json({
    ok: true,
    redirectTo: resolveNextPath(body.next),
  });

  response.cookies.set({
    name: getCrmSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getCrmSessionMaxAge(),
  });

  return response;
}
