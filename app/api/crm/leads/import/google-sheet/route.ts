import { NextResponse } from "next/server";

import type { ChatbotLeadInterest } from "@/lib/chatbot";
import {
  getCrmSessionCookieName,
} from "@/lib/crm-auth";
import {
  getCrmTokenFromCookieHeader,
  verifyActiveCrmSessionToken,
} from "@/lib/crm-session";
import {
  buildGoogleSheetCsvUrl,
  getImportRowIssues,
  mapCsvRows,
  parseCsv,
} from "@/lib/crm-import";
import { createManualCrmLead } from "@/lib/crm-store";
import {
  getAssignableCrmUsers,
  type CrmUserSummary,
} from "@/lib/crm-users";

type GoogleSheetPayload = {
  sheetUrl?: string;
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

function buildSummary(row: ReturnType<typeof mapCsvRows>[number]) {
  if (row.summary.trim().length >= 10) {
    return row.summary.trim();
  }

  if (row.customerContext.detectedProblems.trim().length >= 10) {
    return row.customerContext.detectedProblems.trim();
  }

  return `Lead importado desde Google Sheets para ${row.company || "empresa sin definir"}.`;
}

export async function POST(request: Request) {
  const token = getCrmTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await verifyActiveCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para importar desde Google Sheets." },
      { status: 401 },
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Solo un admin puede importar desde Google Sheets." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as GoogleSheetPayload | null;
  const sheetUrl = String(body?.sheetUrl ?? "").trim();

  if (!sheetUrl) {
    return NextResponse.json(
      { error: "Pega un link de Google Sheets para continuar." },
      { status: 400 },
    );
  }

  const csvUrl = buildGoogleSheetCsvUrl(sheetUrl);

  if (!csvUrl) {
    return NextResponse.json(
      {
        error:
          "El link no parece ser una Google Sheet valida. Usa un link de docs.google.com/spreadsheets.",
      },
      { status: 400 },
    );
  }

  const csvResponse = await fetch(csvUrl, {
    method: "GET",
    cache: "no-store",
  }).catch(() => null);

  if (!csvResponse?.ok) {
    return NextResponse.json(
      {
        error:
          "No pudimos leer la hoja. Revisa que tenga acceso de lectura o que pueda exportarse a CSV.",
      },
      { status: 400 },
    );
  }

  const csvText = await csvResponse.text();
  const rows = mapCsvRows(parseCsv(csvText));

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "La hoja no trae filas válidas para importar." },
      { status: 400 },
    );
  }

  if (rows.length > 500) {
    return NextResponse.json(
      { error: "Por ahora puedes importar hasta 500 filas por vez." },
      { status: 400 },
    );
  }

  const blockingErrors = rows
    .flatMap((row, index) =>
      getImportRowIssues(row)
        .filter((issue) => issue.tone === "error")
        .map((issue) => `Fila ${index + 2}: ${issue.message}`),
    )
    .slice(0, 10);

  if (blockingErrors.length > 0) {
    return NextResponse.json(
      {
        error:
          "La hoja tiene filas con error. Corrigelas antes de importar al CRM.",
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

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const name = row.name.trim();
    const company = row.company.trim();
    const email = row.email.trim();
    const phone = row.phone.trim();
    const interest = (row.interest.trim() || "sin-definir") as
      | ChatbotLeadInterest
      | "sin-definir";
    const owner = row.owner.trim();
    const notes = row.notes.trim();
    const nextActionAt = row.nextActionAt.trim() || undefined;
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
        customerContext: row.customerContext,
        extendedProfile: row.extendedProfile,
      });
      importedCount += 1;
    } catch {
      errors.push(`Fila ${rowNumber}: no pudimos crear el lead.`);
    }
  }

  return NextResponse.json({
    ok: true,
    importedCount,
    skippedCount: rows.length - importedCount,
    errors,
  });
}
