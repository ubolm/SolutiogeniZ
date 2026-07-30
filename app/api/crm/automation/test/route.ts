import { NextResponse } from "next/server";

import { emitWhatsAppInboundAutomationEvent } from "@/lib/crm-automation";
import { getCrmTokenFromCookieHeader, verifyActiveCrmSessionToken } from "@/lib/crm-session";

async function requireAdminSession(request: Request) {
  const token = getCrmTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await verifyActiveCrmSessionToken(token);

  if (!session) {
    return NextResponse.json(
      { error: "Sesion requerida para probar automatizaciones del CRM." },
      { status: 401 },
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Solo un admin puede probar automatizaciones del CRM." },
      { status: 403 },
    );
  }

  return session;
}

export async function POST(request: Request) {
  const session = await requireAdminSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const now = new Date().toISOString();

    const result = await emitWhatsAppInboundAutomationEvent({
      provider: "crm-test",
      from: "5491100000000",
      profileName: "Prueba CRM",
      message: "Mensaje de prueba interno del CRM hacia n8n.",
      detectedInterest: "automatizaciones",
      intent: "consultar_servicios",
      lead: {
        id: "test-lead-crm-n8n",
        createdAt: now,
        updatedAt: now,
        name: "Prueba CRM",
        company: "SolutiogeniZ",
        source: "whatsapp",
        sourceDetail: "chatbot",
        email: "test@solutiogeniz.com",
        phone: "5491100000000",
        interest: "automatizaciones",
        summary: "Lead tecnico de prueba para validar la salida del CRM hacia n8n.",
        priority: "media",
        status: "contactado",
        owner: session.username,
        lastContactAt: now,
        nextActionAt: new Date().toISOString(),
        notes: "Este registro no se guarda en el CRM. Solo se usa para probar el webhook.",
        customerContext: {
          detectedProblems: "",
          capturedMetrics: "",
          verbatimQuotes: "",
          diagnosedSystems: "",
          objections: "",
        },
        extendedProfile: {
          profileUrl: "",
          sector: "",
          locality: "",
          address: "",
          route: "",
          publicChannel: "",
          opportunityDetected: "",
          initialOffer: "",
          recommendedDemo: "",
          stage2: "",
          stage3: "",
        },
      },
      conversation: {
        id: "test-conversation-crm-n8n",
        leadId: "test-lead-crm-n8n",
        channel: "whatsapp",
        startedAt: now,
        lastMessageAt: now,
        transcriptSummary: "Prueba interna del webhook del CRM hacia n8n.",
        handoffRequested: false,
        detectedIntent: "consultar_servicios",
        provider: "none",
        providerRef: "crm-test",
        contactPhone: "5491100000000",
        isBotEnabled: true,
        assignedTo: session.username,
        unreadCount: 1,
        lastMessagePreview: "Mensaje de prueba interno del CRM hacia n8n.",
      },
      shouldReply: false,
    });

    return NextResponse.json({
      ok: true,
      result,
      message:
        result.delivered
          ? "El CRM envio correctamente el evento de prueba hacia n8n."
          : "El CRM no envio el evento porque todavia falta configurar el webhook.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos probar la automatizacion del CRM.",
      },
      { status: 502 },
    );
  }
}
