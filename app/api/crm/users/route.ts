import { NextResponse } from "next/server";

import {
  getCrmSessionCookieName,
  type CrmRole,
} from "@/lib/crm-auth";
import {
  getCrmTokenFromCookieHeader,
  verifyActiveCrmSessionToken,
} from "@/lib/crm-session";
import { createCrmUser, getCrmUsers } from "@/lib/crm-users";

type CreateUserPayload = {
  username?: string;
  password?: string;
  role?: string;
};

async function requireAdminSession(request: Request) {
  const token = getCrmTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await verifyActiveCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para administrar usuarios." },
      { status: 401 },
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Solo un admin puede administrar usuarios." },
      { status: 403 },
    );
  }

  return session;
}

export async function GET(request: Request) {
  const session = await requireAdminSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const users = await getCrmUsers();
  return NextResponse.json({ ok: true, users });
}

export async function POST(request: Request) {
  const session = await requireAdminSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const body = (await request.json().catch(() => null)) as CreateUserPayload | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer el usuario nuevo." },
      { status: 400 },
    );
  }

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "").trim();
  const role = body.role === "vendedor" ? "vendedor" : "admin";

  try {
    const user = await createCrmUser({
      username,
      password,
      role: role as CrmRole,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos crear el usuario.",
      },
      { status: 400 },
    );
  }
}
