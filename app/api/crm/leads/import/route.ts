import { NextResponse } from "next/server";

import type { ChatbotLeadInterest } from "@/lib/chatbot";
import {
  getCrmRoleCapabilities,
} from "@/lib/crm-auth";
import {
  getCrmTokenFromCookieHeader,
  verifyActiveCrmSessionToken,
} from "@/lib/crm-session";
import { getImportRowIssues } from "@/lib/crm-import";
import { createManualCrmLead } from "@/lib/crm-store";
import {
  getAssignableCrmUsers,
  type CrmUserSummary,
} from "@/lib/crm-users";

type ImportLeadRow = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  interest?: string;
  owner?: string;
  summary?: string;
  notes?: string;
  nextActionAt?: string;
  customerContext?: {
    detectedProblems?: string;
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

type ImportPayload = {
  rows?: ImportLeadRow[];
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

function buildSummary(row: ImportLeadRow) {
  const directSummary = String(row.summary ?? "").trim();

  if (directSummary.length >= 10) {
    return directSummary;
  }

  const fromProblem = String(row.customerContext?.detectedProblems ?? "").trim();

  if (fromProblem.length >= 10) {
    return fromProblem;
  }

  const company = String(row.company ?? "").trim();

  return `Lead importado desde CSV para ${company || "empresa sin definir"}.`;
}

export async function POST(request: Request) {
  const token = getCrmTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await verifyActiveCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para importar leads." },
      { status: 401 },
    );
  }

  const capabilities = getCrmRoleCapabilities(session.role);

  if (!capabilities.canCreateManualLeads) {
    return NextResponse.json(
      { error: "No tienes permiso para importar leads." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as ImportPayload | null;

  if (!body || !Array.isArray(body.rows)) {
    return NextResponse.json(
      { error: "No pudimos leer las filas del CSV." },
      { status: 400 },
    );
  }

  if (body.rows.length === 0) {
    return NextResponse.json(
      { error: "Carga al menos una fila para importar." },
      { status: 400 },
    );
  }

  if (body.rows.length > 500) {
    return NextResponse.json(
      { error: "Por ahora puedes importar hasta 500 filas por vez." },
      { status: 400 },
    );
  }

  const blockingErrors = body.rows
    .flatMap((row, index) =>
      getImportRowIssues({
        name: String(row.name ?? "").trim(),
        company: String(row.company ?? "").trim(),
        email: String(row.email ?? "").trim(),
        phone: String(row.phone ?? "").trim(),
        interest: String(row.interest ?? "").trim(),
        owner: String(row.owner ?? "").trim(),
        summary: String(row.summary ?? "").trim(),
        notes: String(row.notes ?? "").trim(),
        nextActionAt: String(row.nextActionAt ?? "").trim(),
        customerContext: {
          detectedProblems: String(
            row.customerContext?.detectedProblems ?? "",
          ).trim(),
          diagnosedSystems: String(
            row.customerContext?.diagnosedSystems ?? "",
          ).trim(),
          objections: String(row.customerContext?.objections ?? "").trim(),
        },
        extendedProfile: {
          profileUrl: String(row.extendedProfile?.profileUrl ?? "").trim(),
          sector: String(row.extendedProfile?.sector ?? "").trim(),
          locality: String(row.extendedProfile?.locality ?? "").trim(),
          address: String(row.extendedProfile?.address ?? "").trim(),
          route: String(row.extendedProfile?.route ?? "").trim(),
          publicChannel: String(row.extendedProfile?.publicChannel ?? "").trim(),
          opportunityDetected: String(
            row.extendedProfile?.opportunityDetected ?? "",
          ).trim(),
          initialOffer: String(row.extendedProfile?.initialOffer ?? "").trim(),
          recommendedDemo: String(
            row.extendedProfile?.recommendedDemo ?? "",
          ).trim(),
          stage2: String(row.extendedProfile?.stage2 ?? "").trim(),
          stage3: String(row.extendedProfile?.stage3 ?? "").trim(),
        },
      })
        .filter((issue) => issue.tone === "error")
        .map((issue) => `Fila ${index + 2}: ${issue.message}`),
    )
    .slice(0, 10);

  if (blockingErrors.length > 0) {
    return NextResponse.json(
      {
        error:
          "Hay filas con error. Corrigelas en la vista previa antes de importar.",
        errors: blockingErrors,
      },
      { status: 400 },
    );
  }

  const assignableUsers = await getAssignableCrmUsers();
  const validOwners = new Set(
    assignableUsers.map((user: CrmUserSummary) => user.username),
  );
  const errors: string[] = [];
  let importedCount = 0;

  for (const [index, row] of body.rows.entries()) {
    const rowNumber = index + 2;
    const name = String(row.name ?? "").trim();
    const company = String(row.company ?? "").trim();
    const email = String(row.email ?? "").trim();
    const phone = String(row.phone ?? "").trim();
    const interest = String(row.interest ?? "sin-definir").trim() as
      | ChatbotLeadInterest
      | "sin-definir";
    const owner = String(row.owner ?? "").trim();
    const notes = String(row.notes ?? "").trim();
    const nextActionAt =
      typeof row.nextActionAt === "string" && row.nextActionAt.trim()
        ? row.nextActionAt.trim()
        : undefined;
    const customerContext = {
      detectedProblems: String(
        row.customerContext?.detectedProblems ?? "",
      ).trim(),
      diagnosedSystems: String(
        row.customerContext?.diagnosedSystems ?? "",
      ).trim(),
      objections: String(row.customerContext?.objections ?? "").trim(),
    };
    const extendedProfile = {
      profileUrl: String(row.extendedProfile?.profileUrl ?? "").trim(),
      sector: String(row.extendedProfile?.sector ?? "").trim(),
      locality: String(row.extendedProfile?.locality ?? "").trim(),
      address: String(row.extendedProfile?.address ?? "").trim(),
      route: String(row.extendedProfile?.route ?? "").trim(),
      publicChannel: String(row.extendedProfile?.publicChannel ?? "").trim(),
      opportunityDetected: String(
        row.extendedProfile?.opportunityDetected ?? "",
      ).trim(),
      initialOffer: String(row.extendedProfile?.initialOffer ?? "").trim(),
      recommendedDemo: String(
        row.extendedProfile?.recommendedDemo ?? "",
      ).trim(),
      stage2: String(row.extendedProfile?.stage2 ?? "").trim(),
      stage3: String(row.extendedProfile?.stage3 ?? "").trim(),
    };
    const summary = buildSummary(row);

    if (name.length < 2) {
      errors.push(`Fila ${rowNumber}: falta un nombre valido.`);
      continue;
    }

    if (company.length < 2) {
      errors.push(`Fila ${rowNumber}: falta una empresa valida.`);
      continue;
    }

    if (email && !emailPattern.test(email)) {
      errors.push(`Fila ${rowNumber}: el email no es valido.`);
      continue;
    }

    if (!validInterests.has(interest)) {
      errors.push(`Fila ${rowNumber}: el interes no es valido.`);
      continue;
    }

    if (owner && owner !== "Sin asignar" && !validOwners.has(owner)) {
      errors.push(`Fila ${rowNumber}: el responsable no existe en el CRM.`);
      continue;
    }

    if (nextActionAt && !isValidDate(nextActionAt)) {
      errors.push(`Fila ${rowNumber}: la proxima accion no tiene una fecha valida.`);
      continue;
    }

    try {
      await createManualCrmLead({
        name,
        company,
        email,
        phone,
        interest,
        owner,
        summary,
        notes,
        nextActionAt,
        customerContext,
        extendedProfile,
      });
      importedCount += 1;
    } catch {
      errors.push(`Fila ${rowNumber}: no pudimos crear el lead.`);
    }
  }

  return NextResponse.json({
    ok: true,
    importedCount,
    skippedCount: body.rows.length - importedCount,
    errors,
  });
}
