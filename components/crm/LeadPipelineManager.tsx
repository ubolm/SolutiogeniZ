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
import { useMemo, useState } from "react";

import {
  crmLeadSources,
  crmLeadStatuses,
  type ChatbotLeadStatus,
} from "@/lib/chatbot";
import { chatbotServices } from "@/lib/chatbot";
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
};

const statusLabels: Record<ChatbotLeadStatus, string> = {
  nuevo: "Nuevos",
  contactado: "Contactados",
  calificado: "Calificados",
  propuesta: "Propuesta",
  seguimiento: "Seguimiento",
  cerrado_ganado: "Ganados",
  cerrado_perdido: "Perdidos",
};

const statusAccent: Record<ChatbotLeadStatus, string> = {
  nuevo: "bg-[#eef4ff] text-[#2f5bea] border-[#c9d8ff]",
  contactado: "bg-[#effaf4] text-[#16794e] border-[#bde7cc]",
  calificado: "bg-[#fff7e9] text-[#b56a06] border-[#f3d39a]",
  propuesta: "bg-[#f6efff] text-[#6d3cc7] border-[#d5c0f7]",
  seguimiento: "bg-[#fff0f0] text-[#c54646] border-[#f1b9b9]",
  cerrado_ganado: "bg-[#ebfbf2] text-[#0b7a43] border-[#b7e7ca]",
  cerrado_perdido: "bg-[#f2f4f7] text-[#5b6472] border-[#d8dde5]",
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

function formatSourceLabel(value: CrmLead["source"]) {
  if (value === "web") return "Web";
  if (value === "whatsapp") return "WhatsApp";
  return "Manual";
}

function getDaysUntil(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  return Math.round(diff / 86_400_000);
}

function getLeadTemperature(status: ChatbotLeadStatus, timelineCount: number) {
  if (status === "cerrado_ganado") return "Ganado";
  if (status === "cerrado_perdido") return "Perdido";
  if (status === "propuesta" || status === "seguimiento") return "Caliente";
  if (status === "calificado" || timelineCount >= 3) return "Activo";
  return "Nuevo";
}

function getNextStepSuggestion(
  status: ChatbotLeadStatus,
  daysUntilAction: number,
  hasConversation: boolean,
) {
  if (status === "nuevo") {
    return hasConversation
      ? "Hacer primer contacto humano y confirmar necesidad."
      : "Abrir conversacion inicial y entender el problema principal.";
  }

  if (status === "contactado") {
    return "Profundizar el caso y validar prioridad, urgencia y objetivo.";
  }

  if (status === "calificado") {
    return "Preparar propuesta o siguiente paso concreto con fecha definida.";
  }

  if (status === "propuesta") {
    return daysUntilAction < 0
      ? "Retomar hoy la propuesta porque la accion ya esta vencida."
      : "Dar seguimiento a la propuesta y detectar objeciones.";
  }

  if (status === "seguimiento") {
    return "Mover la oportunidad con una accion puntual: llamada, demo o cierre.";
  }

  if (status === "cerrado_ganado") {
    return "Registrar proximo onboarding o entrega inicial.";
  }

  return "Documentar motivo de perdida y detectar aprendizaje comercial.";
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
}: {
  leads: CrmLead[];
  activities: CrmActivity[];
  conversations: CrmConversation[];
}) {
  const router = useRouter();
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
    leads[0]?.id ?? null,
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
        },
      ]),
    ),
  );
  const [quickActionSavingId, setQuickActionSavingId] = useState<string | null>(
    null,
  );

  const ownerOptions = useMemo(
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
        ownerFilter === "todos" || owner === ownerFilter;

      return matchesQuery && matchesSource && matchesInterest && matchesOwner;
    });
  }, [drafts, interestFilter, leads, ownerFilter, query, sourceFilter]);

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
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          owner: draft.owner,
          nextActionAt: new Date(draft.nextActionAt).toISOString(),
          notes: draft.notes,
        }),
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
      <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-6 text-sm text-muted">
        Todavia no hay leads guardados. Cuando alguien deje sus datos desde el
        chatbot, van a aparecer aca.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[1.6rem] border border-line bg-[#f8f9fc] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Filter aria-hidden="true" size={16} />
          Buscar y filtrar leads
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.9fr_0.9fr_1fr]">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Buscar</span>
            <div className="field flex min-h-11 items-center gap-2 px-3 py-0">
              <Search aria-hidden="true" className="text-muted" size={16} />
              <input
                className="w-full bg-transparent text-sm text-ink outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, empresa, resumen, email..."
                value={query}
              />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Canal</span>
            <select
              className="field min-h-11 text-sm"
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

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted">Responsable</span>
            <select
              className="field min-h-11 text-sm"
              onChange={(event) => setOwnerFilter(event.target.value)}
              value={ownerFilter}
            >
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner === "todos" ? "Todos los responsables" : owner}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-muted">
          Mostrando {filteredLeads.length} de {leads.length} leads.
        </p>
      </section>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {crmLeadStatuses.map((status) => {
          const columnLeads = leadsByStatus[status];
          const isDropTarget = dropTargetStatus === status;

          return (
            <section
              className={`flex min-h-[34rem] w-[20rem] shrink-0 flex-col rounded-[1.8rem] border bg-[#f8f9fc] p-4 transition ${
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
                  <p className="text-sm font-semibold text-ink">
                    {statusLabels[status]}
                  </p>
                  <p className="text-xs text-muted">
                    {columnLeads.length} lead
                    {columnLeads.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusAccent[status]}`}
                >
                  {columnLeads.length}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {columnLeads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-white px-4 py-6 text-sm text-muted">
                    {filteredLeads.length === 0
                      ? "No hay leads que coincidan con los filtros."
                      : "Solta un lead aca para moverlo a esta etapa."}
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const draft = drafts[lead.id];
                    const isExpanded = expandedId === lead.id;
                    const isDragging = draggedLeadId === lead.id;
                    const timelineItems = leadTimeline[lead.id] ?? [];
                    const relatedConversationCount = conversations.filter(
                      (conversation) => conversation.leadId === lead.id,
                    ).length;
                    const relatedActivityCount = activities.filter(
                      (activity) => activity.leadId === lead.id,
                    ).length;
                    const daysUntilAction = getDaysUntil(draft.nextActionAt);
                    const leadTemperature = getLeadTemperature(
                      draft.status,
                      timelineItems.length,
                    );
                    const nextStepSuggestion = getNextStepSuggestion(
                      draft.status,
                      daysUntilAction,
                      relatedConversationCount > 0,
                    );
                    const quickDraft = quickActionDrafts[lead.id] ?? {
                      description: "",
                      nextActionAt: draft.nextActionAt,
                    };
                    const whatsappLink = buildWhatsAppLink(lead.phone);
                    const adjacentStatuses = getAdjacentStatuses(draft.status);

                    return (
                      <article
                        className={`rounded-[1.5rem] border border-white bg-white p-4 shadow-[0_1px_0_rgba(11,11,15,0.03)] transition ${
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
                              <div className="min-w-0">
                                <p className="font-semibold text-ink">
                                  {lead.company}
                                </p>
                                <p className="text-sm text-muted">{lead.name}</p>
                                <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
                                  {lead.summary}
                                </p>
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
                              <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-muted">
                                <UserRound aria-hidden="true" size={12} />
                                {draft.owner || "Sin asignar"}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-muted">
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
                          <div className="mt-4 grid gap-3 border-t border-line pt-4">
                            <div className="text-xs leading-5 text-muted">
                              <p>{lead.email}</p>
                              {lead.phone ? <p>{lead.phone}</p> : null}
                              <p className="mt-2">
                                Interes: {formatInterestLabel(lead.interest)}
                              </p>
                              <p>Origen: {formatSourceLabel(lead.source)}</p>
                            </div>

                            <section className="grid gap-3 rounded-[1.5rem] border border-line bg-[#f8f9fc] p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                    Ficha comercial
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-ink">
                                    Estado del lead: {leadTemperature}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusAccent[draft.status]}`}
                                >
                                  {draft.status.replace("_", " ")}
                                </span>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded-2xl bg-white px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                                    Conversaciones
                                  </p>
                                  <p className="mt-1 text-lg font-semibold text-ink">
                                    {relatedConversationCount}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-white px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                                    Actividades
                                  </p>
                                  <p className="mt-1 text-lg font-semibold text-ink">
                                    {relatedActivityCount}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-white px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                                    Ultimo contacto
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-ink">
                                    {formatDateLabel(lead.lastContactAt)}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-white px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                                    Proxima accion
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-ink">
                                    {daysUntilAction < 0
                                      ? "Vencida"
                                      : daysUntilAction === 0
                                        ? "Hoy"
                                        : `${daysUntilAction} dias`}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-2xl bg-white px-3 py-3">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                                  Recomendacion
                                </p>
                                <p className="mt-1 text-sm leading-6 text-ink">
                                  {nextStepSuggestion}
                                </p>
                              </div>
                            </section>

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

                            <label className="grid gap-1.5 text-xs font-semibold text-ink">
                              Responsable
                              <input
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
                                placeholder="Sin asignar"
                                value={draft.owner}
                              />
                            </label>

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

                            <label className="grid gap-1.5 text-xs font-semibold text-ink">
                              Notas
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
                                placeholder="Contexto comercial, proximos pasos, objeciones..."
                                value={draft.notes}
                              />
                            </label>

                            <div className="grid gap-3 rounded-[1.4rem] border border-line bg-[#f8f9fc] p-3">
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
                                className="field min-h-20 resize-y text-sm"
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

                              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                                Proxima accion sugerida
                                <input
                                  className="field min-h-10 text-sm"
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

                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
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
                                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#10162f] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
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

                            <div className="grid gap-2">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                  Historial del lead
                                </p>
                                <span className="text-[11px] text-muted">
                                  {timelineItems.length} eventos
                                </span>
                              </div>

                              {timelineItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-line bg-paper px-3 py-4 text-xs text-muted">
                                  Aun no hay historial para este lead.
                                </div>
                              ) : (
                                <div className="grid gap-2">
                                  {timelineItems.map((item) => (
                                    <article
                                      className="rounded-2xl border border-line bg-paper px-3 py-3"
                                      key={item.id}
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold text-ink">
                                          {item.title}
                                        </p>
                                        <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
                                          {item.kind === "conversation"
                                            ? "Conversacion"
                                            : "Actividad"}
                                        </span>
                                      </div>
                                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted">
                                        {item.detail}
                                      </p>
                                      <p className="mt-2 text-[11px] text-muted">
                                        {formatDateLabel(item.date)}
                                      </p>
                                    </article>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={savingId === lead.id}
                                onClick={() => void saveLead(lead.id)}
                                type="button"
                              >
                                {savingId === lead.id
                                  ? "Guardando..."
                                  : "Guardar"}
                              </button>
                              {feedback[lead.id] ? (
                                <p className="text-xs text-muted">
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
      <p className="text-xs leading-5 text-muted">
        Arrastra una tarjeta a otra columna para cambiar su etapa. Tambien podes
        abrirla para editar responsable, proxima accion y notas.
      </p>
    </div>
  );
}
