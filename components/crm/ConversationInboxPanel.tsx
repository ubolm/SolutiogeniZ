"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Clock3,
  MessageSquareMore,
  PhoneCall,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  getCrmRoleCapabilities,
  type CrmRole,
} from "@/lib/crm-auth";
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
  canUseOwnerSignals: boolean,
): Pick<EnrichedConversation, "priority" | "priorityLabel" | "reason"> {
  const hoursSinceLastMessage = getHoursSince(conversation.lastMessageAt);

  if (conversation.handoffRequested) {
    return {
      priority: "alta",
      priorityLabel: "Escalar hoy",
      reason: "El bot detecto necesidad de seguimiento humano.",
    };
  }

  if (conversation.channel === "whatsapp" && hoursSinceLastMessage >= 24) {
    return {
      priority: "alta",
      priorityLabel: "WhatsApp en espera",
      reason: "Paso mas de un dia desde el ultimo mensaje.",
    };
  }

  if (
    (lead?.status === "propuesta_enviada" || lead?.status === "negociacion") &&
    hoursSinceLastMessage >= 12
  ) {
    return {
      priority: "media",
      priorityLabel: "Seguimiento comercial",
      reason: "La oportunidad sigue activa y conviene retomarla.",
    };
  }

  if (canUseOwnerSignals && (lead?.owner || "Sin asignar") === "Sin asignar") {
    return {
      priority: "media",
      priorityLabel: "Sin responsable",
      reason: "La conversacion existe pero todavia no tiene dueno.",
    };
  }

  return {
    priority: "normal",
    priorityLabel: "En curso",
    reason: "Conserva contexto util, sin urgencia inmediata.",
  };
}

