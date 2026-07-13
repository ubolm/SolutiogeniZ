"use client";

import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";

import { diagnosticGoals } from "@/lib/constants";
import { DiagnosticFormState, validateDiagnosticForm } from "@/lib/diagnostic";
import { trackConversionEvent } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

const initialState: DiagnosticFormState = {
  goal: "",
  currentProcess: "",
  mainProblem: "",
  tools: "",
  priority: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  privacy: false,
  website: "",
  startedAt: "",
};

const steps = [
  "Qué querés mejorar",
  "Proceso actual",
  "Problema principal",
  "Contexto actual",
  "Prioridad",
  "Contacto",
];

const fieldByStep: Array<Array<keyof DiagnosticFormState>> = [
  ["goal"],
  ["currentProcess"],
  ["mainProblem"],
  ["tools"],
  ["priority"],
  ["name", "company", "email", "privacy"],
];

const priorities = ["Baja", "Media", "Alta", "Urgente"];

export function DiagnosticForm() {
  const startedAt = useMemo(() => Date.now().toString(), []);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<DiagnosticFormState>({
    ...initialState,
    startedAt,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof DiagnosticFormState, string>>
  >({});
  const [status, setStatus] = useState<Status>("idle");
  const [globalError, setGlobalError] = useState("");

  const progress = Math.round(((step + 1) / steps.length) * 100);

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

  function selectValue(name: keyof DiagnosticFormState, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setGlobalError("");
  }

  function validateCurrentStep() {
    const result = validateDiagnosticForm(values);
    if (result.ok) return true;

    const currentFields = fieldByStep[step];
    const currentErrors = Object.fromEntries(
      Object.entries(result.errors).filter(([name]) =>
        currentFields.includes(name as keyof DiagnosticFormState),
      ),
    ) as Partial<Record<keyof DiagnosticFormState, string>>;

    if (Object.keys(currentErrors).length) {
      setErrors(currentErrors);
      setStatus("error");
      setGlobalError("Revisá este paso para continuar.");
      return false;
    }

    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;

    if (step === 0) {
      trackConversionEvent("diagnostic_started", { goal: values.goal });
    }

    trackConversionEvent("diagnostic_step_viewed", { step: step + 2 });
    setStatus("idle");
    setGlobalError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStatus("idle");
    setGlobalError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateDiagnosticForm(values);

    if (!result.ok) {
      setErrors(result.errors);
      setStatus("error");
      setGlobalError(
        result.errors.startedAt ??
          "Revisá los campos indicados para continuar.",
      );
      return;
    }

    setStatus("loading");
    setGlobalError("");

    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        errors?: Partial<Record<keyof DiagnosticFormState, string>>;
      } | null;

      if (response.ok) {
        trackConversionEvent("diagnostic_completed", {
          goal: result.data.goal,
          priority: result.data.priority,
        });
        setStatus("success");
        setErrors({});
        return;
      }

      setErrors(body?.errors ?? {});
      setGlobalError(
        body?.error ??
          "No pudimos enviar el diagnóstico. Revisá los datos e intentá nuevamente.",
      );
      setStatus("error");
    } catch {
      setGlobalError(
        "No pudimos conectarnos para enviar el diagnóstico. Revisá tu conexión e intentá nuevamente.",
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-900"
        role="status"
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-emerald-700">
          <Check aria-hidden="true" size={22} />
        </div>
        <h3 className="font-heading mt-5 text-2xl font-semibold">
          Gracias por solicitar tu demo gratis.
        </h3>
        <p className="mt-3 leading-7">
          Revisaremos la información y nos pondremos en contacto para mostrarte
          por dónde podrías empezar a recuperar tiempo, orden y oportunidades.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-6" noValidate onSubmit={onSubmit}>
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

      <div>
        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-muted">
          <span>
            Paso {step + 1} de {steps.length}
          </span>
          <span>{steps[step]}</span>
        </div>
        <div
          aria-label={`Progreso del diagnóstico: ${progress}%`}
          className="mt-3 h-2 overflow-hidden rounded-full bg-paper"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-brand-gradient transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step === 0 ? (
        <Step title="¿Qué querés mejorar primero?">
          <div className="grid gap-3 sm:grid-cols-2">
            {diagnosticGoals.map((goal) => (
              <button
                className={`min-h-16 rounded-2xl border p-4 text-left text-sm font-semibold transition focus:outline-none focus-visible:shadow-focus ${
                  values.goal === goal
                    ? "border-primary bg-primary/10 text-primary-strong"
                    : "border-line bg-white text-ink hover:border-primary/40"
                }`}
                key={goal}
                onClick={() => selectValue("goal", goal)}
                type="button"
              >
                {goal}
              </button>
            ))}
          </div>
          <ErrorMessage error={errors.goal} id="goal-error" />
        </Step>
      ) : null}

      {step === 1 ? (
        <Step title="¿Cómo realizás actualmente ese proceso?">
          <textarea
            aria-describedby={
              errors.currentProcess ? "currentProcess-error" : undefined
            }
            aria-invalid={Boolean(errors.currentProcess)}
            className="field min-h-36 resize-y"
            name="currentProcess"
            onChange={updateField}
            placeholder="Ejemplo: llega una consulta por WhatsApp, se copia a una planilla y alguien recuerda hacer el seguimiento."
            value={values.currentProcess}
          />
          <ErrorMessage
            error={errors.currentProcess}
            id="currentProcess-error"
          />
        </Step>
      ) : null}

      {step === 2 ? (
        <Step title="¿Cuál es el principal problema?">
          <textarea
            aria-describedby={
              errors.mainProblem ? "mainProblem-error" : undefined
            }
            aria-invalid={Boolean(errors.mainProblem)}
            className="field min-h-32 resize-y"
            name="mainProblem"
            onChange={updateField}
            placeholder="Demoras, errores, olvidos, consultas que no avanzan, doble carga de datos, falta de visibilidad..."
            value={values.mainProblem}
          />
          <ErrorMessage error={errors.mainProblem} id="mainProblem-error" />
        </Step>
      ) : null}

      {step === 3 ? (
        <Step title="¿Con qué trabajás hoy en ese proceso?">
          <input
            aria-describedby={errors.tools ? "tools-error" : undefined}
            aria-invalid={Boolean(errors.tools)}
            className="field"
            name="tools"
            onChange={updateField}
            placeholder="Planillas, correo, formularios, sistemas internos, mensajes..."
            value={values.tools}
          />
          <ErrorMessage error={errors.tools} id="tools-error" />
        </Step>
      ) : null}

      {step === 4 ? (
        <Step title="¿Qué prioridad tiene?">
          <div className="grid gap-3 sm:grid-cols-4">
            {priorities.map((priority) => (
              <button
                className={`min-h-12 rounded-2xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:shadow-focus ${
                  values.priority === priority
                    ? "border-primary bg-primary/10 text-primary-strong"
                    : "border-line bg-white text-ink hover:border-primary/40"
                }`}
                key={priority}
                onClick={() => selectValue("priority", priority)}
                type="button"
              >
                {priority}
              </button>
            ))}
          </div>
          <ErrorMessage error={errors.priority} id="priority-error" />
          <p className="text-sm leading-6 text-muted">
            Esto nos ayuda a entender cuán urgente es resolver el problema y
            cuánto podría estar afectando hoy tu operación.
          </p>
        </Step>
      ) : null}

      {step === 5 ? (
        <Step title="¿Cómo podemos contactarte?">
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={errors.name} label="Nombre" name="name">
              <input
                aria-describedby={
                  errors.name ? "diagnostic-name-error" : undefined
                }
                aria-invalid={Boolean(errors.name)}
                autoComplete="name"
                className="field"
                id="diagnostic-name"
                name="name"
                onChange={updateField}
                placeholder="Tu nombre"
                value={values.name}
              />
            </Field>
            <Field error={errors.company} label="Empresa" name="company">
              <input
                aria-describedby={
                  errors.company ? "diagnostic-company-error" : undefined
                }
                aria-invalid={Boolean(errors.company)}
                autoComplete="organization"
                className="field"
                id="diagnostic-company"
                name="company"
                onChange={updateField}
                placeholder="Nombre de tu empresa"
                value={values.company}
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={errors.email} label="Correo electrónico" name="email">
              <input
                aria-describedby={
                  errors.email ? "diagnostic-email-error" : undefined
                }
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                className="field"
                id="diagnostic-email"
                name="email"
                onChange={updateField}
                placeholder="tuemail@empresa.com"
                type="email"
                value={values.email}
              />
            </Field>
            <Field error={undefined} label="Teléfono opcional" name="phone">
              <input
                autoComplete="tel"
                className="field"
                id="diagnostic-phone"
                name="phone"
                onChange={updateField}
                placeholder="Opcional"
                value={values.phone}
              />
            </Field>
          </div>
          <label className="flex gap-3 text-sm leading-6 text-muted">
            <input
              checked={values.privacy}
              aria-describedby={
                errors.privacy ? "diagnostic-privacy-error" : undefined
              }
              aria-invalid={Boolean(errors.privacy)}
              className="mt-1 h-4 w-4 rounded border-line text-primary-strong focus:ring-primary"
              name="privacy"
              onChange={updateField}
              type="checkbox"
            />
            <span>
              Acepto que SolutiogeniZ use estos datos para responder mi
              solicitud de demo y contacto inicial.
            </span>
          </label>
          <ErrorMessage error={errors.privacy} id="diagnostic-privacy-error" />
        </Step>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-primary/40 focus:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50"
          disabled={step === 0 || status === "loading"}
          onClick={goBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Volver
        </button>

        {step < steps.length - 1 ? (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:shadow-focus"
            onClick={goNext}
            type="button"
          >
            Continuar
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-70"
            disabled={status === "loading"}
            type="submit"
          >
            <Send aria-hidden="true" size={17} />
            {status === "loading" ? "Enviando..." : "Solicitar demo gratis"}
          </button>
        )}
      </div>

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

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4" aria-label={title}>
      <h3 className="font-heading text-2xl font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function ErrorMessage({ error, id }: { error?: string; id: string }) {
  if (!error) return null;

  return (
    <p className="text-sm text-red-600" id={id} role="alert">
      {error}
    </p>
  );
}

type FieldProps = {
  label: string;
  name: keyof DiagnosticFormState;
  error?: string;
  children: ReactNode;
};

function Field({ label, name, error, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <label
        className="text-sm font-semibold text-ink"
        htmlFor={`diagnostic-${name}`}
      >
        {label}
      </label>
      {children}
      <ErrorMessage error={error} id={`diagnostic-${name}-error`} />
    </div>
  );
}
