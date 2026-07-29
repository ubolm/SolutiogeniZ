import { NextResponse } from "next/server";

import {
  type CrmRole,
} from "@/lib/crm-auth";
import {
  getCrmTokenFromCookieHeader,
  verifyActiveCrmSessionToken,
} from "@/lib/crm-session";
import { deleteCrmUser, updateCrmUser } from "@/lib/crm-users";

type UpdateUserPayload = {
  role?: string;
  isActive?: boolean;
  password?: string;
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

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  const session = await requireAdminSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const body = (await request.json().catch(() => null)) as UpdateUserPayload | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer la actualizacion del usuario." },
      { status: 400 },
    );
  }

  const role =
    body.role === "admin" || body.role === "vendedor"
      ? (body.role as CrmRole)
      : undefined;
  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : undefined;
  const password =
    typeof body.password === "string" ? body.password.trim() : undefined;

  try {
    const user = await updateCrmUser(context.params.id, {
      role,
      isActive,
      password,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos actualizar el usuario.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } },
) {
  const session = await requireAdminSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const user = await deleteCrmUser(context.params.id, {
      actorUserId: session.userId,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos eliminar el usuario.",
      },
      { status: 400 },
    );
  }
}
