import { solutionOptions } from "@/lib/constants";

export type ContactFormState = {
  name: string;
  company: string;
  email: string;
  phone?: string;
  solutionType: string;
  message: string;
  privacy: boolean;
  website?: string;
  startedAt?: string;
};

export type ContactValidationResult =
  | { ok: true; data: ContactFormState }
  | { ok: false; errors: Partial<Record<keyof ContactFormState, string>> };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(
  input: Partial<ContactFormState>,
): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormState, string>> = {};
  const data: ContactFormState = {
    name: String(input.name ?? "").trim(),
    company: String(input.company ?? "").trim(),
    email: String(input.email ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    solutionType: String(input.solutionType ?? "").trim(),
    message: String(input.message ?? "").trim(),
    privacy: Boolean(input.privacy),
    website: String(input.website ?? "").trim(),
    startedAt: String(input.startedAt ?? "").trim(),
  };

  if (data.website) {
    errors.website = "No pudimos procesar la consulta.";
  }

  if (!data.name || data.name.length < 2) {
    errors.name = "Ingresá tu nombre.";
  }

  if (!data.company || data.company.length < 2) {
    errors.company = "Ingresá el nombre de la empresa.";
  }

  if (!emailPattern.test(data.email)) {
    errors.email = "Ingresá un correo válido.";
  }

  if (!solutionOptions.includes(data.solutionType)) {
    errors.solutionType = "Seleccioná un tipo de solución.";
  }

  if (!data.message || data.message.length < 12) {
    errors.message = "Contanos brevemente qué querés mejorar.";
  }

  if (!data.privacy) {
    errors.privacy =
      "Necesitamos tu consentimiento para responder la consulta.";
  }

  const elapsed = Date.now() - Number(data.startedAt);
  if (!data.startedAt || !Number.isFinite(elapsed) || elapsed < 2500) {
    errors.startedAt =
      "La consulta se envió demasiado rápido. Esperá un momento y probá nuevamente.";
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, data };
}
