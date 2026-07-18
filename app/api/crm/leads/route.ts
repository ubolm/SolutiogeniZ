import { NextResponse } from "next/server";

import type { ChatbotLeadInterest } from "@/lib/chatbot";
import { createManualCrmLead } from "@/lib/crm-store";

type ManualLeadPayload = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  interest?: string;
  summary?: string;
  owner?: string;
  notes?: string;
};

const validInterests = new Set<ChatbotLeadInterest | "sin-definir">([
  "automatizaciones",
  "seguimiento",
  "chatbots",
  "herramientas-internas",
  "integraciones",
  "centralizacion",
  "diagnostico",
  "sin-definir",
]);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ManualLeadPayload | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer el lead manual." },
      { status: 400 },
    );
  }

  const name = String(body.name ?? "").trim();
  const company = String(body.company ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const interest = String(body.interest ?? "").trim() as
    | ChatbotLeadInterest
    | "sin-definir";
  const summary = String(body.summary ?? "").trim();
  const owner = String(body.owner ?? "").trim();
  const notes = String(body.notes ?? "").trim();

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Ingresá un nombre válido." },
      { status: 400 },
    );
  }

  if (company.length < 2) {
    return NextResponse.json(
      { error: "Ingresá una empresa válida." },
      { status: 400 },
    );
  }

  if (email && !emailPattern.test(email)) {
    return NextResponse.json(
      { error: "Ingresá un correo válido o dejalo vacío." },
      { status: 400 },
    );
  }

  if (summary.length < 10) {
    return NextResponse.json(
      { error: "Agregá un resumen un poco más claro del caso." },
      { status: 400 },
    );
  }

  if (!validInterests.has(interest)) {
    return NextResponse.json(
      { error: "Elegí un interés válido." },
      { status: 400 },
    );
  }

  const lead = await createManualCrmLead({
    name,
    company,
    email,
    phone,
    interest,
    summary,
    owner,
    notes,
  });

  return NextResponse.json({ ok: true, lead });
}
