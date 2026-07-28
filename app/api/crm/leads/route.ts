import { NextResponse } from "next/server";

import type { ChatbotLeadInterest } from "@/lib/chatbot";
import {
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";
import { createManualCrmLead } from "@/lib/crm-store";
import {
  getAssignableCrmUsers,
  type CrmUserSummary,
} from "@/lib/crm-users";

type ManualLeadPayload = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  interest?: string;
  summary?: string;
  owner?: string;
  notes?: string;
  nextActionAt?: string;
  customerContext?: {
    detectedProblems?: string;
    capturedMetrics?: string;
    verbatimQuotes?: string;
    diagnosedSystems?: string;
    objections?: string;
  };
  extendedProfile?: {
    profileUrl?: string;
    sector?: string;
    locality?: string;
    address?: string;
    route?: string;
    publicChannel?: string;
    opportunityDetected?: string;
    initialOffer?: string;
    recommendedDemo?: string;
    stage2?: string;
    stage3?: string;
  };
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

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export async function POST(request: Request) {
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
      { error: "Sesion requerida para crear leads manuales." },
      { status: 401 },
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Solo un admin puede crear leads manuales." },
      { status: 403 },
    );
  }

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
  const nextActionAt =
    typeof body.nextActionAt === "string" && isValidDate(body.nextActionAt)
      ? body.nextActionAt
      : undefined;
  const customerContext =
    body.customerContext && typeof body.customerContext === "object"
      ? {
          detectedProblems: String(
            body.customerContext.detectedProblems ?? "",
          ).trim(),
          capturedMetrics: String(
            body.customerContext.capturedMetrics ?? "",
          ).trim(),
          verbatimQuotes: String(
            body.customerContext.verbatimQuotes ?? "",
          ).trim(),
          diagnosedSystems: String(
            body.customerContext.diagnosedSystems ?? "",
          ).trim(),
          objections: String(body.customerContext.objections ?? "").trim(),
        }
      : undefined;
  const extendedProfile =
    body.extendedProfile && typeof body.extendedProfile === "object"
      ? {
          profileUrl: String(body.extendedProfile.profileUrl ?? "").trim(),
          sector: String(body.extendedProfile.sector ?? "").trim(),
          locality: String(body.extendedProfile.locality ?? "").trim(),
          address: String(body.extendedProfile.address ?? "").trim(),
          route: String(body.extendedProfile.route ?? "").trim(),
          publicChannel: String(
            body.extendedProfile.publicChannel ?? "",
          ).trim(),
          opportunityDetected: String(
            body.extendedProfile.opportunityDetected ?? "",
          ).trim(),
          initialOffer: String(body.extendedProfile.initialOffer ?? "").trim(),
          recommendedDemo: String(
            body.extendedProfile.recommendedDemo ?? "",
          ).trim(),
          stage2: String(body.extendedProfile.stage2 ?? "").trim(),
          stage3: String(body.extendedProfile.stage3 ?? "").trim(),
        }
      : undefined;

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Ingresa un nombre valido." },
      { status: 400 },
    );
  }

  if (company.length < 2) {
    return NextResponse.json(
      { error: "Ingresa una empresa valida." },
      { status: 400 },
    );
  }

  if (email && !emailPattern.test(email)) {
    return NextResponse.json(
      { error: "Ingresa un correo valido o dejalo vacio." },
      { status: 400 },
    );
  }

  if (summary.length < 10) {
    return NextResponse.json(
      { error: "Agrega un resumen un poco mas claro del caso." },
      { status: 400 },
    );
  }

  if (!validInterests.has(interest)) {
    return NextResponse.json(
      { error: "Elige un interes valido." },
      { status: 400 },
    );
  }

  const assignableUsers = await getAssignableCrmUsers();
  const validOwners = new Set(
    assignableUsers.map((user: CrmUserSummary) => user.username),
  );

  if (owner && owner !== "Sin asignar" && !validOwners.has(owner)) {
    return NextResponse.json(
      { error: "Selecciona un responsable valido del CRM." },
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
    nextActionAt,
    customerContext,
    extendedProfile,
  });

  return NextResponse.json({ ok: true, lead });
}
