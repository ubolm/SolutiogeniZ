"use client";

import {
  ArrowLeftRight,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Filter,
  GripVertical,
  Mail,
  MessageSquareMore,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  crmLeadSources,
  crmLeadStatuses,
  type ChatbotLeadStatus,
} from "@/lib/chatbot";
import { chatbotServices } from "@/lib/chatbot";
import { getCrmRoleCapabilities, type CrmRole } from "@/lib/crm-auth";
import type { CrmActivity, CrmConversation, CrmLead } from "@/lib/crm-store";

type EditableLead = {
  id: string;
  status: ChatbotLeadStatus;
  owner: string;
  nextActionAt: string;
  notes: string;
};

const statusLabels: Record<ChatbotLeadStatus, string> = {
  contactado: "Contactados",
  respondio: "Respondieron",
  reunion_agendada: "Reunion",
  propuesta_enviada: "Propuesta",
  negociacion: "Negociacion",
  cliente: "Clientes",
  perdido: "Perdidos",
};

const statusAccent: Record<ChatbotLeadStatus, string> = {
  contactado: "bg-[#effaf4] text-[#16794e] border-[#bde7cc]",
  respondio: "bg-[#eef4ff] text-[#2f5bea] border-[#c9d8ff]",
  reunion_agendada: "bg-[#fff7e9] text-[#b56a06] border-[#f3d39a]",
  propuesta_enviada: "bg-[#f6efff] text-[#6d3cc7] border-[#d5c0f7]",
  negociacion: "bg-[#fff0f0] text-[#c54646] border-[#f1b9b9]",
  cliente: "bg-[#ebfbf2] text-[#0b7a43] border-[#b7e7ca]",
  perdido: "bg-[#f2f4f7] text-[#5b6472] border-[#d8dde5]",
};

const interestOptions = [
  { value: "todos", label: "Todos los intereses" },
  { value: "sin-definir", label: "Todavia no definido" },
  ...chatbotServices.map((service) => ({
    value: service.slug,
    label: service.title,
  })),
];

const interestLabelMap = Object.fromEntries(
  chatbotServices.map((service) => [service.slug, service.title]),
) as Record<string, string>;

function formatDateInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatInterestLabel(value: string) {
  return interestLabelMap[value] ?? value.replaceAll("-", " ");
}

function truncateCopy(value: string, maxLength = 96) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return "Sin resumen cargado.";
  }

  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, maxLength - 1).trim()}...`;
}

function formatSourceLabel(value: CrmLead["source"]) {
  if (value === "web") return "Web";
  if (value === "whatsapp") return "WhatsApp";
  return "Manual";
}

function getLeadInitials(lead: CrmLead) {
  const source = lead.company.trim() || lead.name.trim() || "SG";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "SG";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getDaysUntil(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  return Math.round(diff / 86_400_000);
}

function getAttentionPriority(daysUntilAction: number) {
  if (daysUntilAction < 0) {
    return {
      label: "Urgente",
      className: "border-[#ffd1d1] bg-[#fff3f3] text-[#c54646]",
    };
  }

  if (daysUntilAction === 0) {
    return {
      label: "Hoy",
      className: "border-[#ffe1b0] bg-[#fff8ea] text-[#b56a06]",
    };
  }

  if (daysUntilAction <= 2) {
    return {
      label: "Alta",
      className: "border-[#d9e1ff] bg-[#eef2ff] text-[#4454f5]",
    };
  }

  return {
    label: "Normal",
    className: "border-[#dde5f0] bg-[#f6f8fc] text-[#60708a]",
  };
}

function buildWhatsAppLink(phone: string) {
  const normalized = phone.replace(/[^\d]/g, "");

  if (!normalized) {
    return null;
  }

  return `https://wa.me/${normalized}`;
}

function getAdjacentStatuses(status: ChatbotLeadStatus) {
  const index = crmLeadStatuses.indexOf(status);

  return {
    previous: index > 0 ? crmLeadStatuses[index - 1] : null,
    next: index < crmLeadStatuses.length - 1 ? crmLeadStatuses[index + 1] : null,
  };
}