export function ConversationInboxPanel({
  conversations,
  leads,
  role,
}: {
  conversations: CrmConversation[];
  leads: CrmLead[];
  role: CrmRole;
}) {
  const capabilities = getCrmRoleCapabilities(role);
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todos");

  const enrichedConversations = useMemo(() => {
    return conversations
      .map((conversation) => {
        const lead = leads.find((item) => item.id === conversation.leadId) ?? null;
        const priorityState = getConversationPriority(
          conversation,
          lead,
          capabilities.canManageOwner,
        );

        return {
          conversation,
          lead,
          ...priorityState,
          hoursSinceLastMessage: getHoursSince(conversation.lastMessageAt),
        } satisfies EnrichedConversation;
      })
      .sort((a, b) => {
        const priorityWeight = { alta: 0, media: 1, normal: 2 };
        const diff = priorityWeight[a.priority] - priorityWeight[b.priority];

        if (diff !== 0) {
          return diff;
        }

        return (
          new Date(b.conversation.lastMessageAt).getTime() -
          new Date(a.conversation.lastMessageAt).getTime()
        );
      });
  }, [capabilities.canManageOwner, conversations, leads]);

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
          capabilities.canManageOwner ? lead?.owner : "",
          lead?.summary,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesChannel && matchesPriority && matchesQuery;
    });
  }, [
    capabilities.canManageOwner,
    channelFilter,
    enrichedConversations,
    priorityFilter,
    query,
  ]);

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

  return (
    <section className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-5">
        <ConversationMetric label="Total" value={conversations.length.toString()} />
        <ConversationMetric label="Web" value={webCount.toString()} />
        <ConversationMetric label="WhatsApp" value={whatsappCount.toString()} />
        <ConversationMetric
          label="Alta prioridad"
          value={highPriorityCount.toString()}
        />
        <ConversationMetric label="Derivaciones" value={handoffCount.toString()} />
      </section>

      <section className="rounded-[1.85rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(248,250,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-[1.6rem] font-semibold text-ink">
              Bandeja
            </h2>
            <p className="mt-1.5 text-[0.98rem] leading-6 text-muted">
              Filtra, prioriza y abre el lead correcto con el contexto justo.
            </p>
          </div>
          <span className="rounded-full border border-white/70 bg-white/58 px-3.5 py-1.5 text-[0.82rem] font-semibold text-muted backdrop-blur-[10px]">
            {filteredConversations.length} visibles
          </span>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.1fr_0.45fr_0.45fr]">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Buscar</span>
            <div className="field flex min-h-11 items-center gap-2 px-3 py-0">
              <Search aria-hidden="true" className="text-muted" size={16} />
              <input
                className="w-full bg-transparent text-[0.95rem] text-ink outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Empresa, contacto, resumen, intencion..."
                value={query}
              />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Canal</span>
            <select
              className="field min-h-11 text-[0.95rem]"
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
              className="field min-h-11 text-[0.95rem]"
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
            <p className="rounded-[1.3rem] border border-dashed border-white/70 bg-white/45 px-4 py-5 text-[0.95rem] text-muted backdrop-blur-[8px]">
              No encontramos conversaciones con esos filtros.
            </p>
          ) : (
            filteredConversations.map((item) => {
              const { conversation, lead } = item;

              return (
                <article
                  className="rounded-[1.35rem] border border-white/80 bg-white/62 px-4 py-4 shadow-[0_14px_28px_rgba(15,19,36,0.06)] backdrop-blur-[10px]"
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
                        <span className="rounded-full border border-white/70 bg-white/58 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                          {formatIntentLabel(conversation.detectedIntent)}
                        </span>
                      </div>
                      <p className="mt-3 text-[0.98rem] font-semibold text-ink">
                        {lead?.company ?? "Lead sin empresa"} · {lead?.name ?? "Sin contacto"}
                      </p>
                      {capabilities.canManageOwner ? (
                        <p className="mt-1 text-[0.82rem] text-muted">
                          Responsable: {lead?.owner || "Sin asignar"}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-[11px] leading-5 text-muted">
                      <p>{formatDate(conversation.lastMessageAt)}</p>
                      <p className="mt-1">hace {item.hoursSinceLastMessage}h</p>
                    </div>
                  </div>

                  <div className="mt-3.5 rounded-[1.05rem] border border-white/75 bg-white/56 px-3.5 py-3 backdrop-blur-[8px]">
                    <p className="line-clamp-3 text-[0.95rem] leading-6 text-ink">
                      {conversation.transcriptSummary}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[0.82rem] text-muted">{item.reason}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 text-[0.8rem] text-muted">
                        {conversation.handoffRequested ? (
                          <ShieldAlert aria-hidden="true" size={14} />
                        ) : (
                          <Clock3 aria-hidden="true" size={14} />
                        )}
                        Inicio: {formatDate(conversation.startedAt)}
                      </span>
                      {lead ? (
                        <Link
                          className="inline-flex rounded-full bg-[#10162f] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:-translate-y-0.5"
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

      <section className="grid gap-4 md:grid-cols-3">
        <PriorityCard
          description="Mensajes con derivacion humana o WhatsApp esperando respuesta."
          icon={<AlertTriangle aria-hidden="true" size={18} />}
          label="Alta prioridad"
          tone="danger"
          value={highPriorityCount.toString()}
        />
        <PriorityCard
          description={
            capabilities.canManageOwner
              ? "Conversaciones para empujar por etapa o por falta de responsable."
              : "Conversaciones que conviene retomar por etapa o por espera."
          }
          icon={<PhoneCall aria-hidden="true" size={18} />}
          label="Seguimiento medio"
          tone="warning"
          value={mediumPriorityCount.toString()}
        />
        <PriorityCard
          description="Interacciones estables que conservan contexto util."
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
    <article className="rounded-[1.3rem] border border-white/75 bg-white/58 p-3.5 shadow-soft backdrop-blur-[10px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-2xl font-semibold text-ink">
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
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
  tone: "danger" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#ffd6d6] bg-[linear-gradient(180deg,rgba(255,245,245,0.88)_0%,rgba(255,236,236,0.78)_100%)] text-[#b42318]"
      : tone === "warning"
        ? "border-[#ffe1b0] bg-[linear-gradient(180deg,rgba(255,248,234,0.88)_0%,rgba(255,240,212,0.78)_100%)] text-[#b56a06]"
        : "border-[#d9ebd0] bg-[linear-gradient(180deg,rgba(244,251,239,0.88)_0%,rgba(232,246,224,0.78)_100%)] text-[#267a2b]";

  return (
    <article className={`rounded-[1.45rem] border p-4 shadow-soft backdrop-blur-[10px] ${toneClass}`}>
      <div className="inline-flex rounded-full bg-white/80 p-2.5">{icon}</div>
      <p className="mt-4 text-[0.98rem] font-medium">{label}</p>
      <p className="mt-1.5 font-heading text-[2rem] font-semibold">{value}</p>
      <p className="mt-2 text-[0.92rem] leading-6 text-current/80">{description}</p>
    </article>
  );
}
