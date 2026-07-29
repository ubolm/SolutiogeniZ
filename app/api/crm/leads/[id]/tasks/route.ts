import { NextResponse } from "next/server";

import {
  getCrmRoleCapabilities,
  getCrmSessionCookieName,
} from "@/lib/crm-auth";
import {
  getCrmTokenFromCookieHeader,
  verifyActiveCrmSessionToken,
} from "@/lib/crm-session";
import { createCrmTask, getCrmLeadDetailForSession } from "@/lib/crm-store";

type TaskPayload = {
  title?: string;
  type?: string;
  dueAt?: string;
};

const validTaskTypes = new Set([
  "llamada",
  "reunion",
  "propuesta",
  "seguimiento",
  "otro",
]);

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const token = getCrmTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await verifyActiveCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para crear tareas." },
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

  if (!capabilities.canCreateLeadTasks) {
    return NextResponse.json(
      { error: "No tienes permiso para crear tareas en este lead." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as TaskPayload | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer la tarea." },
      { status: 400 },
    );
  }

  const title = String(body.title ?? "").trim();
  const type = String(body.type ?? "").trim();
  const dueAt = String(body.dueAt ?? "").trim();

  if (title.length < 4) {
    return NextResponse.json(
      { error: "Escribi una tarea un poco mas clara." },
      { status: 400 },
    );
  }

  if (!validTaskTypes.has(type)) {
    return NextResponse.json(
      { error: "Elegi un tipo de tarea valido." },
      { status: 400 },
    );
  }

  if (!isValidDate(dueAt)) {
    return NextResponse.json(
      { error: "Defini una fecha valida para la tarea." },
      { status: 400 },
    );
  }

  try {
    const task = await createCrmTask({
      leadId: context.params.id,
      title,
      type: type as
        | "llamada"
        | "reunion"
        | "propuesta"
        | "seguimiento"
        | "otro",
      dueAt,
    });

    return NextResponse.json({ ok: true, task });
  } catch {
    return NextResponse.json(
      { error: "No pudimos crear la tarea." },
      { status: 400 },
    );
  }
}
