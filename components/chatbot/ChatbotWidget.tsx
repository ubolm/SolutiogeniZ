"use client";

import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { trackConversionEvent } from "@/lib/analytics";
import {
  chatbotLeadQuestions,
  chatbotProfile,
  chatbotServices,
  type ChatbotLeadInterest,
} from "@/lib/chatbot";
import type { ChatbotLeadFormState } from "@/lib/chatbot-lead";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type ChatAction =
  | { type: "message"; label: string; value: string }
  | { type: "link"; label: string; href: string }
  | { type: "lead"; label: string };

type ChatApiResponse = {
  reply: string;
  actions?: ChatAction[];
  captureLead?: boolean;
  intent?: string;
  interest?: ChatbotLeadInterest | "";
};

const initialMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: chatbotProfile.welcomeMessage,
};

const initialActions: ChatAction[] = [
  {
    type: "message",
    label: "Conocer servicios",
    value: "Quiero conocer sus servicios",
  },
  {
    type: "message",
    label: "Pedir auditoria",
    value: "Quiero pedir una auditoria",
  },
  {
    type: "message",
    label: "Implementar chatbot",
    value: "Quiero implementar un chatbot para WhatsApp y web",
  },
  { type: "lead", label: "Dejar mis datos" },
];

const interestOptions = chatbotServices.map((service) => ({
  value: service.slug,
  label: service.title,
}));

