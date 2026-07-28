import { NextResponse } from "next/server";

import { crmLeadStatuses, type ChatbotLeadStatus } from "@/lib/chatbot";
import {
  getCrmRoleCapabilities,
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";
import {
  createCrmLeadActivity,
  getCrmLeadDetailForSession,
} from "@/lib/crm-store";

type ActivityPayload = {
  description?: string;
  kind?: string;
  nextActionAt?: string;
  status?: string;
};

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${getCrmSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  const session = await verifyCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para registrar acciones." },
      { status: 401 },
    );
  }

  const detail = await getCrmLeadDetailForSession(context.params.id, session);

  if (!detail) {
    return NextResponse.json(
      { error: "No tienes acceso a este lead." },
      { status: 404 },
    );
  }

  const capabilities = getCrmRoleCapabilities(session.role);

  if (!capabilities.canCreateLeadActivity) {
    return NextResponse.json(
      { error: "No tienes permiso para registrar actividad en este lead." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as ActivityPayload | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer la accion rapida." },
      { status: 400 },
    );
  }

  const description = String(body.description ?? "").trim();
  const kind = body.kind === "contact" ? "contact" : "note";
  const nextActionAt =
    typeof body.nextActionAt === "string" && isValidDate(body.nextActionAt)
      ? body.nextActionAt
      : undefined;
  const status =
    typeof body.status === "string" &&
    crmLeadStatuses.includes(body.status as ChatbotLeadStatus)
      ? (body.status as ChatbotLeadStatus)
      : undefined;

  if (status !== undefined && !capabilities.canEditLeadStatus) {
    return NextResponse.json(
      { error: "No tienes permiso para cambiar la etapa de este lead." },
      { status: 403 },
    );
  }

  if (description.length < 4) {
    return NextResponse.json(
      { error: "Escribi una nota breve para registrar la accion." },
      { status: 400 },
    );
  }

  try {
    const lead = await createCrmLeadActivity({
      leadId: context.params.id,
      description,
      kind,
      nextActionAt,
      status,
    });

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    const message = (() => {
      if (!(error instanceof Error)) {
        return "No pudimos registrar la accion.";
      }

      if (error.message === "Lead not found.") {
        return "No encontramos ese lead.";
      }

      if (error.message === "Next action required.") {
        return "Cada contacto debe cerrar con una proxima accion agendada.";
      }

      return "No pudimos registrar la accion.";
    })();

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
