"use client";

import {
  ArrowLeftRight,
  ChevronRight,
  Clock3,
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
import {
  getCrmRoleCapabilities,
  type CrmRole,
} from "@/lib/crm-auth";
import type { CrmActivity, CrmConversation, CrmLead } from "@/lib/crm-store";

type EditableLead = {
  id: string;
  status: ChatbotLeadStatus;
  owner: string;
  nextActionAt: string;
  notes: string;
};

type QuickActionDraft = {
  description: string;
  nextActionAt: string;
  status: ChatbotLeadStatus | "";
};

const statusLabels: Record<ChatbotLeadStatus, string> = {
  contactado: "Contactados",
  respondio: "Respondieron",
  reunion_agendada: "Reunion agendada",
  propuesta_enviada: "Propuesta enviada",
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
  { value: "sin-definir", label: "Todavía no definido" },
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

function formatIntentLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatChannelLabel(value: string) {
  return value === "web_chatbot" ? "Web chatbot" : value;
}

function formatInterestLabel(value: string) {
  return interestLabelMap[value] ?? value.replaceAll("-", " ");
}

function truncateCopy(value: string, maxLength = 72) {
  const cleanValue = value.trim();

  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, maxLength - 1).trim()}…`;
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
      label: "Alta hoy",
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
  const [expandedId, setExpandedId] = useState<string | null>(
    null,
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] =
    useState<ChatbotLeadStatus | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("todos");
  const [interestFilter, setInterestFilter] = useState("todos");
  const [ownerFilter, setOwnerFilter] = useState("todos");
  const [quickActionDrafts, setQuickActionDrafts] = useState<
    Record<string, QuickActionDraft>
  >(
    Object.fromEntries(
      leads.map((lead) => [
        lead.id,
        {
          description: "",
          nextActionAt: formatDateInput(lead.nextActionAt),
          status: "",
        },
      ]),
    ),
  );
  const [quickActionSavingId, setQuickActionSavingId] = useState<string | null>(
    null,
  );

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

    setQuickActionDrafts((current) => {
      const nextEntries = leads
        .filter((lead) => !current[lead.id])
        .map((lead) => [
          lead.id,
        {
          description: "",
          nextActionAt: formatDateInput(lead.nextActionAt),
          status: "",
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
          ["Sin asignar", ...ownerOptions, ...leads.map((lead) => lead.owner || "Sin asignar")].filter(
            Boolean,
          ),
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
          capabilities.canManageOwner ? owner : "",
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
  }, [capabilities.canManageOwner, drafts, interestFilter, leads, ownerFilter, query, sourceFilter]);

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

  const leadTimeline = useMemo(
    () =>
      Object.fromEntries(
        leads.map((lead) => {
          const items = [
            ...activities
              .filter((activity) => activity.leadId === lead.id)
              .map((activity) => ({
                id: activity.id,
                date: activity.createdAt,
                kind: "activity" as const,
                title: activity.description,
                detail: "Actividad registrada en el CRM.",
              })),
            ...conversations
              .filter((conversation) => conversation.leadId === lead.id)
              .map((conversation) => ({
                id: conversation.id,
                date: conversation.lastMessageAt,
                kind: "conversation" as const,
                title: `Conversacion por ${formatChannelLabel(conversation.channel)}`,
                detail: `${formatIntentLabel(conversation.detectedIntent)}. ${conversation.transcriptSummary}`,
              })),
          ]
            .sort(
              (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .slice(0, 6);

          return [lead.id, items];
        }),
      ) as Record<
        string,
        Array<{
          id: string;
          date: string;
          kind: "activity" | "conversation";
          title: string;
          detail: string;
        }>
      >,
    [activities, conversations, leads],
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

  async function saveLead(id: string) {
    await persistLead(id);
  }

  async function saveQuickAction(leadId: string, kind: "note" | "contact") {
    const draft = quickActionDrafts[leadId];

    if (!draft) return;

    setQuickActionSavingId(leadId);
    setFeedback((current) => ({ ...current, [leadId]: "" }));

    try {
      const response = await fetch(`/api/crm/leads/${leadId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: draft.description,
          kind,
          nextActionAt: new Date(draft.nextActionAt).toISOString(),
          status: capabilities.canEditLeadStatus && draft.status ? draft.status : undefined,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setFeedback((current) => ({
          ...current,
          [leadId]: body?.error ?? "No pudimos registrar la accion.",
        }));
        return;
      }

      setQuickActionDrafts((current) => ({
        ...current,
        [leadId]: {
          ...current[leadId],
          description: "",
          status: "",
        },
      }));
      setFeedback((current) => ({
        ...current,
        [leadId]:
          kind === "contact"
            ? "Contacto registrado en el historial."
            : "Nota agregada al historial.",
      }));
      router.refresh();
    } catch {
      setFeedback((current) => ({
        ...current,
        [leadId]: "No pudimos registrar la accion.",
      }));
    } finally {
      setQuickActionSavingId(null);
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
    <div className="grid gap-6">
      <section className="rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(246,249,255,0.62)_100%)] p-4 shadow-soft backdrop-blur-[12px]">
        <div className="flex items-center gap-2 text-[0.98rem] font-semibold text-ink">
          <Filter aria-hidden="true" size={16} />
          Filtros
        </div>

        <div
          className={`mt-3 grid gap-2.5 ${
            capabilities.canManageOwner
              ? "lg:grid-cols-[1.2fr_0.85fr_0.85fr_1fr]"
              : "lg:grid-cols-[1.2fr_0.9fr_0.9fr]"
          }`}
        >
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Buscar</span>
            <div className="field flex min-h-11 items-center gap-2 px-3 py-0">
              <Search aria-hidden="true" className="text-muted" size={16} />
              <input
                className="w-full bg-transparent text-[0.95rem] text-ink outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, empresa, resumen, email..."
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
            <span className="text-xs font-semibold text-muted">Interés</span>
            <select
              className="field min-h-11 text-sm"
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

        <p className="mt-3 text-[0.84rem] text-muted">
          Mostrando {filteredLeads.length} de {leads.length} leads.
        </p>
      </section>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {crmLeadStatuses.map((status) => {
          const columnLeads = leadsByStatus[status];
          const isDropTarget = dropTargetStatus === status;

          return (
            <section
              className={`flex min-h-[25rem] w-[18.5rem] shrink-0 flex-col rounded-[1.65rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.56)_0%,rgba(244,247,255,0.66)_100%)] p-4 shadow-soft backdrop-blur-[10px] transition ${
                isDropTarget
                  ? "border-primary-strong shadow-[0_0_0_3px_rgba(68,84,245,0.12)]"
                  : "border-line"
              }`}
              key={status}
              onDragEnter={(event) => {
                event.preventDefault();
                setDropTargetStatus(status);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (event.dataTransfer) {
                  event.dataTransfer.dropEffect = "move";
                }
                setDropTargetStatus(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDropTargetStatus((current) =>
                    current === status ? null : current,
                  );
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const leadId = event.dataTransfer.getData("text/plain");
                setDropTargetStatus(null);
                setDraggedLeadId(null);
                if (leadId) {
                  void moveLeadToStatus(leadId, status);
                }
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.98rem] font-semibold text-ink">
                    {statusLabels[status]}
                  </p>
                  <p className="text-[0.82rem] text-muted">
                    {columnLeads.length} lead
                    {columnLeads.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[0.78rem] font-semibold backdrop-blur-[8px] ${statusAccent[status]}`}
                >
                  {columnLeads.length}
                </span>
              </div>

              <div className="mt-3 grid gap-2.5">
                {columnLeads.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-white/70 bg-white/54 px-4 py-5 text-[0.95rem] text-muted backdrop-blur-[8px]">
                    {filteredLeads.length === 0
                      ? "No hay leads que coincidan con los filtros."
                      : "Solta un lead aca para moverlo a esta etapa."}
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const draft = drafts[lead.id];
                    const quickDraft = quickActionDrafts[lead.id] ?? {
                      description: "",
                      nextActionAt: formatDateInput(lead.nextActionAt),
                    };

                    if (!draft) {
                      return null;
                    }

                    const isExpanded = expandedId === lead.id;
                    const isDragging = draggedLeadId === lead.id;
                    const relatedConversationCount = conversations.filter(
                      (conversation) => conversation.leadId === lead.id,
                    ).length;
                      const relatedActivityCount = activities.filter(
                        (activity) => activity.leadId === lead.id,
                      ).length;
                      const daysUntilAction = getDaysUntil(draft.nextActionAt);
                      const attentionPriority = getAttentionPriority(daysUntilAction);
                      const whatsappLink = buildWhatsAppLink(lead.phone);
                      const adjacentStatuses = getAdjacentStatuses(draft.status);
                      const quickProfileItems = [
                        lead.extendedProfile.sector
                          ? {
                              label: "Rubro",
                              value: lead.extendedProfile.sector,
                            }
                          : null,
                        lead.extendedProfile.locality
                          ? {
                              label: "Localidad",
                              value: lead.extendedProfile.locality,
                            }
                          : null,
                        lead.extendedProfile.publicChannel
                          ? {
                              label: "Canal",
                              value: lead.extendedProfile.publicChannel,
                            }
                          : null,
                        lead.extendedProfile.opportunityDetected
                          ? {
                              label: "Oportunidad",
                              value: truncateCopy(
                                lead.extendedProfile.opportunityDetected,
                                64,
                              ),
                            }
                          : null,
                      ].filter(
                        (
                          item,
                        ): item is {
                          label: string;
                          value: string;
                        } => item !== null,
                      );

                      return (
                        <article
                        className={`rounded-[1.35rem] border border-white/80 bg-white/66 p-4 shadow-[0_14px_28px_rgba(15,19,36,0.06)] backdrop-blur-[10px] transition ${
                          isDragging ? "opacity-50" : ""
                        }`}
                        draggable
                        key={lead.id}
                        onDragEnd={() => {
                          setDraggedLeadId(null);
                          setDropTargetStatus(null);
                        }}
                        onDragStart={(event) => {
                          setDraggedLeadId(lead.id);
                          event.dataTransfer.setData("text/plain", lead.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 cursor-grab text-muted">
                            <GripVertical aria-hidden="true" size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              className="flex w-full items-start justify-between gap-3 text-left"
                              onClick={() =>
                                setExpandedId((current) =>
                                  current === lead.id ? null : lead.id,
                                )
                              }
                              type="button"
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#4454f5,#7a7cff)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(68,84,245,0.24)]">
                                  {getLeadInitials(lead)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[1rem] font-semibold text-ink">
                                    {lead.company}
                                  </p>
                                  <p className="text-[0.95rem] text-muted">{lead.name}</p>
                                  <p className="mt-2 line-clamp-2 text-[0.82rem] leading-6 text-muted">
                                    {lead.summary}
                                  </p>
                                </div>
                              </div>
                                <ChevronRight
                                aria-hidden="true"
                                className={`mt-1 shrink-0 text-muted transition ${
                                  isExpanded ? "rotate-90" : ""
                                }`}
                                size={18}
                              />
                            </button>

                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#d9e1ff] bg-[#eef2ff] px-2.5 py-1 text-[#4454f5] backdrop-blur-[8px]">
                                  {formatInterestLabel(lead.interest)}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/56 px-2.5 py-1 text-muted backdrop-blur-[8px]">
                                  {formatSourceLabel(lead.source)}
                                </span>
                                {capabilities.canManageOwner ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white/56 px-2.5 py-1 text-muted backdrop-blur-[8px]">
                                    <UserRound aria-hidden="true" size={12} />
                                    {draft.owner || "Sin asignar"}
                                  </span>
                                ) : null}
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${attentionPriority.className}`}
                                >
                                  {attentionPriority.label}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/56 px-2.5 py-1 text-muted backdrop-blur-[8px]">
                                  <Clock3 aria-hidden="true" size={12} />
                                  {formatDateLabel(draft.nextActionAt)}
                                </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${
                                  daysUntilAction < 0
                                    ? "border-[#ffd1d1] bg-[#fff3f3] text-[#c54646]"
                                    : daysUntilAction === 0
                                      ? "border-[#ffe1b0] bg-[#fff8ea] text-[#b56a06]"
                                      : "border-[#d9e1ff] bg-[#f4f7ff] text-[#4454f5]"
                                }`}
                              >
                                  {daysUntilAction < 0
                                    ? "Accion vencida"
                                    : daysUntilAction === 0
                                      ? "Accion hoy"
                                      : `En ${daysUntilAction} dias`}
                                </span>
                              </div>

                              {quickProfileItems.length > 0 ? (
                                <div className="mt-3 grid gap-2 rounded-[1.05rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.58)_0%,rgba(243,246,255,0.72)_100%)] p-3 backdrop-blur-[10px]">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                                    Vista rapida
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {lead.extendedProfile.sector ? (
                                      <span className="inline-flex items-center rounded-full border border-[#d7defd] bg-[#eef2ff] px-2.5 py-1 text-[11px] font-semibold text-[#4454f5]">
                                        {lead.extendedProfile.sector}
                                      </span>
                                    ) : null}
                                    {lead.extendedProfile.locality ? (
                                      <span className="inline-flex items-center rounded-full border border-[#dce7f5] bg-[#f7fbff] px-2.5 py-1 text-[11px] font-semibold text-[#58708f]">
                                        {lead.extendedProfile.locality}
                                      </span>
                                    ) : null}
                                    {lead.extendedProfile.profileUrl ? (
                                      <a
                                        className="inline-flex items-center rounded-full border border-[#d9e1ff] bg-white px-2.5 py-1 text-[11px] font-semibold text-primary-strong transition hover:-translate-y-0.5"
                                        href={lead.extendedProfile.profileUrl}
                                        rel="noreferrer"
                                        target="_blank"
                                      >
                                        Ver perfil
                                      </a>
                                    ) : null}
                                  </div>
                                  <div className="grid gap-2">
                                    {quickProfileItems.map((item) => (
                                      <div
                                        className="flex items-start justify-between gap-3 text-[0.78rem]"
                                        key={`${lead.id}-${item.label}`}
                                      >
                                        <span className="shrink-0 font-semibold text-ink/70">
                                          {item.label}
                                        </span>
                                        <span className="text-right leading-5 text-ink">
                                          {item.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              <div className="mt-3 grid gap-2">
                                <div className="flex flex-wrap gap-2">
                                  <Link
                                  className="inline-flex items-center text-xs font-semibold text-primary-strong transition hover:opacity-80"
                                  href={`/crm/leads/${lead.id}`}
                                >
                                  Abrir ficha completa
                                </Link>
                                {lead.email ? (
                                  <a
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-ink"
                                    href={`mailto:${lead.email}`}
                                  >
                                    <Mail aria-hidden="true" size={12} />
                                    Email
                                  </a>
                                ) : null}
                                {lead.phone ? (
                                  <a
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-ink"
                                    href={`tel:${lead.phone}`}
                                  >
                                    <Phone aria-hidden="true" size={12} />
                                    Llamar
                                  </a>
                                ) : null}
                                {whatsappLink ? (
                                  <a
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-ink"
                                    href={whatsappLink}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    <MessageSquareMore aria-hidden="true" size={12} />
                                    WhatsApp
                                  </a>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {adjacentStatuses.previous ? (
                                  <button
                                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={savingId === lead.id}
                                    onClick={() =>
                                      void moveLeadToStatus(
                                        lead.id,
                                        adjacentStatuses.previous!,
                                      )
                                    }
                                    type="button"
                                  >
                                    <ArrowLeftRight aria-hidden="true" size={12} />
                                    Mover a {statusLabels[adjacentStatuses.previous].toLowerCase()}
                                  </button>
                                ) : null}
                                {adjacentStatuses.next ? (
                                  <button
                                    className="inline-flex min-h-8 items-center gap-1 rounded-full bg-[#10162f] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={savingId === lead.id}
                                    onClick={() =>
                                      void moveLeadToStatus(
                                        lead.id,
                                        adjacentStatuses.next!,
                                      )
                                    }
                                    type="button"
                                  >
                                    <ArrowLeftRight aria-hidden="true" size={12} />
                                    Mover a {statusLabels[adjacentStatuses.next].toLowerCase()}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="mt-3 grid gap-2.5 border-t border-white/70 pt-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <MiniMetric
                                label="Conversaciones"
                                value={relatedConversationCount.toString()}
                              />
                              <MiniMetric
                                label="Actividades"
                                value={relatedActivityCount.toString()}
                              />
                              <MiniMetric
                                label="Ultimo contacto"
                                value={formatDateLabel(lead.lastContactAt)}
                              />
                              <MiniMetric
                                label="Interes"
                                value={formatInterestLabel(lead.interest)}
                              />
                            </div>

                            <div className="text-xs leading-5 text-muted">
                              {lead.email ? <p>{lead.email}</p> : null}
                              {lead.phone ? <p>{lead.phone}</p> : null}
                            </div>

                            <label className="grid gap-1.5 text-xs font-semibold text-ink">
                              Estado
                              <select
                                className="field min-h-10 text-sm"
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [lead.id]: {
                                      ...current[lead.id],
                                      status:
                                        event.target.value as ChatbotLeadStatus,
                                    },
                                  }))
                                }
                                value={draft.status}
                              >
                                {crmLeadStatuses.map((option) => (
                                  <option key={option} value={option}>
                                    {option.replace("_", " ")}
                                  </option>
                                ))}
                              </select>
                            </label>

                            {capabilities.canManageOwner ? (
                              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                                Responsable
                                <select
                                  className="field min-h-10 text-[0.95rem]"
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

                            <label className="grid gap-1.5 text-xs font-semibold text-ink">
                              Proxima accion
                              <input
                                className="field min-h-10 text-[0.95rem]"
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
                                Notas
                                <textarea
                                  className="field min-h-24 resize-y text-[0.95rem]"
                                  onChange={(event) =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [lead.id]: {
                                        ...current[lead.id],
                                        notes: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Contexto comercial, proximos pasos, objeciones..."
                                  value={draft.notes}
                                />
                              </label>
                            ) : null}

                            <div className="grid gap-3 rounded-[1.45rem] border border-white/70 bg-white/48 p-3.5 backdrop-blur-[10px]">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                  Accion rapida
                                </p>
                                <p className="mt-1 text-xs leading-5 text-muted">
                                  Registra una nota o un contacto comercial sin
                                  salir del lead.
                                </p>
                              </div>

                              <textarea
                                className="field min-h-20 resize-y text-[0.95rem]"
                                onChange={(event) =>
                                  setQuickActionDrafts((current) => ({
                                    ...current,
                                    [lead.id]: {
                                      ...quickDraft,
                                      description: event.target.value,
                                    },
                                  }))
                                }
                                placeholder="Ej: Llamamos, pidio propuesta para automatizar seguimiento comercial."
                                value={quickDraft.description}
                              />

                              <div className="grid gap-3 md:grid-cols-2">
                                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                                  Proxima accion sugerida
                                  <input
                                    className="field min-h-10 text-[0.95rem]"
                                    onChange={(event) =>
                                      setQuickActionDrafts((current) => ({
                                        ...current,
                                        [lead.id]: {
                                          ...quickDraft,
                                          nextActionAt: event.target.value,
                                        },
                                      }))
                                    }
                                    type="datetime-local"
                                    value={quickDraft.nextActionAt}
                                  />
                                </label>

                                {capabilities.canEditLeadStatus ? (
                                  <label className="grid gap-1.5 text-xs font-semibold text-ink">
                                    Etapa sugerida
                                    <select
                                      className="field min-h-10 text-[0.95rem]"
                                      onChange={(event) =>
                                        setQuickActionDrafts((current) => ({
                                          ...current,
                                          [lead.id]: {
                                            ...quickDraft,
                                            status:
                                              event.target.value as ChatbotLeadStatus | "",
                                          },
                                        }))
                                      }
                                      value={quickDraft.status}
                                    >
                                      <option value="">Sin cambiar etapa</option>
                                      {crmLeadStatuses.map((option) => (
                                        <option key={option} value={option}>
                                          {statusLabels[option]}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/70 bg-white/64 px-4 py-2 text-[0.92rem] font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                                  disabled={quickActionSavingId === lead.id}
                                  onClick={() =>
                                    void saveQuickAction(lead.id, "note")
                                  }
                                  type="button"
                                >
                                  {quickActionSavingId === lead.id
                                    ? "Guardando..."
                                    : "Agregar nota"}
                                </button>
                                <button
                                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#10162f] px-4 py-2 text-[0.92rem] font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                                  disabled={quickActionSavingId === lead.id}
                                  onClick={() =>
                                    void saveQuickAction(lead.id, "contact")
                                  }
                                  type="button"
                                >
                                  {quickActionSavingId === lead.id
                                    ? "Guardando..."
                                    : "Registrar contacto"}
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-gradient px-4 py-2 text-[0.92rem] font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={savingId === lead.id}
                                onClick={() => void saveLead(lead.id)}
                                type="button"
                              >
                                {savingId === lead.id
                                  ? "Guardando..."
                                  : "Guardar"}
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
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-[0.84rem] leading-6 text-muted">
        {capabilities.canManageOwner
          ? "Arrastra una tarjeta para mover etapa. Abre solo las que vas a trabajar."
          : "Arrastra una tarjeta para mover etapa y abre solo la oportunidad que vas a seguir."}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.1rem] border border-white/70 bg-white/52 px-3 py-3 backdrop-blur-[8px]">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1.5 text-[0.95rem] font-semibold text-ink">{value}</p>
    </div>
  );
}
