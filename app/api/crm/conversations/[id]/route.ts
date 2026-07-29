import { NextResponse } from "next/server";

import { getCrmSessionCookieName } from "@/lib/crm-auth";
import {
  getCrmTokenFromCookieHeader,
  verifyActiveCrmSessionToken,
} from "@/lib/crm-session";
import { updateCrmConversationControl } from "@/lib/crm-store";

type ConversationControlPayload = {
  action?: string;
};

async function requireSession(request: Request) {
  const token = getCrmTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await verifyActiveCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para administrar conversaciones." },
      { status: 401 },
    );
  }

  return session;
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  const session = await requireSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const body = (await request.json().catch(() => null)) as ConversationControlPayload | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer la accion sobre la conversacion." },
      { status: 400 },
    );
  }

  const action =
    body.action === "take" || body.action === "reactivate-bot"
      ? body.action
      : null;

  if (!action) {
    return NextResponse.json(
      { error: "La accion solicitada no es valida." },
      { status: 400 },
    );
  }

  try {
    const conversation = await updateCrmConversationControl({
      conversationId: context.params.id,
      actorUsername: session.username,
      actorUserId: session.userId,
      action,
    });

    return NextResponse.json({ ok: true, conversation });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos actualizar la conversacion.",
      },
      { status: 400 },
    );
  }
}
