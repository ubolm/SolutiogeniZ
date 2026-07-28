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
  nextActionAt: string;
  customerContext: {
    detectedProblems: string;
    diagnosedSystems: string;
    objections: string;
  };
  extendedProfile: {
    profileUrl: string;
    sector: string;
    locality: string;
    address: string;
    route: string;
    publicChannel: string;
    opportunityDetected: string;
    initialOffer: string;
    recommendedDemo: string;
    stage2: string;
    stage3: string;
  };
};

function getDefaultNextActionAt() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function getInitialState(): ManualLeadState {
  return {
    name: "",
    company: "",
    email: "",
    phone: "",
    interest: "sin-definir",
    summary: "",
    owner: "",
    notes: "",
    nextActionAt: getDefaultNextActionAt(),
    customerContext: {
      detectedProblems: "",
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
  };
}

const interestOptions = [
  { value: "sin-definir", label: "Todavía no definido" },
  ...chatbotServices.map((service) => ({
    value: service.slug,
    label: service.title,
  })),
];

export function ManualLeadForm({
  ownerOptions,
}: {
  ownerOptions: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<ManualLeadState>(getInitialState);
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
        body: JSON.stringify({
          ...values,
          nextActionAt: new Date(values.nextActionAt).toISOString(),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setStatus("error");
        setMessage(body?.error ?? "No pudimos crear el lead manual.");
        return;
      }

      setValues(getInitialState());
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
          <select
            className="field"
            onChange={(event) =>
              setValues((current) => ({ ...current, owner: event.target.value }))
            }
            value={values.owner}
          >
            <option value="">Responsable (opcional)</option>
            <option value="Sin asignar">Sin asignar</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="field min-h-24 resize-y"
          onChange={(event) =>
            setValues((current) => ({ ...current, summary: event.target.value }))
          }
          placeholder="Resumen comercial del caso, necesidad detectada o pedido inicial"
          value={values.summary}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-ink">
            Proxima accion
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  nextActionAt: event.target.value,
                }))
              }
              type="datetime-local"
              value={values.nextActionAt}
            />
          </label>
          <div className="rounded-[1.2rem] border border-line bg-[#f8faff] px-4 py-3 text-sm leading-6 text-muted">
            Todo lead manual deberia entrar con una proxima accion clara para no enfriarse.
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.4rem] border border-line bg-[#fbfcff] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
              Contexto comercial inicial
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Carga solo lo esencial para que el equipo ya entienda el caso al abrir el lead.
            </p>
          </div>

          <textarea
            className="field min-h-20 resize-y"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                customerContext: {
                  ...current.customerContext,
                  detectedProblems: event.target.value,
                },
              }))
            }
            placeholder="Problemas detectados"
            value={values.customerContext.detectedProblems}
          />

          <textarea
            className="field min-h-20 resize-y"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                customerContext: {
                  ...current.customerContext,
                  diagnosedSystems: event.target.value,
                },
              }))
            }
            placeholder="Sistemas o herramientas diagnosticadas"
            value={values.customerContext.diagnosedSystems}
          />

          <textarea
            className="field min-h-20 resize-y"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                customerContext: {
                  ...current.customerContext,
                  objections: event.target.value,
                },
              }))
            }
            placeholder="Objeciones o frenos iniciales"
            value={values.customerContext.objections}
          />
        </div>

        <div className="grid gap-4 rounded-[1.4rem] border border-line bg-[#fbfcff] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
              Perfil extendido
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Estos datos ayudan a enriquecer la ficha del lead sin sobrecargar la vista principal.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    profileUrl: event.target.value,
                  },
                }))
              }
              placeholder="Logo o perfil URL"
              value={values.extendedProfile.profileUrl}
            />
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    sector: event.target.value,
                  },
                }))
              }
              placeholder="Rubro"
              value={values.extendedProfile.sector}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    locality: event.target.value,
                  },
                }))
              }
              placeholder="Localidad"
              value={values.extendedProfile.locality}
            />
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    address: event.target.value,
                  },
                }))
              }
              placeholder="Direccion"
              value={values.extendedProfile.address}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    route: event.target.value,
                  },
                }))
              }
              placeholder="Ruta"
              value={values.extendedProfile.route}
            />
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    publicChannel: event.target.value,
                  },
                }))
              }
              placeholder="Canal o modalidad publica"
              value={values.extendedProfile.publicChannel}
            />
          </div>

          <textarea
            className="field min-h-20 resize-y"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                extendedProfile: {
                  ...current.extendedProfile,
                  opportunityDetected: event.target.value,
                },
              }))
            }
            placeholder="Oportunidad detectada"
            value={values.extendedProfile.opportunityDetected}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <textarea
              className="field min-h-20 resize-y"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    initialOffer: event.target.value,
                  },
                }))
              }
              placeholder="Oferta inicial"
              value={values.extendedProfile.initialOffer}
            />
            <textarea
              className="field min-h-20 resize-y"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    recommendedDemo: event.target.value,
                  },
                }))
              }
              placeholder="Demo recomendada"
              value={values.extendedProfile.recommendedDemo}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    stage2: event.target.value,
                  },
                }))
              }
              placeholder="Etapa 2"
              value={values.extendedProfile.stage2}
            />
            <input
              className="field"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  extendedProfile: {
                    ...current.extendedProfile,
                    stage3: event.target.value,
                  },
                }))
              }
              placeholder="Etapa 3"
              value={values.extendedProfile.stage3}
            />
          </div>
        </div>

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
