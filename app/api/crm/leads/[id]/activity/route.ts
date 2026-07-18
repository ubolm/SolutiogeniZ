import { NextResponse } from "next/server";

import { createCrmLeadActivity } from "@/lib/crm-store";

type ActivityPayload = {
  description?: string;
  kind?: string;
  nextActionAt?: string;
};

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
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
    });

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Lead not found."
        ? "No encontramos ese lead."
        : "No pudimos registrar la accion.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
