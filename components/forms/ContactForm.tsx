"use client";

import { Send } from "lucide-react";
import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";

import { solutionOptions } from "@/lib/constants";
import type { ContactFormState } from "@/lib/validations";
import { validateContactForm } from "@/lib/validations";

type Status = "idle" | "loading" | "success" | "error";

const initialState: ContactFormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  solutionType: "",
  message: "",
  privacy: false,
  website: "",
  startedAt: "",
};

export function ContactForm() {
  const startedAt = useMemo(() => Date.now().toString(), []);
  const [values, setValues] = useState<ContactFormState>({
    ...initialState,
    startedAt,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormState, string>>
  >({});
  const [status, setStatus] = useState<Status>("idle");
  const [globalError, setGlobalError] = useState("");

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const target = event.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setValues((current) => ({ ...current, [target.name]: value }));
    setErrors((current) => ({ ...current, [target.name]: undefined }));
    setGlobalError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateContactForm(values);

    if (!result.ok) {
      setErrors(result.errors);
      setStatus("error");
      setGlobalError(
        result.errors.startedAt ??
          "Revisá los campos indicados para continuar.",
      );

      const firstInvalidField = Object.keys(result.errors).find(
        (name) => !["startedAt", "website"].includes(name),
      );
      if (firstInvalidField) {
        document
          .querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
          ?.focus();
      }
      return;
    }

    setStatus("loading");
    setGlobalError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        errors?: Partial<Record<keyof ContactFormState, string>>;
      } | null;

      if (response.ok) {
        setStatus("success");
        setValues({ ...initialState, startedAt: Date.now().toString() });
        setErrors({});
        return;
      }

      setErrors(body?.errors ?? {});
      setGlobalError(
        body?.error ??
          "No pudimos enviar la consulta. Revisá los datos e intentá nuevamente.",
      );
      setStatus("error");
    } catch {
      setGlobalError(
        "No pudimos conectarnos para enviar la consulta. Revisá tu conexión e intentá nuevamente.",
      );
      setStatus("error");
    }
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={onSubmit}>
      <input
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
        name="website"
        onChange={updateField}
        tabIndex={-1}
        value={values.website}
      />
      <input name="startedAt" type="hidden" value={values.startedAt} />

      <div className="grid gap-5 md:grid-cols-2">
        <Field error={errors.name} label="Nombre" name="name">
          <input
            aria-describedby={errors.name ? "name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
            className="field"
            id="name"
            name="name"
            onChange={updateField}
            value={values.name}
          />
        </Field>
        <Field error={errors.company} label="Empresa" name="company">
          <input
            aria-describedby={errors.company ? "company-error" : undefined}
            aria-invalid={Boolean(errors.company)}
            autoComplete="organization"
            className="field"
            id="company"
            name="company"
            onChange={updateField}
            value={values.company}
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field error={errors.email} label="Correo electrónico" name="email">
          <input
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className="field"
            id="email"
            name="email"
            onChange={updateField}
            type="email"
            value={values.email}
          />
        </Field>
        <Field error={errors.phone} label="Teléfono opcional" name="phone">
          <input
            aria-describedby={errors.phone ? "phone-error" : undefined}
            aria-invalid={Boolean(errors.phone)}
            autoComplete="tel"
            className="field"
            id="phone"
            name="phone"
            onChange={updateField}
            value={values.phone}
          />
        </Field>
      </div>

      <Field
        error={errors.solutionType}
        label="Tipo de solución"
        name="solutionType"
      >
        <select
          aria-describedby={
            errors.solutionType ? "solutionType-error" : undefined
          }
          aria-invalid={Boolean(errors.solutionType)}
          className="field"
          id="solutionType"
          name="solutionType"
          onChange={updateField}
          value={values.solutionType}
        >
          <option value="">Seleccionar</option>
          {solutionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field error={errors.message} label="Mensaje" name="message">
        <textarea
          aria-describedby={errors.message ? "message-error" : undefined}
          aria-invalid={Boolean(errors.message)}
          className="field min-h-32 resize-y"
          id="message"
          name="message"
          onChange={updateField}
          value={values.message}
        />
      </Field>

      <label className="flex gap-3 text-sm leading-6 text-muted">
        <input
          checked={values.privacy}
          aria-describedby={errors.privacy ? "privacy-error" : undefined}
          aria-invalid={Boolean(errors.privacy)}
          className="mt-1 h-4 w-4 rounded border-line text-primary-strong focus:ring-primary"
          name="privacy"
          onChange={updateField}
          type="checkbox"
        />
        <span>
          Acepto que SolutiogeniZ use estos datos para responder mi consulta
          comercial.
        </span>
      </label>
      {errors.privacy ? (
        <p className="text-sm text-red-600" id="privacy-error" role="alert">
          {errors.privacy}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-70"
        disabled={status === "loading"}
        type="submit"
      >
        <Send aria-hidden="true" size={18} />
        {status === "loading" ? "Enviando..." : "Enviar consulta"}
      </button>

      {status === "success" ? (
        <p
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Consulta enviada correctamente. Te responderemos a la brevedad.
        </p>
      ) : null}
      {status === "error" && globalError ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {globalError}
        </p>
      ) : null}
    </form>
  );
}

type FieldProps = {
  label: string;
  name: keyof ContactFormState;
  error?: string;
  children: ReactNode;
};

function Field({ label, name, error, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-ink" htmlFor={name}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-red-600" id={`${name}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
