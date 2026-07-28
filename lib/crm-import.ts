export type ParsedImportRow = {
  name: string;
  company: string;
  email: string;
  phone: string;
  interest: string;
  owner: string;
  summary: string;
  notes: string;
  nextActionAt: string;
  customerContext: {
    detectedProblems: string;
    diagnosedSystems: string;
    objections: string;
  };
  extendedProfile: {
    profileUrl: string;
    sector: string;
    locality: string;
    address: string;
    route: string;
    publicChannel: string;
    opportunityDetected: string;
    initialOffer: string;
    recommendedDemo: string;
    stage2: string;
    stage3: string;
  };
};

export type ImportRowIssue = {
  tone: "error" | "warning";
  message: string;
};

export const crmImportTemplateHeaders = [
  "nombre",
  "empresa",
  "email",
  "telefono",
  "interes",
  "responsable",
  "resumen",
  "proxima_accion",
  "problemas",
  "sistemas",
  "objeciones",
  "perfil_url",
  "rubro",
  "localidad",
  "direccion",
  "ruta",
  "canal_publico",
  "oportunidad_detectada",
  "oferta_inicial",
  "demo_recomendada",
  "etapa_2",
  "etapa_3",
  "notas",
];

export const crmImportSampleRows = [
  [
    "Juan Perez",
    "Barberia Estilo",
    "juan@barberia.com",
    "+5491112345678",
    "automatizaciones",
    "lucas",
    "Quiere ordenar consultas y seguimientos comerciales.",
    "2026-07-29 10:00",
    "Se le enfrían los mensajes y responde tarde.",
    "WhatsApp, Instagram y planilla.",
    "Duda por tiempos de implementación.",
    "https://instagram.com/barberiaestilo",
    "Barberia",
    "CABA",
    "Av. Corrientes 1234",
    "Zona centro",
    "Instagram publico",
    "Necesita ordenar consultas y seguimiento de interesados.",
    "Demo + automatizacion inicial",
    "Demo de seguimiento comercial",
    "Calificacion",
    "Propuesta",
    "Pide demo breve esta semana.",
  ],
  [
    "Maria Gomez",
    "Clinica Delta",
    "maria@clinicadelta.com",
    "+5491122223333",
    "chatbots",
    "Sin asignar",
    "Busca centralizar WhatsApp y derivaciones.",
    "2026-07-30 15:30",
    "Pierden contexto entre recepcion y administracion.",
    "WhatsApp Business y formularios web.",
    "Quiere entender costos mensuales.",
    "https://clinicadelta.com",
    "Salud",
    "La Plata",
    "Calle 50 450",
    "Sucursal principal",
    "Web publica",
    "Centralizar mensajes y derivaciones.",
    "Chatbot + bandeja operativa",
    "Demo de atencion y derivacion",
    "Diagnostico",
    "Negociacion",
    "Lead importado desde base comercial.",
  ],
];

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseNextAction(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return "";
  }

  const normalized = cleanValue.includes("T")
    ? cleanValue
    : cleanValue.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export function getImportRowIssues(row: ParsedImportRow): ImportRowIssue[] {
  const issues: ImportRowIssue[] = [];

  if (row.name.trim().length < 2) {
    issues.push({ tone: "error", message: "Falta un nombre valido." });
  }

  if (row.company.trim().length < 2) {
    issues.push({ tone: "error", message: "Falta una empresa valida." });
  }

  if (row.email.trim() && !isValidEmail(row.email.trim())) {
    issues.push({ tone: "error", message: "El email no es valido." });
  }

  if (row.nextActionAt.trim() && !isValidDate(row.nextActionAt.trim())) {
    issues.push({
      tone: "error",
      message: "La proxima accion no tiene una fecha valida.",
    });
  }

  if (!row.summary.trim() && !row.customerContext.detectedProblems.trim()) {
    issues.push({
      tone: "warning",
      message: "No trae resumen ni problema detectado.",
    });
  }

  if (!row.owner.trim()) {
    issues.push({
      tone: "warning",
      message: "Entrara sin responsable asignado.",
    });
  }

  if (!row.extendedProfile.opportunityDetected.trim()) {
    issues.push({
      tone: "warning",
      message: "No trae oportunidad detectada.",
    });
  }

  return issues;
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current.trim());
      current = "";

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export function mapCsvRows(rawRows: string[][]): ParsedImportRow[] {
  if (rawRows.length < 2) {
    return [];
  }

  const headers = rawRows[0].map(normalizeHeader);
  const getCell = (values: string[], keys: string[]) => {
    for (const key of keys) {
      const index = headers.indexOf(key);
      if (index >= 0) {
        return values[index]?.trim() ?? "";
      }
    }

    return "";
  };

  return rawRows.slice(1).map((values) => ({
    name: getCell(values, ["nombre", "contacto", "cliente"]),
    company: getCell(values, ["empresa", "negocio", "compania"]),
    email: getCell(values, ["email", "correo", "correo_electronico"]),
    phone: getCell(values, ["telefono", "telefono_whatsapp", "whatsapp", "celular"]),
    interest: getCell(values, ["interes", "servicio"]),
    owner: getCell(values, ["responsable", "owner", "asignado"]),
    summary: getCell(values, ["resumen", "summary", "contexto"]),
    notes: getCell(values, ["notas", "nota", "internas"]),
    nextActionAt: parseNextAction(
      getCell(values, ["proxima_accion", "next_action", "seguimiento"]),
    ),
    customerContext: {
      detectedProblems: getCell(values, ["problemas", "problemas_detectados"]),
      diagnosedSystems: getCell(values, ["sistemas", "sistemas_diagnosticados"]),
      objections: getCell(values, ["objeciones", "objecion"]),
    },
    extendedProfile: {
      profileUrl: getCell(values, ["perfil_url", "profile_url", "logo_url", "url_perfil"]),
      sector: getCell(values, ["rubro", "sector"]),
      locality: getCell(values, ["localidad", "ciudad"]),
      address: getCell(values, ["direccion", "domicilio"]),
      route: getCell(values, ["ruta", "recorrido"]),
      publicChannel: getCell(values, ["canal_publico", "modalidad_publica", "canal"]),
      opportunityDetected: getCell(
        values,
        ["oportunidad_detectada", "oportunidad", "needs_opportunity"],
      ),
      initialOffer: getCell(values, ["oferta_inicial", "oferta"]),
      recommendedDemo: getCell(
        values,
        ["demo_recomendada", "demo", "demo_sugerida"],
      ),
      stage2: getCell(values, ["etapa_2", "stage_2"]),
      stage3: getCell(values, ["etapa_3", "stage_3"]),
    },
  }));
}

export function buildGoogleSheetCsvUrl(sheetUrl: string) {
  try {
    const url = new URL(sheetUrl.trim());

    if (url.hostname !== "docs.google.com") {
      return null;
    }

    const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);

    if (!match) {
      return null;
    }

    const spreadsheetId = match[1];
    const gid = url.searchParams.get("gid") ?? "0";

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  } catch {
    return null;
  }
}
