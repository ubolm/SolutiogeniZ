import { NextResponse } from "next/server";

import type { ChatbotIntent, ChatbotLeadInterest } from "@/lib/chatbot";
import { buildChatbotResponse } from "@/lib/chatbot-engine";
import { sendChatbotLead, validateChatbotLead } from "@/lib/chatbot-lead";
import { persistChatbotLead } from "@/lib/crm-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        action?: "message" | "lead";
        message?: string;
        lead?: Record<string, unknown>;
        transcript?: Array<{ role?: string; content?: string }>;
        intent?: ChatbotIntent;
        interest?: ChatbotLeadInterest | "";
      }
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "No pudimos leer la solicitud del chatbot." },
      { status: 400 },
    );
  }

  if (body.action === "lead") {
    const result = validateChatbotLead(body.lead ?? {});

    if (!result.ok) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    try {
      const delivery = await sendChatbotLead(result.data);

      if (!delivery.delivered) {
        return NextResponse.json(
          {
            error:
              "El canal de contacto todavia no esta configurado. Proba nuevamente mas tarde.",
          },
          { status: 503 },
        );
      }

      await persistChatbotLead({
        lead: result.data,
        transcript: Array.isArray(body.transcript)
          ? body.transcript
              .map((message) => ({
                role: (message.role === "user"
                  ? "user"
                  : "assistant") as "user" | "assistant",
                content: String(message.content ?? "").trim(),
              }))
              .filter((message) => message.content.length > 0)
          : [],
        intent: body.intent,
        detectedInterest: body.interest,
      });
    } catch {
      console.error("The chatbot lead could not be delivered.");
      return NextResponse.json(
        {
          error:
            "No pudimos enviar tu consulta en este momento. Proba nuevamente mas tarde.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      reply:
        "Gracias. Ya recibimos tu consulta y el equipo de SolutiogeniZ te va a contactar para seguirla.",
    });
  }

  const message = String(body.message ?? "").trim();

  if (!message) {
    return NextResponse.json(
      { error: "Necesitamos un mensaje para responder." },
      { status: 400 },
    );
  }

  return NextResponse.json(buildChatbotResponse(message));
}

