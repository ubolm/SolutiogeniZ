import { NextResponse } from "next/server";

import { crmLeadStatuses, type ChatbotLeadStatus } from "@/lib/chatbot";
import {
  getCrmRoleCapabilities,
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";
import { getCrmLeadDetailForSession, updateCrmLead } from "@/lib/crm-store";

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
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
      { error: "Sesion requerida para actualizar este lead." },
      { status: 401 },
    );
  }

  const detail = await getCrmLeadDetailForSession(context.params.id, session);

  if (!detail) {
    return NextResponse.json(
      { error: "No tienes acceso a este lead." },
      { status: 404 },
    );
  }

  const capabilities = getCrmRoleCapabilities(session.role);
  const body = (await request.json().catch(() => null)) as
    | {
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
  const customerContext =
    body.customerContext && typeof body.customerContext === "object"
      ? {
          detectedProblems:
            typeof body.customerContext.detectedProblems === "string"
              ? body.customerContext.detectedProblems
              : undefined,
          capturedMetrics:
            typeof body.customerContext.capturedMetrics === "string"
              ? body.customerContext.capturedMetrics
              : undefined,
          verbatimQuotes:
            typeof body.customerContext.verbatimQuotes === "string"
              ? body.customerContext.verbatimQuotes
              : undefined,
          diagnosedSystems:
            typeof body.customerContext.diagnosedSystems === "string"
              ? body.customerContext.diagnosedSystems
              : undefined,
          objections:
            typeof body.customerContext.objections === "string"
              ? body.customerContext.objections
              : undefined,
        }
      : undefined;
  const extendedProfile =
    body.extendedProfile && typeof body.extendedProfile === "object"
      ? {
          profileUrl:
            typeof body.extendedProfile.profileUrl === "string"
              ? body.extendedProfile.profileUrl
              : undefined,
          sector:
            typeof body.extendedProfile.sector === "string"
              ? body.extendedProfile.sector
              : undefined,
          locality:
            typeof body.extendedProfile.locality === "string"
              ? body.extendedProfile.locality
              : undefined,
          address:
            typeof body.extendedProfile.address === "string"
              ? body.extendedProfile.address
              : undefined,
          route:
            typeof body.extendedProfile.route === "string"
              ? body.extendedProfile.route
              : undefined,
          publicChannel:
            typeof body.extendedProfile.publicChannel === "string"
              ? body.extendedProfile.publicChannel
              : undefined,
          opportunityDetected:
            typeof body.extendedProfile.opportunityDetected === "string"
              ? body.extendedProfile.opportunityDetected
              : undefined,
          initialOffer:
            typeof body.extendedProfile.initialOffer === "string"
              ? body.extendedProfile.initialOffer
              : undefined,
          recommendedDemo:
            typeof body.extendedProfile.recommendedDemo === "string"
              ? body.extendedProfile.recommendedDemo
              : undefined,
          stage2:
            typeof body.extendedProfile.stage2 === "string"
              ? body.extendedProfile.stage2
              : undefined,
          stage3:
            typeof body.extendedProfile.stage3 === "string"
              ? body.extendedProfile.stage3
              : undefined,
        }
      : undefined;
  const nextActionAt =
    typeof body.nextActionAt === "string" && isValidDate(body.nextActionAt)
      ? body.nextActionAt
      : undefined;

  if (!capabilities.canManageOwner && owner !== undefined) {
    return NextResponse.json(
      { error: "No tienes permiso para cambiar el responsable." },
      { status: 403 },
    );
  }

  if (!capabilities.canEditLeadStatus && status !== undefined) {
    return NextResponse.json(
      { error: "No tienes permiso para cambiar el estado." },
      { status: 403 },
    );
  }

  if (!capabilities.canScheduleLeadNextAction && nextActionAt !== undefined) {
    return NextResponse.json(
      { error: "No tienes permiso para cambiar la proxima accion." },
      { status: 403 },
    );
  }

  if (!capabilities.canManageInternalNotes && notes !== undefined) {
    return NextResponse.json(
      { error: "No tienes permiso para editar notas internas." },
      { status: 403 },
    );
  }

  try {
    const lead = await updateCrmLead({
      id: context.params.id,
      status,
      owner,
      nextActionAt,
      notes,
      customerContext,
      extendedProfile,
    });

    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json(
      { error: "No pudimos actualizar ese lead." },
      { status: 404 },
    );
  }
}
