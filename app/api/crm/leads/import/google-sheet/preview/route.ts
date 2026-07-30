import { NextResponse } from "next/server";

import {
  getCrmRoleCapabilities,
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

type GoogleSheetPayload = {
  sheetUrl?: string;
};

export async function POST(request: Request) {
  const token = getCrmTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await verifyActiveCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para previsualizar Google Sheets." },
      { status: 401 },
    );
  }

  const capabilities = getCrmRoleCapabilities(session.role);

  if (!capabilities.canCreateManualLeads) {
    return NextResponse.json(
      { error: "No tienes permiso para previsualizar importaciones." },
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
      { error: "La hoja no trae filas validas para importar." },
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

  return NextResponse.json({
    ok: true,
    rows,
    totalRows: rows.length,
    blockingErrors,
  });
}
