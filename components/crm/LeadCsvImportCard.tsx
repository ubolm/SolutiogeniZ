"use client";

import { Download, FileSpreadsheet, Link2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import {
  crmImportSampleRows,
  crmImportTemplateHeaders,
  getImportRowIssues,
  mapCsvRows,
  parseCsv,
  type ParsedImportRow,
} from "@/lib/crm-import";

type ImportStatus =
  | { kind: "idle"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function downloadTemplate() {
  const csv = [
    crmImportTemplateHeaders.join(","),
    ...crmImportSampleRows.map((row) => row.join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "plantilla-importacion-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function LeadCsvImportCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [sheetPreviewing, setSheetPreviewing] = useState(false);
  const [sheetImporting, setSheetImporting] = useState(false);
  const [sheetRows, setSheetRows] = useState<ParsedImportRow[]>([]);
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState("");
  const [status, setStatus] = useState<ImportStatus>({
    kind: "idle",
    message: "",
  });

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);
  const previewSummary = useMemo(() => {
    const allIssues = rows.map((row) => getImportRowIssues(row));

    return {
      readyCount: allIssues.filter((issues) => !issues.some((issue) => issue.tone === "error"))
        .length,
      errorCount: allIssues.filter((issues) =>
        issues.some((issue) => issue.tone === "error"),
      ).length,
      warningCount: allIssues.filter((issues) =>
        issues.some((issue) => issue.tone === "warning"),
      ).length,
    };
  }, [rows]);
  const hasBlockingErrors = previewSummary.errorCount > 0;
  const sheetPreviewRows = useMemo(() => sheetRows.slice(0, 5), [sheetRows]);
  const sheetPreviewSummary = useMemo(() => {
    const allIssues = sheetRows.map((row) => getImportRowIssues(row));

    return {
      readyCount: allIssues.filter((issues) => !issues.some((issue) => issue.tone === "error"))
        .length,
      errorCount: allIssues.filter((issues) =>
        issues.some((issue) => issue.tone === "error"),
      ).length,
      warningCount: allIssues.filter((issues) =>
        issues.some((issue) => issue.tone === "warning"),
      ).length,
    };
  }, [sheetRows]);
  const sheetHasBlockingErrors = sheetPreviewSummary.errorCount > 0;

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsedRows = mapCsvRows(parseCsv(text));

      if (parsedRows.length === 0) {
        setRows([]);
        setFileName(file.name);
        setStatus({
          kind: "error",
          message:
            "No encontramos filas para importar. Revisa que el CSV tenga encabezados y datos.",
        });
        return;
      }

      setRows(parsedRows);
      setFileName(file.name);
      setStatus({
        kind: "idle",
        message: `${parsedRows.length} fila(s) listas para revisar antes de importar.`,
      });
    } catch {
      setRows([]);
      setFileName(file.name);
      setStatus({
        kind: "error",
        message: "No pudimos leer el archivo CSV.",
      });
    }
  }

  async function importRows() {
    if (rows.length === 0) {
      setStatus({
        kind: "error",
        message: "Primero carga un CSV con filas validas.",
      });
      return;
    }

    setImporting(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/crm/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            importedCount?: number;
            skippedCount?: number;
            errors?: string[];
            error?: string;
          }
        | null;

      if (!response.ok || !body?.ok) {
        setStatus({
          kind: "error",
          message: body?.error ?? "No pudimos importar las filas.",
        });
        return;
      }

      const detail =
        body.errors && body.errors.length > 0
          ? ` Revisar: ${body.errors.slice(0, 3).join(" | ")}`
          : "";

      setStatus({
        kind: "success",
        message: `${body.importedCount ?? 0} lead(s) importados. ${body.skippedCount ?? 0} fila(s) omitidas.${detail}`,
      });
      setRows([]);
      setFileName("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      router.refresh();
    } catch {
      setStatus({
        kind: "error",
        message: "No pudimos conectarnos para importar el CSV.",
      });
    } finally {
      setImporting(false);
    }
  }

  async function importGoogleSheet() {
    if (!sheetUrl.trim()) {
      setStatus({
        kind: "error",
        message: "Pega un link de Google Sheets antes de importar.",
      });
      return;
    }

    if (sheetRows.length === 0 || sheetPreviewUrl !== sheetUrl.trim()) {
      setStatus({
        kind: "error",
        message: "Primero genera la vista previa de la Google Sheet.",
      });
      return;
    }

    if (sheetHasBlockingErrors) {
      setStatus({
        kind: "error",
        message: "Corrige las filas con error en la Google Sheet antes de importar.",
      });
      return;
    }

    setSheetImporting(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/crm/leads/import/google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl }),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            importedCount?: number;
            skippedCount?: number;
            errors?: string[];
            error?: string;
          }
        | null;

      if (!response.ok || !body?.ok) {
        setStatus({
          kind: "error",
          message: body?.error ?? "No pudimos importar la Google Sheet.",
        });
        return;
      }

      const detail =
        body.errors && body.errors.length > 0
          ? ` Revisar: ${body.errors.slice(0, 3).join(" | ")}`
          : "";

      setStatus({
        kind: "success",
        message: `${body.importedCount ?? 0} lead(s) importados desde Google Sheets. ${body.skippedCount ?? 0} fila(s) omitidas.${detail}`,
      });
      setSheetUrl("");
      setSheetRows([]);
      setSheetPreviewUrl("");
      router.refresh();
    } catch {
      setStatus({
        kind: "error",
        message: "No pudimos conectarnos para leer la Google Sheet.",
      });
    } finally {
      setSheetImporting(false);
    }
  }

  async function previewGoogleSheet() {
    if (!sheetUrl.trim()) {
      setStatus({
        kind: "error",
        message: "Pega un link de Google Sheets antes de previsualizar.",
      });
      return;
    }

    setSheetPreviewing(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/crm/leads/import/google-sheet/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl }),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            rows?: ParsedImportRow[];
            totalRows?: number;
            blockingErrors?: string[];
            error?: string;
          }
        | null;

      if (!response.ok || !body?.ok || !Array.isArray(body.rows)) {
        setSheetRows([]);
        setSheetPreviewUrl("");
        setStatus({
          kind: "error",
          message: body?.error ?? "No pudimos leer la Google Sheet.",
        });
        return;
      }

      setSheetRows(body.rows);
      setSheetPreviewUrl(sheetUrl.trim());
      setStatus({
        kind: "idle",
        message: `${body.totalRows ?? body.rows.length} fila(s) listas para revisar desde Google Sheets.`,
      });
    } catch {
      setSheetRows([]);
      setSheetPreviewUrl("");
      setStatus({
        kind: "error",
        message: "No pudimos conectarnos para previsualizar la Google Sheet.",
      });
    } finally {
      setSheetPreviewing(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex rounded-full bg-[#eef7ff] p-3 text-primary-strong">
          <FileSpreadsheet aria-hidden="true" size={18} />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Importacion masiva
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Carga leads en lote desde un CSV o desde una Google Sheet exportable.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-[1.4rem] border border-line bg-[#fbfcff] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
          Plantilla de importacion
        </p>
        <p className="text-sm leading-6 text-muted">
          Usa esta estructura: nombre, empresa, email, telefono, interes, responsable,
          resumen, proxima_accion, problemas, sistemas, objeciones, perfil_url, rubro,
          localidad, direccion, ruta, canal_publico, oportunidad_detectada,
          oferta_inicial, demo_recomendada, etapa_2, etapa_3 y notas.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
            onClick={downloadTemplate}
            type="button"
          >
            <Download aria-hidden="true" size={16} />
            Descargar plantilla
          </button>
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5">
            <Upload aria-hidden="true" size={16} />
            Cargar CSV
            <input
              accept=".csv,text/csv"
              className="hidden"
              onChange={onPickFile}
              ref={inputRef}
              type="file"
            />
          </label>
        </div>
        {fileName ? (
          <p className="text-sm text-muted">Archivo cargado: {fileName}</p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 rounded-[1.4rem] border border-line bg-[#fbfcff] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
          Google Sheets
        </p>
        <p className="text-sm leading-6 text-muted">
          Pega el link de una hoja de Google Sheets que pueda exportarse como CSV.
          Idealmente, usa una hoja publicada o compartida para lectura.
        </p>
        <input
          className="field"
          onChange={(event) => {
            setSheetUrl(event.target.value);
            setSheetRows([]);
            setSheetPreviewUrl("");
          }}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={sheetUrl}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={sheetPreviewing || !sheetUrl.trim()}
            onClick={() => void previewGoogleSheet()}
            type="button"
          >
            <Link2 aria-hidden="true" size={16} />
            {sheetPreviewing ? "Leyendo hoja..." : "Ver vista previa"}
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#10162f] px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={
              sheetImporting ||
              sheetRows.length === 0 ||
              sheetHasBlockingErrors ||
              sheetPreviewUrl !== sheetUrl.trim()
            }
            onClick={() => void importGoogleSheet()}
            type="button"
          >
            <Upload aria-hidden="true" size={16} />
            {sheetImporting ? "Importando hoja..." : "Importar Google Sheet"}
          </button>
        </div>
      </div>

      {previewRows.length > 0 ? (
        <div className="mt-5 grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              Vista previa de importacion
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#dce4ff] bg-[#f7f9ff] px-3 py-1 text-xs font-semibold text-primary-strong">
                {rows.length} fila(s)
              </span>
              <span className="rounded-full border border-[#d7eddc] bg-[#f1fbf5] px-3 py-1 text-xs font-semibold text-[#16794e]">
                {previewSummary.readyCount} listas
              </span>
              <span className="rounded-full border border-[#ffe7bd] bg-[#fff8ea] px-3 py-1 text-xs font-semibold text-[#b56a06]">
                {previewSummary.warningCount} con aviso
              </span>
              <span className="rounded-full border border-[#ffd8d8] bg-[#fff3f3] px-3 py-1 text-xs font-semibold text-[#c54646]">
                {previewSummary.errorCount} con error
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {previewRows.map((row, index) => (
              <PreviewRowCard
                index={index}
                key={`${row.company}-${row.name}-${index}`}
                row={row}
              />
            ))}
            {rows.length > previewRows.length ? (
              <p className="text-xs text-muted">
                Mostrando {previewRows.length} filas de {rows.length}. El resto se importara con la misma validacion.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {sheetPreviewRows.length > 0 ? (
        <div className="mt-5 grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              Vista previa de Google Sheets
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#dce4ff] bg-[#f7f9ff] px-3 py-1 text-xs font-semibold text-primary-strong">
                {sheetRows.length} fila(s)
              </span>
              <span className="rounded-full border border-[#d7eddc] bg-[#f1fbf5] px-3 py-1 text-xs font-semibold text-[#16794e]">
                {sheetPreviewSummary.readyCount} listas
              </span>
              <span className="rounded-full border border-[#ffe7bd] bg-[#fff8ea] px-3 py-1 text-xs font-semibold text-[#b56a06]">
                {sheetPreviewSummary.warningCount} con aviso
              </span>
              <span className="rounded-full border border-[#ffd8d8] bg-[#fff3f3] px-3 py-1 text-xs font-semibold text-[#c54646]">
                {sheetPreviewSummary.errorCount} con error
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {sheetPreviewRows.map((row, index) => (
              <PreviewRowCard
                index={index}
                key={`sheet-${row.company}-${row.name}-${index}`}
                row={row}
              />
            ))}
            {sheetRows.length > sheetPreviewRows.length ? (
              <p className="text-xs text-muted">
                Mostrando {sheetPreviewRows.length} filas de {sheetRows.length}. El resto se importara con la misma validacion.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#10162f] px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={importing || rows.length === 0 || hasBlockingErrors}
          onClick={() => void importRows()}
          type="button"
        >
          <Upload aria-hidden="true" size={16} />
          {importing ? "Importando..." : "Importar CSV"}
        </button>

        {hasBlockingErrors ? (
          <p className="text-sm text-red-600">
            Corrige las filas marcadas con error antes de importar al CRM.
          </p>
        ) : null}

        {sheetHasBlockingErrors && sheetRows.length > 0 ? (
          <p className="text-sm text-red-600">
            Corrige las filas con error en la Google Sheet antes de importarla.
          </p>
        ) : null}

        {status.message ? (
          <p
            className={`text-sm ${
              status.kind === "success"
                ? "text-emerald-700"
                : status.kind === "error"
                  ? "text-red-600"
                  : "text-muted"
            }`}
          >
            {status.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PreviewRowCard({
  row,
  index,
}: {
  row: ParsedImportRow;
  index: number;
}) {
  const issues = getImportRowIssues(row);
  const hasError = issues.some((issue) => issue.tone === "error");
  const hasWarning = issues.some((issue) => issue.tone === "warning");

  return (
    <article
      className={`rounded-[1.35rem] border px-4 py-4 ${
        hasError
          ? "border-[#ffd8d8] bg-[#fff7f7]"
          : hasWarning
            ? "border-[#ffe7bd] bg-[#fffaf1]"
            : "border-[#d7eddc] bg-[#f6fcf8]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Fila {index + 2}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {row.company || "Empresa sin nombre"} · {row.name || "Contacto sin nombre"}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {row.summary || row.customerContext.detectedProblems || "Sin resumen comercial."}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            hasError
              ? "bg-[#fff0f0] text-[#c54646]"
              : hasWarning
                ? "bg-[#fff3df] text-[#b56a06]"
                : "bg-[#ecf8f0] text-[#16794e]"
          }`}
        >
          {hasError ? "Revisar" : hasWarning ? "Con aviso" : "Lista"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-line bg-white px-2.5 py-1 text-muted">
          Interes: {row.interest || "sin-definir"}
        </span>
        <span className="rounded-full border border-line bg-white px-2.5 py-1 text-muted">
          Responsable: {row.owner || "Sin asignar"}
        </span>
        <span className="rounded-full border border-line bg-white px-2.5 py-1 text-muted">
          Rubro: {row.extendedProfile.sector || "Sin definir"}
        </span>
        <span className="rounded-full border border-line bg-white px-2.5 py-1 text-muted">
          Localidad: {row.extendedProfile.locality || "Sin definir"}
        </span>
      </div>

      {issues.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {issues.map((issue, issueIndex) => (
            <p
              className={`text-xs leading-5 ${
                issue.tone === "error" ? "text-[#c54646]" : "text-[#b56a06]"
              }`}
              key={`${issue.message}-${issueIndex}`}
            >
              {issue.message}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[#16794e]">
          La fila tiene lo minimo para entrar prolija al CRM.
        </p>
      )}
    </article>
  );
}
