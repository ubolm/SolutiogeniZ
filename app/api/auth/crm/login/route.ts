import { NextResponse } from "next/server";

import {
  resolveCrmSafePathForRole,
  createCrmSessionToken,
  getCrmSessionCookieName,
  getCrmSessionMaxAge,
  isCrmAuthConfigured,
  resolveCrmIdentityFromEnv,
} from "@/lib/crm-auth";
import { resolveCrmIdentityFromDatabase } from "@/lib/crm-users";

type LoginPayload = {
  username?: string;
  password?: string;
  next?: string;
};

function resolveNextPath(value: string | undefined, role: "admin" | "vendedor") {
  if (!value || !value.startsWith("/crm")) {
    return resolveCrmSafePathForRole(role, "/crm");
  }

  return resolveCrmSafePathForRole(role, value);
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

  const identity =
    (await resolveCrmIdentityFromDatabase(username, password)) ??
    resolveCrmIdentityFromEnv(username, password);

  if (!identity) {
    return NextResponse.json(
      { error: "Usuario o clave incorrectos." },
      { status: 401 },
    );
  }

  const token = await createCrmSessionToken(identity);
  const response = NextResponse.json({
    ok: true,
    redirectTo: resolveNextPath(body.next, identity.role),
    role: identity.role,
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