function draftHasStatus(
  draft: EditableLead | undefined,
  currentStatus: ChatbotLeadStatus,
  columnStatus: ChatbotLeadStatus,
) {
  return (draft?.status ?? currentStatus) === columnStatus;
}

export function LeadPipelineManager({
  leads,
  activities,
  conversations,
  ownerOptions,
  role,
}: {
  leads: CrmLead[];
  activities: CrmActivity[];
  conversations: CrmConversation[];
  ownerOptions: string[];
  role: CrmRole;
}) {
  const router = useRouter();
  const capabilities = getCrmRoleCapabilities(role);

  const [drafts, setDrafts] = useState<Record<string, EditableLead>>(
    Object.fromEntries(
      leads.map((lead) => [
        lead.id,
        {
          id: lead.id,
          status: lead.status,
          owner: lead.owner,
          nextActionAt: formatDateInput(lead.nextActionAt),
          notes: lead.notes,
        },
      ]),
    ),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] =
    useState<ChatbotLeadStatus | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("todos");
  const [interestFilter, setInterestFilter] = useState("todos");
  const [ownerFilter, setOwnerFilter] = useState("todos");

  useEffect(() => {
    setDrafts((current) => {
      const nextEntries = leads
        .filter((lead) => !current[lead.id])
        .map((lead) => [
          lead.id,
          {
            id: lead.id,
            status: lead.status,
            owner: lead.owner,
            nextActionAt: formatDateInput(lead.nextActionAt),
            notes: lead.notes,
          },
        ] as const);

      if (nextEntries.length === 0) {
        return current;
      }

      return {
        ...current,
        ...Object.fromEntries(nextEntries),
      };
    });
  }, [leads]);

  const ownerFilterOptions = useMemo(
    () => [
      "todos",
      ...Array.from(
        new Set(
          leads
            .map((lead) => drafts[lead.id]?.owner || lead.owner || "Sin asignar")
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [drafts, leads],
  );

  const assignableOwnerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            "Sin asignar",
            ...ownerOptions,
            ...leads.map((lead) => lead.owner || "Sin asignar"),
          ].filter(Boolean),
        ),
      ).sort((a, b) => {
        if (a === "Sin asignar") return -1;
        if (b === "Sin asignar") return 1;
        return a.localeCompare(b);
      }),
    [leads, ownerOptions],
  );

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leads.filter((lead) => {
      const draft = drafts[lead.id];
      const owner = draft?.owner || lead.owner || "Sin asignar";

      const matchesQuery =
        !normalizedQuery ||
        [
          lead.name,
          lead.company,
          lead.email,
          lead.phone,
          lead.summary,
          owner,
          lead.interest,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesSource =
        sourceFilter === "todos" || lead.source === sourceFilter;

      const matchesInterest =
        interestFilter === "todos" || lead.interest === interestFilter;

      const matchesOwner =
        !capabilities.canManageOwner ||
        ownerFilter === "todos" ||
        owner === ownerFilter;

      return matchesQuery && matchesSource && matchesInterest && matchesOwner;
    });
  }, [
    capabilities.canManageOwner,
    drafts,
    interestFilter,
    leads,
    ownerFilter,
    query,
    sourceFilter,
  ]);

  const leadsByStatus = useMemo(
    () =>
      Object.fromEntries(
        crmLeadStatuses.map((status) => [
          status,
          filteredLeads.filter((lead) =>
            draftHasStatus(drafts[lead.id], lead.status, status),
          ),
        ]),
      ) as Record<ChatbotLeadStatus, CrmLead[]>,
    [drafts, filteredLeads],
  );

  async function persistLead(id: string, message = "Cambios guardados.") {
    const draft = drafts[id];

    if (!draft) return false;

    setSavingId(id);
    setFeedback((current) => ({ ...current, [id]: "" }));

    try {
      const payload: {
        status: ChatbotLeadStatus;
        nextActionAt: string;
        owner?: string;
        notes?: string;
      } = {
        status: draft.status,
        nextActionAt: new Date(draft.nextActionAt).toISOString(),
      };

      if (capabilities.canManageOwner) {
        payload.owner = draft.owner;
      }

      if (capabilities.canManageInternalNotes) {
        payload.notes = draft.notes;
      }

      const response = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setFeedback((current) => ({
          ...current,
          [id]: body?.error ?? "No pudimos guardar los cambios.",
        }));
        return false;
      }

      setFeedback((current) => ({
        ...current,
        [id]: message,
      }));
      router.refresh();
      return true;
    } catch {
      setFeedback((current) => ({
        ...current,
        [id]: "No pudimos guardar los cambios.",
      }));
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function moveLeadToStatus(
    leadId: string,
    nextStatus: ChatbotLeadStatus,
  ) {
    const currentDraft = drafts[leadId];

    if (!currentDraft || currentDraft.status === nextStatus) return;

    const previousStatus = currentDraft.status;

    setDrafts((current) => ({
      ...current,
      [leadId]: {
        ...current[leadId],
        status: nextStatus,
      },
    }));

    const ok = await persistLead(
      leadId,
      `Lead movido a ${statusLabels[nextStatus].toLowerCase()}.`,
    );

    if (!ok) {
      setDrafts((current) => ({
        ...current,
        [leadId]: {
          ...current[leadId],
          status: previousStatus,
        },
      }));
    }
  }

  if (leads.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
        Todavia no hay leads guardados. Cuando alguien deje sus datos desde el
        chatbot, van a aparecer aca.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(246,249,255,0.62)_100%)] p-4 shadow-soft backdrop-blur-[12px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[0.98rem] font-semibold text-ink">
            <Filter aria-hidden="true" size={16} />
            Filtros del pipeline
          </div>
          <p className="text-[0.84rem] text-muted">
            {filteredLeads.length} de {leads.length} oportunidades visibles
          </p>
        </div>

        <div
          className={`mt-3 grid gap-2.5 ${
            capabilities.canManageOwner
              ? "xl:grid-cols-[1.4fr_0.85fr_0.95fr_0.95fr]"
              : "xl:grid-cols-[1.5fr_0.95fr_1fr]"
          }`}
        >
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Buscar</span>
            <div className="field flex min-h-11 items-center gap-2 px-3 py-0">
              <Search aria-hidden="true" className="text-muted" size={16} />
              <input
                className="w-full bg-transparent text-[0.95rem] text-ink outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, empresa, resumen o telefono"
                value={query}
              />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Canal</span>
            <select
              className="field min-h-11 text-[0.95rem]"
              onChange={(event) => setSourceFilter(event.target.value)}
              value={sourceFilter}
            >
              <option value="todos">Todos los canales</option>
              {crmLeadSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Interes</span>
            <select
              className="field min-h-11 text-[0.95rem]"
              onChange={(event) => setInterestFilter(event.target.value)}
              value={interestFilter}
            >
              {interestOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {capabilities.canManageOwner ? (
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">Responsable</span>
              <select
                className="field min-h-11 text-[0.95rem]"
                onChange={(event) => setOwnerFilter(event.target.value)}
                value={ownerFilter}
              >
                {ownerFilterOptions.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner === "todos" ? "Todos los responsables" : owner}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {crmLeadStatuses.map((status) => {
          const columnLeads = leadsByStatus[status];
          const isDropTarget = dropTargetStatus === status;

          return (
            <section
              className={`flex min-h-[34rem] w-[22.75rem] shrink-0 flex-col rounded-[1.65rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.56)_0%,rgba(244,247,255,0.66)_100%)] p-4 shadow-soft backdrop-blur-[10px] transition ${
                isDropTarget
                  ? "border-primary-strong shadow-[0_0_0_3px_rgba(68,84,245,0.12)]"
                  : "border-line"
              }`}
              key={status}
              onDragEnter={(event) => {
                event.preventDefault();
                if (draggedLeadId) {
                  setDropTargetStatus(status);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedLeadId) {
                  setDropTargetStatus(status);
                }
              }}
              onDragLeave={() => {
                if (dropTargetStatus === status) {
                  setDropTargetStatus(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();

                const leadId =
                  event.dataTransfer.getData("text/plain") || draggedLeadId;

                setDropTargetStatus(null);
                setDraggedLeadId(null);

                if (!leadId) return;

                void moveLeadToStatus(leadId, status);
              }}
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.88rem] font-semibold text-ink">
                    {statusLabels[status]}
                  </p>
                  <p className="mt-1 text-[0.8rem] text-muted">
                    {columnLeads.length} lead{columnLeads.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusAccent[status]}`}
                >
                  {columnLeads.length}
                </span>
              </header>

              <div className="mt-4 grid gap-3">
                {columnLeads.length === 0 ? (
                  <div className="rounded-[1.35rem] border border-dashed border-line bg-white/34 px-4 py-6 text-sm text-muted">
                    No hay oportunidades en esta etapa.
                  </div>
                ) : null}

                {columnLeads.map((lead) => {
                  const draft = drafts[lead.id];
                  const isExpanded = expandedId === lead.id;
                  const isSaving = savingId === lead.id;
                  const whatsappLink = buildWhatsAppLink(lead.phone);
                  const daysUntilAction = getDaysUntil(draft?.nextActionAt ?? lead.nextActionAt);
                  const attention = getAttentionPriority(daysUntilAction);
                  const relatedConversationCount = conversations.filter(
                    (conversation) => conversation.leadId === lead.id,
                  ).length;
                  const relatedActivityCount = activities.filter(
                    (activity) => activity.leadId === lead.id,
                  ).length;
                  const adjacentStatuses = getAdjacentStatuses(
                    draft?.status ?? lead.status,
                  );

                  return (
                    <article
                      className="rounded-[1.45rem] border border-white/80 bg-white/74 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-[10px]"
                      draggable
                      key={lead.id}
                      onDragEnd={() => {
                        setDraggedLeadId(null);
                        setDropTargetStatus(null);
                      }}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", lead.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDraggedLeadId(lead.id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[0.95rem] font-semibold text-primary-strong">
                            {getLeadInitials(lead)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[1rem] font-semibold text-ink">
                              {lead.company || lead.name}
                            </p>
                            <p className="truncate text-[0.86rem] text-muted">
                              {lead.name || "Sin nombre"} · {formatSourceLabel(lead.source)}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/72 text-muted transition hover:text-ink"
                            onClick={() =>
                              setExpandedId((current) =>
                                current === lead.id ? null : lead.id,
                              )
                            }
                            type="button"
                          >
                            {isExpanded ? (
                              <ChevronUp aria-hidden="true" size={15} />
                            ) : (
                              <ChevronDown aria-hidden="true" size={15} />
                            )}
                          </button>
                          <span className="cursor-grab text-muted">
                            <GripVertical aria-hidden="true" size={16} />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusAccent[draft?.status ?? lead.status]}`}
                        >
                          {statusLabels[draft?.status ?? lead.status]}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${attention.className}`}
                        >
                          {attention.label}
                        </span>
                        <span className="rounded-full border border-[#dde5f0] bg-[#f7f9fc] px-2.5 py-1 text-[11px] font-semibold text-[#5e6b80]">
                          {formatInterestLabel(lead.interest)}
                        </span>
                      </div>

                      <p className="mt-3 text-[0.92rem] leading-6 text-muted">
                        {truncateCopy(lead.summary)}
                      </p>

                      <div className="mt-3 grid gap-2 text-[0.82rem] text-muted">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound aria-hidden="true" size={14} />
                            Responsable
                          </span>
                          <span className="text-right font-semibold text-ink">
                            {(draft?.owner || lead.owner || "Sin asignar").trim() ||
                              "Sin asignar"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock aria-hidden="true" size={14} />
                            Proxima accion
                          </span>
                          <span className="text-right font-semibold text-ink">
                            {formatDateLabel(draft?.nextActionAt ?? lead.nextActionAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Movimiento</span>
                          <span className="text-right font-semibold text-ink">
                            {relatedConversationCount} conv. · {relatedActivityCount} act.
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#10162f] px-3.5 py-2 text-[0.82rem] font-semibold text-white transition hover:-translate-y-0.5"
                          href={`/crm/leads/${lead.id}`}
                        >
                          Abrir ficha
                        </Link>
                        {lead.email ? (
                          <a
                            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-white/75 bg-white/72 px-3 py-2 text-[0.82rem] font-semibold text-ink transition hover:-translate-y-0.5"
                            href={`mailto:${lead.email}`}
                          >
                            <Mail aria-hidden="true" size={13} />
                            Email
                          </a>
                        ) : null}
                        {lead.phone ? (
                          <a
                            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-white/75 bg-white/72 px-3 py-2 text-[0.82rem] font-semibold text-ink transition hover:-translate-y-0.5"
                            href={`tel:${lead.phone}`}
                          >
                            <Phone aria-hidden="true" size={13} />
                            Llamar
                          </a>
                        ) : null}
                        {whatsappLink ? (
                          <a
                            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-white/75 bg-white/72 px-3 py-2 text-[0.82rem] font-semibold text-ink transition hover:-translate-y-0.5"
                            href={whatsappLink}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <MessageSquareMore aria-hidden="true" size={13} />
                            WhatsApp
                          </a>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {adjacentStatuses.previous ? (
                          <button
                            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isSaving}
                            onClick={() =>
                              void moveLeadToStatus(lead.id, adjacentStatuses.previous!)
                            }
                            type="button"
                          >
                            <ArrowLeftRight aria-hidden="true" size={12} />
                            {statusLabels[adjacentStatuses.previous]}
                          </button>
                        ) : null}
                        {adjacentStatuses.next ? (
                          <button
                            className="inline-flex min-h-8 items-center gap-1 rounded-full bg-brand-gradient px-3 py-1.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isSaving}
                            onClick={() =>
                              void moveLeadToStatus(lead.id, adjacentStatuses.next!)
                            }
                            type="button"
                          >
                            <ArrowLeftRight aria-hidden="true" size={12} />
                            {statusLabels[adjacentStatuses.next]}
                          </button>
                        ) : null}
                      </div>

                      {isExpanded ? (
                        <div className="mt-4 grid gap-3 border-t border-white/70 pt-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-1.5 text-xs font-semibold text-ink">
                              Estado
                              <select
                                className="field min-h-10 text-sm"
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [lead.id]: {
                                      ...current[lead.id],
                                      status: event.target.value as ChatbotLeadStatus,
                                    },
                                  }))
                                }
                                value={draft.status}
                              >
                                {crmLeadStatuses.map((option) => (
                                  <option key={option} value={option}>
                                    {statusLabels[option]}
                                  </option>
                                ))}
                              </select>
                            </label>

                            {capabilities.canManageOwner ? (
                              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                                Responsable
                                <select
                                  className="field min-h-10 text-sm"
                                  onChange={(event) =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [lead.id]: {
                                        ...current[lead.id],
                                        owner: event.target.value,
                                      },
                                    }))
                                  }
                                  value={draft.owner}
                                >
                                  {assignableOwnerOptions.map((owner) => (
                                    <option key={owner} value={owner}>
                                      {owner}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : null}
                          </div>

                          <label className="grid gap-1.5 text-xs font-semibold text-ink">
                            Proxima accion
                            <input
                              className="field min-h-10 text-sm"
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [lead.id]: {
                                    ...current[lead.id],
                                    nextActionAt: event.target.value,
                                  },
                                }))
                              }
                              type="datetime-local"
                              value={draft.nextActionAt}
                            />
                          </label>

                          {capabilities.canManageInternalNotes ? (
                            <label className="grid gap-1.5 text-xs font-semibold text-ink">
                              Nota corta
                              <textarea
                                className="field min-h-24 resize-y text-sm"
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [lead.id]: {
                                      ...current[lead.id],
                                      notes: event.target.value,
                                    },
                                  }))
                                }
                                placeholder="Contexto corto para recordar el siguiente paso..."
                                value={draft.notes}
                              />
                            </label>
                          ) : null}

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-gradient px-4 py-2 text-[0.92rem] font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                              disabled={isSaving}
                              onClick={() => void persistLead(lead.id)}
                              type="button"
                            >
                              {isSaving ? "Guardando..." : "Guardar cambios"}
                            </button>
                            {feedback[lead.id] ? (
                              <p className="text-[0.82rem] text-muted">
                                {feedback[lead.id]}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-[0.84rem] leading-6 text-muted">
        Arrastra tarjetas para mover etapa. Usa el pipeline para mirar y ordenar;
        cuando necesites trabajar a fondo, entra en la ficha completa.
      </p>
    </div>
  );
}
