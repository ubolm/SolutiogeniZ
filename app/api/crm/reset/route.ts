import { NextResponse } from "next/server";

import {
  getCrmTokenFromCookieHeader,
  verifyActiveCrmSessionToken,
} from "@/lib/crm-session";
import { clearCrmOperationalData } from "@/lib/crm-store";

async function requireAdminSession(request: Request) {
  const token = getCrmTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await verifyActiveCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para limpiar el CRM." },
      { status: 401 },
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Solo un admin puede limpiar el CRM." },
      { status: 403 },
    );
  }

  return session;
}

export async function POST(request: Request) {
  const session = await requireAdminSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  try {
    await clearCrmOperationalData();

    return NextResponse.json({
      ok: true,
      message: "CRM limpiado. Usuarios y seguridad conservados.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos limpiar la base del CRM.",
      },
      { status: 400 },
    );
  }
}