export function ChatbotWidget() {
  const startedAt = useMemo(() => Date.now().toString(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [actions, setActions] = useState<ChatAction[]>(initialActions);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [lastIntent, setLastIntent] = useState("consulta_general");
  const [lastInterest, setLastInterest] = useState<ChatbotLeadInterest | "">(
    "",
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ChatbotLeadFormState, string>>
  >({});
  const [leadStatus, setLeadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadForm, setLeadForm] = useState<ChatbotLeadFormState>({
    name: "",
    company: "",
    email: "",
    phone: "",
    interest: "",
    currentProcess: "",
    mainProblem: "",
    privacy: false,
    source: "web",
    website: "",
    startedAt,
  });

  function appendMessage(role: ChatMessage["role"], content: string) {
    setMessages((current) => [
      ...current,
      {
        id: `${role}-${current.length + 1}-${Date.now()}`,
        role,
        content,
      },
    ]);
  }

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    appendMessage("user", trimmed);
    setInput("");
    setLoading(true);
    setLeadMessage("");

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", message: trimmed }),
      });
      const body = (await response.json().catch(() => null)) as
        | ({ error?: string } & Partial<ChatApiResponse>)
        | null;

      if (!response.ok || !body?.reply) {
        appendMessage(
          "assistant",
          body?.error ??
            "No pude responder en este momento. Proba nuevamente en unos segundos.",
        );
        return;
      }

      appendMessage("assistant", body.reply);
      setActions(body.actions ?? []);
      if (body.intent) {
        setLastIntent(body.intent);
      }
      if (body.interest) {
        setLastInterest(body.interest);
        setLeadForm((current) => ({
          ...current,
          interest: body.interest ?? current.interest,
        }));
      }
      if (body.captureLead) {
        setShowLeadForm(true);
      }
    } catch {
      appendMessage(
        "assistant",
        "No pude conectarme para responder ahora. Proba nuevamente en unos segundos.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleAction(action: ChatAction) {
    if (action.type === "message") {
      void sendMessage(action.value);
      return;
    }

    if (action.type === "link") {
      window.location.hash = action.href.replace("#", "");
      setIsOpen(false);
      return;
    }

    setShowLeadForm(true);
    setLeadMessage("");
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadStatus("loading");
    setLeadMessage("");

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lead",
          lead: leadForm,
          intent: lastIntent,
          interest: lastInterest,
          transcript: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            reply?: string;
            error?: string;
            errors?: Partial<Record<keyof ChatbotLeadFormState, string>>;
          }
        | null;

      if (response.ok && body?.ok) {
        trackConversionEvent("chatbot_lead_submitted", {
          interest: leadForm.interest || "sin-definir",
        });
        setLeadStatus("success");
        setErrors({});
        const successMessage =
          body.reply ??
          "Gracias. Ya recibimos tu consulta y te vamos a contactar.";
        setLeadMessage(successMessage);
        appendMessage("assistant", successMessage);
        setShowLeadForm(false);
        setActions([
          { type: "link", label: "Ir a auditoria", href: "#diagnostico" },
          {
            type: "message",
            label: "Ver servicios",
            value: "Quiero conocer sus servicios",
          },
        ]);
        return;
      }

      setErrors(body?.errors ?? {});
      setLeadMessage(
        body?.error ??
          "No pudimos enviar tu consulta. Revisa los datos e intenta nuevamente.",
      );
      setLeadStatus("error");
    } catch {
      setLeadStatus("error");
      setLeadMessage(
        "No pudimos conectarnos para enviar tus datos. Revisa tu conexion e intenta nuevamente.",
      );
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <section className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_22px_80px_rgba(11,11,15,0.16)]">
          <div className="bg-brand-gradient px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                  <Sparkles aria-hidden="true" size={14} />
                  Asistente comercial
                </p>
                <h2 className="mt-2 font-heading text-xl font-semibold">
                  SolutiogeniZ
                </h2>
                <p className="mt-1 text-sm leading-6 text-white/84">
                  Te ayudo a entender que servicio te conviene y dejar tu
                  consulta.
                </p>
              </div>
              <button
                aria-label="Cerrar chat"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/14 text-white transition hover:bg-white/22"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-[28rem] space-y-4 overflow-y-auto bg-[#f7f8fc] px-4 py-4">
            {messages.map((message) => (
              <div
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "bg-white text-ink shadow-[0_1px_0_rgba(11,11,15,0.03)]"
                      : "bg-[#4454f5] text-white"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {actions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <button
                    className="rounded-full border border-[#d9def7] bg-white px-3 py-2 text-xs font-semibold text-[#4454f5] transition hover:border-[#4454f5] hover:bg-[#eef1ff]"
                    key={`${action.type}-${action.label}`}
                    onClick={() => handleAction(action)}
                    type="button"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}

            {showLeadForm ? (
              <form
                className="grid gap-3 rounded-[1.5rem] border border-[#e6e8f2] bg-white p-4"
                noValidate
                onSubmit={submitLead}
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Deja tu consulta
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Con estos datos ya podemos continuar la conversacion con
                    contexto.
                  </p>
                </div>

                <input
                  aria-hidden="true"
                  autoComplete="off"
                  className="hidden"
                  name="website"
                  onChange={(event) =>
                    setLeadForm((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                  tabIndex={-1}
                  value={leadForm.website}
                />
                <input
                  name="startedAt"
                  type="hidden"
                  value={leadForm.startedAt}
                />

                <select
                  className="field text-sm"
                  name="interest"
                  onChange={(event) =>
                    setLeadForm((current) => ({
                      ...current,
                      interest: event.target.value as ChatbotLeadInterest,
                    }))
                  }
                  value={leadForm.interest}
                >
                  <option value="">Que queres mejorar primero</option>
                  {interestOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.interest ? (
                  <p className="text-xs text-red-600">{errors.interest}</p>
                ) : null}

                {chatbotLeadQuestions
                  .filter((question) => !["interest", "phone"].includes(question.id))
                  .map((question) => {
                    const isTextArea =
                      question.field === "currentProcess" ||
                      question.field === "mainProblem";
                    const isEmail = question.field === "email";

                    return (
                      <div className="grid gap-1.5" key={question.id}>
                        <label className="text-xs font-semibold text-ink">
                          {question.label}
                        </label>
                        {isTextArea ? (
                          <textarea
                            className="field min-h-24 resize-y text-sm"
                            name={question.field}
                            onChange={(event) =>
                              setLeadForm((current) => ({
                                ...current,
                                [question.field]: event.target.value,
                              }))
                            }
                            placeholder={question.placeholder}
                            value={String(leadForm[question.field] ?? "")}
                          />
                        ) : (
                          <input
                            className="field text-sm"
                            name={question.field}
                            onChange={(event) =>
                              setLeadForm((current) => ({
                                ...current,
                                [question.field]: event.target.value,
                              }))
                            }
                            placeholder={question.placeholder}
                            type={isEmail ? "email" : "text"}
                            value={String(leadForm[question.field] ?? "")}
                          />
                        )}
                        {errors[question.field] ? (
                          <p className="text-xs text-red-600">
                            {errors[question.field]}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}

                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-ink">
                    {chatbotLeadQuestions.find(
                      (question) => question.field === "phone",
                    )?.label ?? "Telefono o WhatsApp"}
                  </label>
                  <input
                    className="field text-sm"
                    name="phone"
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="Telefono o WhatsApp"
                    value={leadForm.phone}
                  />
                  {errors.phone ? (
                    <p className="text-xs text-red-600">{errors.phone}</p>
                  ) : null}
                </div>

                <label className="flex gap-3 text-xs leading-5 text-muted">
                  <input
                    checked={leadForm.privacy}
                    className="mt-0.5 h-4 w-4 rounded border-[#d0d5e6] text-[#4454f5] focus:ring-[#4454f5]"
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        privacy: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>
                    Acepto que SolutiogeniZ use estos datos para responder mi
                    consulta comercial.
                  </span>
                </label>
                {errors.privacy ? (
                  <p className="text-xs text-red-600">{errors.privacy}</p>
                ) : null}

                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={leadStatus === "loading"}
                  type="submit"
                >
                  <Send aria-hidden="true" size={16} />
                  {leadStatus === "loading" ? "Enviando..." : "Enviar consulta"}
                </button>

                {leadMessage ? (
                  <p
                    className={`rounded-2xl px-3 py-2 text-xs leading-5 ${
                      leadStatus === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border border-red-200 bg-red-50 text-red-700"
                    }`}
                    role={leadStatus === "success" ? "status" : "alert"}
                  >
                    {leadMessage}
                  </p>
                ) : null}
              </form>
            ) : null}
          </div>

          <form
            className="border-t border-[#eceff7] bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <div className="flex items-center gap-2 rounded-full border border-[#dde2f0] bg-[#f7f8fc] px-3 py-2">
              <Bot aria-hidden="true" className="text-[#4454f5]" size={18} />
              <input
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escribi tu consulta..."
                value={input}
              />
              <button
                aria-label="Enviar mensaje"
                className="grid h-9 w-9 place-items-center rounded-full bg-[#4454f5] text-white transition hover:bg-[#3643d4] disabled:opacity-70"
                disabled={loading || !input.trim()}
                type="submit"
              >
                <Send aria-hidden="true" size={16} />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        className="inline-flex items-center gap-3 rounded-full bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_48px_rgba(68,84,245,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(68,84,245,0.42)]"
        onClick={() => {
          setIsOpen((current) => !current);
          trackConversionEvent("chatbot_opened");
        }}
        type="button"
      >
        <MessageCircle aria-hidden="true" size={18} />
        {isOpen ? "Ocultar asistente" : "Hablar con SolutiogeniZ"}
      </button>
    </div>
  );
}
