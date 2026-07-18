import { NextResponse } from "next/server";

import { crmLeadStatuses, type ChatbotLeadStatus } from "@/lib/chatbot";
import { updateCrmLead } from "@/lib/crm-store";

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  const body = (await request.json().catch(() => null)) as
    | {
        status?: string;
        owner?: string;
        nextActionAt?: string;
        notes?: string;
      }
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer la actualizacion del lead." },
      { status: 400 },
    );
  }

  const status =
    typeof body.status === "string" &&
    crmLeadStatuses.includes(body.status as ChatbotLeadStatus)
      ? (body.status as ChatbotLeadStatus)
      : undefined;

  const owner = typeof body.owner === "string" ? body.owner : undefined;
  const notes = typeof body.notes === "string" ? body.notes : undefined;
  const nextActionAt =
    typeof body.nextActionAt === "string" && isValidDate(body.nextActionAt)
      ? body.nextActionAt
      : undefined;

  try {
    const lead = await updateCrmLead({
      id: context.params.id,
      status,
      owner,
      nextActionAt,
      notes,
    });

    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json(
      { error: "No pudimos actualizar ese lead." },
      { status: 404 },
    );
  }
}

