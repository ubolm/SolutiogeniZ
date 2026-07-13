import { businessContact, diagnosticGoals } from "@/lib/constants";

export type DiagnosticFormState = {
  goal: string;
  currentProcess: string;
  mainProblem: string;
  tools: string;
  priority: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  privacy: boolean;
  website?: string;
  startedAt?: string;
};

export type DiagnosticValidationResult =
  | { ok: true; data: DiagnosticFormState }
  | {
      ok: false;
      errors: Partial<Record<keyof DiagnosticFormState, string>>;
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const priorities = ["Baja", "Media", "Alta", "Urgente"];

export function validateDiagnosticForm(
  input: Partial<DiagnosticFormState>,
): DiagnosticValidationResult {
  const errors: Partial<Record<keyof DiagnosticFormState, string>> = {};
  const data: DiagnosticFormState = {
    goal: String(input.goal ?? "").trim(),
    currentProcess: String(input.currentProcess ?? "").trim(),
    mainProblem: String(input.mainProblem ?? "").trim(),
    tools: String(input.tools ?? "").trim(),
    priority: String(input.priority ?? "").trim(),
    name: String(input.name ?? "").trim(),
    company: String(input.company ?? "").trim(),
    email: String(input.email ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    privacy: Boolean(input.privacy),
    website: String(input.website ?? "").trim(),
    startedAt: String(input.startedAt ?? "").trim(),
  };

  if (data.website) {
    errors.website = "No pudimos procesar el diagnóstico.";
  }

  if (!diagnosticGoals.includes(data.goal)) {
    errors.goal = "Seleccioná qué querés mejorar.";
  }

  if (data.currentProcess.length < 12) {
    errors.currentProcess = "Contanos brevemente cómo funciona hoy.";
  }

  if (data.mainProblem.length < 8) {
    errors.mainProblem = "Indicá cuál es el principal problema.";
  }

  if (data.tools.length < 2) {
    errors.tools = "Mencioná al menos una herramienta o escribí ninguna.";
  }

  if (!priorities.includes(data.priority)) {
    errors.priority = "Seleccioná una prioridad.";
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

  if (!data.privacy) {
    errors.privacy =
      "Necesitamos tu consentimiento para responder el diagnóstico.";
  }

  const elapsed = Date.now() - Number(data.startedAt);
  if (!data.startedAt || !Number.isFinite(elapsed) || elapsed < 2500) {
    errors.startedAt =
      "El diagnóstico se envió demasiado rápido. Esperá un momento y probá nuevamente.";
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, data };
}

export async function sendDiagnosticLead(data: DiagnosticFormState) {
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
        source: "solutiogeniz-diagnostic",
        submittedAt: new Date().toISOString(),
        lead: {
          goal: data.goal,
          currentProcess: data.currentProcess,
          mainProblem: data.mainProblem,
          tools: data.tools,
          priority: data.priority,
          name: data.name,
          company: data.company,
          email: data.email,
          phone: data.phone,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("The n8n webhook rejected the diagnostic lead.");
    }

    return { delivered: true, channel: "n8n" as const };
  }

  if (!to || !apiKey) {
    console.warn("Diagnostic lead received without a delivery channel configured.");
    return { delivered: false };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject: `Nueva solicitud de demo de ${data.company}`,
    text: [
      `Nombre: ${data.name}`,
      `Empresa: ${data.company}`,
      `Correo: ${data.email}`,
      `Telefono: ${data.phone || "No informado"}`,
      `Que quiere mejorar: ${data.goal}`,
      `Prioridad: ${data.priority}`,
      `Herramientas actuales: ${data.tools}`,
      "",
      "Proceso actual:",
      data.currentProcess,
      "",
      "Problema principal:",
      data.mainProblem,
    ].join("\n"),
  });

  if (error) {
    throw new Error("The email provider rejected the diagnostic lead.");
  }

  return { delivered: true, channel: "email" as const };
}
