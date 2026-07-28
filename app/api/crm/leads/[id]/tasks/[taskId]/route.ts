import { NextResponse } from "next/server";

import {
  getCrmRoleCapabilities,
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";
import { getCrmLeadDetailForSession, updateCrmTask } from "@/lib/crm-store";

export async function PATCH(
  request: Request,
  context: { params: { id: string; taskId: string } },
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
      { error: "Sesion requerida para actualizar tareas." },
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

  if (!capabilities.canUpdateLeadTasks) {
    return NextResponse.json(
      { error: "No tienes permiso para actualizar tareas en este lead." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { status?: string }
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer la actualizacion de la tarea." },
      { status: 400 },
    );
  }

  const status = body.status === "hecha" ? "hecha" : "pendiente";

  try {
    const task = await updateCrmTask({
      leadId: context.params.id,
      taskId: context.params.taskId,
      status,
    });

    return NextResponse.json({ ok: true, task });
  } catch {
    return NextResponse.json(
      { error: "No pudimos actualizar la tarea." },
      { status: 400 },
    );
  }
}
