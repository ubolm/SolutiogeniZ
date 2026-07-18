import { businessContact } from "@/lib/constants";
import type { ChatbotLeadInterest, ChatbotSource } from "@/lib/chatbot";

export type ChatbotLeadFormState = {
  name: string;
  company: string;
  email: string;
  phone?: string;
  interest: ChatbotLeadInterest | "";
  currentProcess: string;
  mainProblem: string;
  privacy: boolean;
  source: ChatbotSource;
  website?: string;
  startedAt?: string;
};

export type ChatbotLeadValidationResult =
  | { ok: true; data: ChatbotLeadFormState }
  | {
      ok: false;
      errors: Partial<Record<keyof ChatbotLeadFormState, string>>;
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateChatbotLead(
  input: Partial<ChatbotLeadFormState>,
): ChatbotLeadValidationResult {
  const errors: Partial<Record<keyof ChatbotLeadFormState, string>> = {};
  const data: ChatbotLeadFormState = {
    name: String(input.name ?? "").trim(),
    company: String(input.company ?? "").trim(),
    email: String(input.email ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    interest: (String(input.interest ?? "").trim() || "") as
      | ChatbotLeadInterest
      | "",
    currentProcess: String(input.currentProcess ?? "").trim(),
    mainProblem: String(input.mainProblem ?? "").trim(),
    privacy: Boolean(input.privacy),
    source: input.source === "whatsapp" || input.source === "manual"
      ? input.source
      : "web",
    website: String(input.website ?? "").trim(),
    startedAt: String(input.startedAt ?? "").trim(),
  };

  if (data.website) {
    errors.website = "No pudimos procesar la solicitud.";
  }

  if (data.name.length < 2) {
    errors.name = "Ingresá tu nombre.";
  }

  if (data.company.length < 2) {
    errors.company = "Ingresá el nombre de la empresa.";
  }

  if (!emailPattern.test(data.email)) {
    errors.email = "Ingresá un correo válido.";
  }

  if (!data.interest) {
    errors.interest = "Elegí qué querés mejorar primero.";
  }

  if (data.currentProcess.length < 8) {
    errors.currentProcess = "Contanos brevemente cómo lo manejan hoy.";
  }

  if (data.mainProblem.length < 8) {
    errors.mainProblem = "Contanos cuál es el principal problema.";
  }

  if (!data.privacy) {
    errors.privacy =
      "Necesitamos tu consentimiento para responder la consulta.";
  }

  const elapsed = Date.now() - Number(data.startedAt);
  if (!data.startedAt || !Number.isFinite(elapsed) || elapsed < 2500) {
    errors.startedAt =
      "La solicitud se envió demasiado rápido. Esperá un momento y probá nuevamente.";
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, data };
}

export async function sendChatbotLead(data: ChatbotLeadFormState) {
  const webhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;
  const to = process.env.CONTACT_TO_EMAIL || businessContact.email;
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    "SolutiogeniZ <contacto@mail.solutiogeniz.com>";

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "solutiogeniz-chatbot",
        submittedAt: new Date().toISOString(),
        lead: data,
      }),
    });

    if (!response.ok) {
      throw new Error("The chatbot lead webhook rejected the payload.");
    }

    return { delivered: true, channel: "n8n" as const };
  }

  if (!to || !apiKey) {
    console.warn("Chatbot lead received without a delivery channel configured.");
    return { delivered: false };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject: `Nuevo lead desde chatbot de ${data.company}`,
    text: [
      `Nombre: ${data.name}`,
      `Empresa: ${data.company}`,
      `Correo: ${data.email}`,
      `Telefono: ${data.phone || "No informado"}`,
      `Interes: ${data.interest}`,
      `Canal: ${data.source}`,
      "",
      "Proceso actual:",
      data.currentProcess,
      "",
      "Problema principal:",
      data.mainProblem,
    ].join("\n"),
  });

  if (error) {
    throw new Error("The email provider rejected the chatbot lead.");
  }

  return { delivered: true, channel: "email" as const };
}
