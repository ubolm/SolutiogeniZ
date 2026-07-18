import { NextResponse } from "next/server";

import { updateCrmTask } from "@/lib/crm-store";

export async function PATCH(
  request: Request,
  context: { params: { id: string; taskId: string } },
) {
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
