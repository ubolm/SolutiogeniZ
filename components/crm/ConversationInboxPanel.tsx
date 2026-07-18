"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  MessageSquareMore,
  PhoneCall,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { CrmConversation, CrmLead } from "@/lib/crm-store";

type ConversationPriority = "alta" | "media" | "normal";

type EnrichedConversation = {
  conversation: CrmConversation;
  lead: CrmLead | null;
  priority: ConversationPriority;
  priorityLabel: string;
  reason: string;
  hoursSinceLastMessage: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatIntentLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatChannelLabel(value: "web" | "whatsapp" | "manual") {
  if (value === "web") return "Web";
  if (value === "whatsapp") return "WhatsApp";
  return "Manual";
}

function getHoursSince(value: string) {
  return Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 3_600_000),
  );
}

function getConversationPriority(
  conversation: CrmConversation,
  lead: CrmLead | null,
): Pick<EnrichedConversation, "priority" | "priorityLabel" | "reason"> {
  const hoursSinceLastMessage = getHoursSince(conversation.lastMessageAt);

  if (conversation.handoffRequested) {
    return {
      priority: "alta",
      priorityLabel: "Escalar hoy",
      reason: "El chatbot detecto necesidad de derivacion o seguimiento humano.",
    };
  }

  if (conversation.channel === "whatsapp" && hoursSinceLastMessage >= 24) {
    return {
      priority: "alta",
      priorityLabel: "WhatsApp en espera",
      reason: "Paso mas de un dia desde el ultimo mensaje en WhatsApp.",
    };
  }

  if ((lead?.status === "propuesta" || lead?.status === "seguimiento") && hoursSinceLastMessage >= 12) {
    return {
      priority: "media",
      priorityLabel: "Seguimiento comercial",
      reason: "La oportunidad esta activa y conviene retomar la conversacion.",
    };
  }

  if ((lead?.owner || "Sin asignar") === "Sin asignar") {
    return {
      priority: "media",
      priorityLabel: "Sin responsable",
      reason: "La conversacion existe pero todavia no tiene responsable asignado.",
    };
  }

  return {
    priority: "normal",
    priorityLabel: "En curso",
    reason: "No muestra urgencia inmediata, pero conserva contexto util.",
  };
}

