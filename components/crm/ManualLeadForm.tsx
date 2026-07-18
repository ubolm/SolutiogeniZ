"use client";

import { Plus, SendHorizonal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ChatbotLeadInterest } from "@/lib/chatbot";
import { chatbotServices } from "@/lib/chatbot";

type ManualLeadState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  interest: ChatbotLeadInterest | "sin-definir";
  summary: string;
  owner: string;
  notes: string;
};

const initialState: ManualLeadState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  interest: "sin-definir",
  summary: "",
  owner: "",
  notes: "",
};

const interestOptions = [
  { value: "sin-definir", label: "Todavía no definido" },
  ...chatbotServices.map((service) => ({
    value: service.slug,
    label: service.title,
  })),
];

export function ManualLeadForm() {
  const router = useRouter();
  const [values, setValues] = useState<ManualLeadState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setStatus("error");
        setMessage(body?.error ?? "No pudimos crear el lead manual.");
        return;
      }

      setValues(initialState);
      setStatus("success");
      setMessage("Lead creado y agregado al pipeline.");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("No pudimos conectarnos para guardar el lead.");
    }
  }

  return (
    <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex rounded-full bg-[#eef1ff] p-3 text-primary-strong">
          <Plus aria-hidden="true" size={18} />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Alta Manual
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Cargá leads manualmente para empezar a usar el CRM aunque todavía no
            entren desde WhatsApp o la web.
          </p>
        </div>
      </div>

      <form className="mt-6 grid gap-4" noValidate onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="field"
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Nombre"
            value={values.name}
          />
          <input
            className="field"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                company: event.target.value,
              }))
            }
            placeholder="Empresa"
            value={values.company}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="field"
            onChange={(event) =>
              setValues((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Correo (opcional)"
            type="email"
            value={values.email}
          />
          <input
            className="field"
            onChange={(event) =>
              setValues((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="Teléfono o WhatsApp (opcional)"
            value={values.phone}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="field"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                interest: event.target.value as ManualLeadState["interest"],
              }))
            }
            value={values.interest}
          >
            {interestOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="field"
            onChange={(event) =>
              setValues((current) => ({ ...current, owner: event.target.value }))
            }
            placeholder="Responsable (opcional)"
            value={values.owner}
          />
        </div>

        <textarea
          className="field min-h-24 resize-y"
          onChange={(event) =>
            setValues((current) => ({ ...current, summary: event.target.value }))
          }
          placeholder="Resumen del caso, necesidad o contexto comercial"
          value={values.summary}
        />

        <textarea
          className="field min-h-24 resize-y"
          onChange={(event) =>
            setValues((current) => ({ ...current, notes: event.target.value }))
          }
          placeholder="Notas internas opcionales"
          value={values.notes}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            disabled={status === "loading"}
            type="submit"
          >
            <SendHorizonal aria-hidden="true" size={16} />
            {status === "loading" ? "Guardando..." : "Crear lead"}
          </button>
          {message ? (
            <p
              className={`text-sm ${
                status === "success" ? "text-emerald-700" : "text-red-600"
              }`}
              role={status === "success" ? "status" : "alert"}
            >
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
