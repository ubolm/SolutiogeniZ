import { NextResponse } from "next/server";

import { crmLeadStatuses, type ChatbotLeadStatus } from "@/lib/chatbot";
import {
  createCrmLeadActivity,
  createCrmTask,
  getCrmSnapshot,
  updateCrmLead,
} from "@/lib/crm-store";

type UpdateLeadPayload = {
  action: "update_lead";
  leadId?: string;
  status?: string;
  owner?: string;
  nextActionAt?: string;
  notes?: string;
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

type CreateActivityPayload = {
  action: "create_activity";
  leadId?: string;
  description?: string;
  kind?: string;
  nextActionAt?: string;
  status?: string;
};

type CreateTaskPayload = {
  action: "create_task";
  leadId?: string;
  title?: string;
  type?: string;
  dueAt?: string;
};

type InboundAutomationPayload =
  | UpdateLeadPayload
  | CreateActivityPayload
  | CreateTaskPayload;

const validTaskTypes = new Set([
  "llamada",
  "reunion",
  "propuesta",
  "seguimiento",
  "otro",
]);

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function isAuthorized(request: Request) {
  const expectedSecret = env("N8N_CRM_INBOUND_SECRET");

  if (!expectedSecret) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            "La automatizacion entrante del CRM no esta configurada todavia.",
        },
        { status: 503 },
      ),
    };
  }

  const providedSecret = request.headers.get("x-sgz-crm-secret")?.trim() || "";

  if (!providedSecret || providedSecret !== expectedSecret) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No autorizaste esta automatizacion del CRM." },
        { status: 401 },
      ),
    };
  }

  return { ok: true as const };
}

async function ensureLeadExists(leadId: string) {
  const snapshot = await getCrmSnapshot();
  return snapshot.leads.some((lead) => lead.id === leadId);
}

export async function POST(request: Request) {
  const authorization = isAuthorized(request);

  if (!authorization.ok) {
    return authorization.response;
  }

  const body = (await request.json().catch(() => null)) as
    | InboundAutomationPayload
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer la accion enviada por n8n." },
      { status: 400 },
    );
  }

  const leadId = String(body.leadId ?? "").trim();

  if (!leadId) {
    return NextResponse.json(
      { error: "n8n debe indicar el leadId a trabajar." },
      { status: 400 },
    );
  }

  if (!(await ensureLeadExists(leadId))) {
    return NextResponse.json(
      { error: "No encontramos el lead indicado para la automatizacion." },
      { status: 404 },
    );
  }

  if (body.action === "update_lead") {
    const status =
      typeof body.status === "string" &&
      crmLeadStatuses.includes(body.status as ChatbotLeadStatus)
        ? (body.status as ChatbotLeadStatus)
        : undefined;
    const owner = typeof body.owner === "string" ? body.owner.trim() : undefined;
    const notes = typeof body.notes === "string" ? body.notes : undefined;
    const nextActionAt =
      typeof body.nextActionAt === "string" && isValidDate(body.nextActionAt)
        ? body.nextActionAt
        : undefined;

    try {
      const lead = await updateCrmLead({
        id: leadId,
        status,
        owner,
        nextActionAt,
        notes,
        customerContext: body.customerContext,
        extendedProfile: body.extendedProfile,
      });

      return NextResponse.json({ ok: true, action: body.action, lead });
    } catch {
      return NextResponse.json(
        { error: "No pudimos actualizar el lead desde n8n." },
        { status: 400 },
      );
    }
  }

  if (body.action === "create_activity") {
    const description = String(body.description ?? "").trim();

    if (description.length < 4) {
      return NextResponse.json(
        { error: "La actividad automatica necesita una descripcion valida." },
        { status: 400 },
      );
    }

    const kind = body.kind === "contact" ? "contact" : "note";
    const nextActionAt =
      typeof body.nextActionAt === "string" && isValidDate(body.nextActionAt)
        ? body.nextActionAt
        : undefined;
    const status =
      typeof body.status === "string" &&
      crmLeadStatuses.includes(body.status as ChatbotLeadStatus)
        ? (body.status as ChatbotLeadStatus)
        : undefined;

    try {
      const lead = await createCrmLeadActivity({
        leadId,
        description,
        kind,
        nextActionAt,
        status,
      });

      return NextResponse.json({ ok: true, action: body.action, lead });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "No pudimos crear la actividad desde n8n.",
        },
        { status: 400 },
      );
    }
  }

  if (body.action === "create_task") {
    const title = String(body.title ?? "").trim();
    const type = String(body.type ?? "").trim();
    const dueAt = String(body.dueAt ?? "").trim();

    if (title.length < 4) {
      return NextResponse.json(
        { error: "La tarea automatica necesita un titulo mas claro." },
        { status: 400 },
      );
    }

    if (!validTaskTypes.has(type)) {
      return NextResponse.json(
        { error: "El tipo de tarea automatica no es valido." },
        { status: 400 },
      );
    }

    if (!isValidDate(dueAt)) {
      return NextResponse.json(
        { error: "La fecha de vencimiento de la tarea no es valida." },
        { status: 400 },
      );
    }

    try {
      const task = await createCrmTask({
        leadId,
        title,
        type: type as
          | "llamada"
          | "reunion"
          | "propuesta"
          | "seguimiento"
          | "otro",
        dueAt,
      });

      return NextResponse.json({ ok: true, action: body.action, task });
    } catch {
      return NextResponse.json(
        { error: "No pudimos crear la tarea desde n8n." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json(
    { error: "La accion automatica indicada no existe." },
    { status: 400 },
  );
}