export function ConversationInboxPanel({
  conversations,
  leads,
}: {
  conversations: CrmConversation[];
  leads: CrmLead[];
}) {
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todos");

  const enrichedConversations = useMemo(() => {
    return conversations
      .map((conversation) => {
        const lead = leads.find((item) => item.id === conversation.leadId) ?? null;
        const priorityState = getConversationPriority(conversation, lead);

        return {
          conversation,
          lead,
          ...priorityState,
          hoursSinceLastMessage: getHoursSince(conversation.lastMessageAt),
        } satisfies EnrichedConversation;
      })
      .sort((a, b) => {
        const priorityWeight = { alta: 0, media: 1, normal: 2 };
        const diff =
          priorityWeight[a.priority] - priorityWeight[b.priority];

        if (diff !== 0) {
          return diff;
        }

        return (
          new Date(b.conversation.lastMessageAt).getTime() -
          new Date(a.conversation.lastMessageAt).getTime()
        );
      });
  }, [conversations, leads]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return enrichedConversations.filter((item) => {
      const { conversation, lead, priority, priorityLabel, reason } = item;

      const matchesChannel =
        channelFilter === "todos" || conversation.channel === channelFilter;

      const matchesPriority =
        priorityFilter === "todos" || priority === priorityFilter;

      const matchesQuery =
        !normalizedQuery ||
        [
          conversation.transcriptSummary,
          conversation.detectedIntent,
          priorityLabel,
          reason,
          lead?.company,
          lead?.name,
          lead?.owner,
          lead?.summary,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesChannel && matchesPriority && matchesQuery;
    });
  }, [channelFilter, enrichedConversations, priorityFilter, query]);

  const webCount = conversations.filter(
    (conversation) => conversation.channel === "web",
  ).length;
  const whatsappCount = conversations.filter(
    (conversation) => conversation.channel === "whatsapp",
  ).length;
  const highPriorityCount = enrichedConversations.filter(
    (item) => item.priority === "alta",
  ).length;
  const mediumPriorityCount = enrichedConversations.filter(
    (item) => item.priority === "media",
  ).length;
  const handoffCount = conversations.filter(
    (conversation) => conversation.handoffRequested,
  ).length;
  const spotlightItems = filteredConversations.slice(0, 3);

  return (
    <section className="grid gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-[#dfe5fb] bg-[linear-gradient(135deg,#ffffff_0%,#f5f8ff_50%,#ebf1ff_100%)] p-5 shadow-soft md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong">
              Centro de conversaciones
            </p>
            <h2 className="font-heading mt-3 text-3xl font-semibold text-ink">
              Prioriza que conversacion retomar primero
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Este espacio ordena las interacciones por urgencia, canal y contexto comercial para que el seguimiento no se pierda entre mensajes.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-4 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              En foco ahora
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold text-ink">
              {highPriorityCount}
            </p>
            <p className="mt-1 text-sm text-muted">con prioridad alta</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <ConversationMetric label="Total" value={conversations.length.toString()} />
          <ConversationMetric label="Web" value={webCount.toString()} />
          <ConversationMetric label="WhatsApp" value={whatsappCount.toString()} />
          <ConversationMetric label="Alta prioridad" value={highPriorityCount.toString()} />
          <ConversationMetric label="Derivaciones" value={handoffCount.toString()} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-primary-strong">
              <Sparkles aria-hidden="true" size={18} />
            </div>
            <div>
              <h3 className="font-heading text-2xl font-semibold text-ink">
                A retomar ya
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                Conversaciones que conviene tocar primero por urgencia comercial o por tiempo en espera.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {spotlightItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
                No encontramos conversaciones con esos filtros.
              </p>
            ) : (
              spotlightItems.map((item) => (
                <article
                  className="rounded-[1.5rem] border border-[#e7ebf6] bg-[#f8faff] px-4 py-4"
                  key={item.conversation.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className={priorityBadgeClass(item.priority)}>
                        {item.priorityLabel}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-ink">
                        {item.lead?.company ?? "Lead sin empresa"} •{" "}
                        {item.lead?.name ?? "Sin contacto"}
                      </p>
                    </div>
                    <p className="text-xs text-muted">
                      hace {item.hoursSinceLastMessage}h
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.reason}</p>
                  {item.lead ? (
                    <Link
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-strong transition hover:opacity-80"
                      href={`/crm/leads/${item.lead.id}`}
                    >
                      Abrir lead
                      <ArrowRight aria-hidden="true" size={14} />
                    </Link>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </article>

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-ink">
                Bandeja conversacional
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Filtra, prioriza y entra al lead correcto con mejor contexto comercial.
              </p>
            </div>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-muted">
              {filteredConversations.length} visibles
            </span>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1.1fr_0.45fr_0.45fr]">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">Buscar</span>
              <div className="field flex min-h-11 items-center gap-2 px-3 py-0">
                <Search aria-hidden="true" className="text-muted" size={16} />
                <input
                  className="w-full bg-transparent text-sm text-ink outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Empresa, responsable, resumen, intencion..."
                  value={query}
                />
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">Canal</span>
              <select
                className="field min-h-11 text-sm"
                onChange={(event) => setChannelFilter(event.target.value)}
                value={channelFilter}
              >
                <option value="todos">Todos los canales</option>
                <option value="web">Web</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="manual">Manual</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">Prioridad</span>
              <select
                className="field min-h-11 text-sm"
                onChange={(event) => setPriorityFilter(event.target.value)}
                value={priorityFilter}
              >
                <option value="todos">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="normal">Normal</option>
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            {filteredConversations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
                No encontramos conversaciones con esos filtros.
              </p>
            ) : (
              filteredConversations.map((item) => {
                const { conversation, lead } = item;

                return (
                  <article
                    className="rounded-[1.6rem] border border-[#e5e9f4] bg-[linear-gradient(180deg,#fbfcff_0%,#f6f8fc_100%)] px-4 py-4 shadow-[0_10px_28px_rgba(15,19,36,0.05)]"
                    key={conversation.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#edf2ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4454f5]">
                            {formatChannelLabel(conversation.channel)}
                          </span>
                          <span className={priorityBadgeClass(item.priority)}>
                            {item.priorityLabel}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                            {formatIntentLabel(conversation.detectedIntent)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-ink">
                          {lead?.company ?? "Lead sin empresa"} •{" "}
                          {lead?.name ?? "Sin contacto"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Responsable: {lead?.owner || "Sin asignar"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted">
                        <p>{formatDate(conversation.lastMessageAt)}</p>
                        <p className="mt-1">hace {item.hoursSinceLastMessage}h</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/80 bg-white px-4 py-4">
                      <p className="text-sm leading-6 text-ink">
                        {conversation.transcriptSummary}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className="rounded-2xl bg-[#f7f9fc] px-3 py-3 text-sm leading-6 text-muted">
                        <p className="font-semibold text-ink">Sugerencia</p>
                        <p className="mt-1">{item.reason}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 text-xs text-muted">
                          {conversation.handoffRequested ? (
                            <ShieldAlert aria-hidden="true" size={14} />
                          ) : (
                            <Clock3 aria-hidden="true" size={14} />
                          )}
                          Inicio: {formatDate(conversation.startedAt)}
                        </span>
                        {lead ? (
                          <Link
                            className="inline-flex rounded-full bg-[#10162f] px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5"
                            href={`/crm/leads/${lead.id}`}
                          >
                            Abrir lead
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <PriorityCard
          description="Mensajes con derivacion humana o WhatsApp esperando respuesta."
          icon={<AlertTriangle aria-hidden="true" size={18} />}
          label="Alta prioridad"
          tone="danger"
          value={highPriorityCount.toString()}
        />
        <PriorityCard
          description="Conversaciones que conviene empujar por etapa comercial o por falta de responsable."
          icon={<PhoneCall aria-hidden="true" size={18} />}
          label="Seguimiento medio"
          tone="warning"
          value={mediumPriorityCount.toString()}
        />
        <PriorityCard
          description="Interacciones estables que conservan contexto pero no muestran urgencia inmediata."
          icon={<MessageSquareMore aria-hidden="true" size={18} />}
          label="En curso"
          tone="neutral"
          value={(
            enrichedConversations.length - highPriorityCount - mediumPriorityCount
          ).toString()}
        />
      </section>
    </section>
  );
}

function priorityBadgeClass(priority: ConversationPriority) {
  if (priority === "alta") {
    return "rounded-full bg-[#ffe0e0] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b42318]";
  }

  if (priority === "media") {
    return "rounded-full bg-[#fff1dc] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b56a06]";
  }

  return "rounded-full bg-[#eef5e8] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#267a2b]";
}

function ConversationMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.4rem] bg-white/82 p-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold text-ink">
        {value}
      </p>
    </article>
  );
}

function PriorityCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  tone: "danger" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#ffd6d6] bg-[#fff5f5] text-[#b42318]"
      : tone === "warning"
        ? "border-[#ffe1b0] bg-[#fff8ea] text-[#b56a06]"
        : "border-[#d9ebd0] bg-[#f4fbef] text-[#267a2b]";

  return (
    <article className={`rounded-[1.6rem] border p-5 shadow-soft ${toneClass}`}>
      <div className="inline-flex rounded-full bg-white/80 p-3">{icon}</div>
      <p className="mt-4 text-sm font-medium">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-6 text-current/80">{description}</p>
    </article>
  );
}
