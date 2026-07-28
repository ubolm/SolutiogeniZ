"use client";

import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Circle,
  Mail,
  MessageSquareMore,
  Phone,
  Sparkles,
  Target,
  UserRound,
  Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  chatbotServices,
  crmLeadStatuses,
  type ChatbotLeadStatus,
} from "@/lib/chatbot";
import {
  getCrmRoleCapabilities,
  type CrmRole,
} from "@/lib/crm-auth";
import type {
  CrmActivity,
  CrmConversation,
  CrmLead,
  CrmTask,
} from "@/lib/crm-store";

type EditableLead = {
  status: ChatbotLeadStatus;
  owner: string;
  nextActionAt: string;
  notes: string;
  customerContext: {
    detectedProblems: string;
    capturedMetrics: string;
    verbatimQuotes: string;
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

type QuickActionDraft = {
  description: string;
  nextActionAt: string;
  status: ChatbotLeadStatus | "";
};

type TaskDraft = {
  title: string;
  type: CrmTask["type"];
  dueAt: string;
};

type TimelineEntry = {
  id: string;
  occurredAt: string;
  title: string;
  description: string;
  badge: string;
  tone: string;
};

type FunnelStage = {
  key: ChatbotLeadStatus;
  label: string;
  shortLabel: string;
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

const interestLabelMap = Object.fromEntries(
  chatbotServices.map((service) => [service.slug, service.title]),
) as Record<string, string>;

const funnelStages: FunnelStage[] = [
  { key: "contactado", label: "Contactado", shortLabel: "Contacto" },
  { key: "respondio", label: "Respondio", shortLabel: "Respuesta" },
  {
    key: "reunion_agendada",
    label: "Reunion agendada",
    shortLabel: "Reunion",
  },
  {
    key: "propuesta_enviada",
    label: "Propuesta enviada",
    shortLabel: "Propuesta",
  },
  { key: "negociacion", label: "Negociacion", shortLabel: "Negociacion" },
  { key: "cliente", label: "Cliente", shortLabel: "Cliente" },
  { key: "perdido", label: "Perdido", shortLabel: "Perdido" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatInterestLabel(value: string) {
  return interestLabelMap[value] ?? value.replaceAll("-", " ");
}

function formatStatusLabel(value: ChatbotLeadStatus) {
  const match = funnelStages.find((stage) => stage.key === value);
  return match?.label ?? value.replaceAll("_", " ");
}

function formatSourceLabel(value: "web" | "whatsapp" | "manual") {
  if (value === "web") return "Web";
  if (value === "whatsapp") return "WhatsApp";
  return "Manual";
}

function formatIntentLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatTaskTypeLabel(value: CrmTask["type"]) {
  if (value === "llamada") return "Llamada";
  if (value === "reunion") return "Reunion";
  if (value === "propuesta") return "Propuesta";
  if (value === "seguimiento") return "Seguimiento";
  return "Otro";
}

function describeNextAction(dateValue: string) {
  const currentDate = new Date(dateValue);
  const now = new Date();
  const diffInMs = currentDate.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / 86_400_000);

  if (diffInDays < 0) {
    return "Atrasada, conviene retomarla hoy.";
  }

  if (diffInDays === 0) {
    return "Programada para hoy.";
  }

  if (diffInDays === 1) {
    return "Programada para manana.";
  }

  return `Programada para dentro de ${diffInDays} dias.`;
}

function buildActivityEntry(activity: CrmActivity): TimelineEntry {
  const activityToneMap: Record<CrmActivity["type"], string> = {
    lead_created: "border-[#d9e6ff] bg-[#f5f8ff] text-[#2f5bea]",
    conversation_captured: "border-[#d9e6ff] bg-[#f5f8ff] text-[#2f5bea]",
    web_message_received: "border-[#daf2e4] bg-[#f1fbf5] text-[#16794e]",
    web_message_sent: "border-[#e9ddff] bg-[#f8f2ff] text-[#6d3cc7]",
    lead_updated: "border-[#efe2ff] bg-[#f9f4ff] text-[#6d3cc7]",
    whatsapp_message_received: "border-[#daf2e4] bg-[#f1fbf5] text-[#16794e]",
    whatsapp_message_sent: "border-[#e9ddff] bg-[#f8f2ff] text-[#6d3cc7]",
  };

  const activityBadgeMap: Record<CrmActivity["type"], string> = {
    lead_created: "Alta",
    conversation_captured: "Conversacion",
    web_message_received: "Web",
    web_message_sent: "Web",
    lead_updated: "Ficha",
    whatsapp_message_received: "WhatsApp",
    whatsapp_message_sent: "WhatsApp",
  };

  return {
    id: `activity-${activity.id}`,
    occurredAt: activity.createdAt,
    title: activity.description,
    description: "Movimiento registrado dentro del CRM.",
    badge: activityBadgeMap[activity.type],
    tone: activityToneMap[activity.type],
  };
}

function buildConversationEntry(conversation: CrmConversation): TimelineEntry {
  return {
    id: `conversation-${conversation.id}`,
    occurredAt: conversation.lastMessageAt,
    title: `${formatSourceLabel(conversation.channel)} · ${formatIntentLabel(
      conversation.detectedIntent,
    )}`,
    description: conversation.transcriptSummary,
    badge: "Mensaje",
    tone: "border-[#d9e6ff] bg-[#f5f8ff] text-[#2f5bea]",
  };
}

function buildTaskEntries(task: CrmTask) {
  const entries: TimelineEntry[] = [
    {
      id: `task-created-${task.id}`,
      occurredAt: task.createdAt,
      title: `${formatTaskTypeLabel(task.type)} creada`,
      description: `${task.title}. Vence ${formatDate(task.dueAt)}.`,
      badge: "Tarea",
      tone: "border-[#fff0d6] bg-[#fff8eb] text-[#b56a06]",
    },
  ];

  if (task.completedAt) {
    entries.push({
      id: `task-done-${task.id}`,
      occurredAt: task.completedAt,
      title: `${formatTaskTypeLabel(task.type)} completada`,
      description: task.title,
      badge: "Resuelto",
      tone: "border-[#daf2e4] bg-[#f1fbf5] text-[#16794e]",
    });
  }

  return entries;
}

function buildWhatsAppLink(phone: string) {
  const normalized = phone.replace(/[^\d]/g, "");

  if (!normalized) {
    return null;
  }

  return `https://wa.me/${normalized}`;
}

export function LeadDetailWorkspace({
  lead,
  activities,
  conversations,
  tasks,
  ownerOptions,
  role,
}: {
  lead: CrmLead;
  activities: CrmActivity[];
  conversations: CrmConversation[];
  tasks: CrmTask[];
  ownerOptions: string[];
  role: CrmRole;
}) {
  const router = useRouter();
  const capabilities = getCrmRoleCapabilities(role);
  const [draft, setDraft] = useState<EditableLead>({
    status: lead.status,
    owner: lead.owner,
    nextActionAt: formatDateInput(lead.nextActionAt),
    notes: lead.notes,
    customerContext: lead.customerContext,
    extendedProfile: lead.extendedProfile,
  });
  const [quickAction, setQuickAction] = useState<QuickActionDraft>({
    description: "",
    nextActionAt: formatDateInput(lead.nextActionAt),
    status: "",
  });
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({
    title: "",
    type: "seguimiento",
    dueAt: formatDateInput(lead.nextActionAt),
  });
  const [saving, setSaving] = useState(false);
  const [quickSaving, setQuickSaving] = useState<"note" | "contact" | null>(
    null,
  );
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskUpdatingId, setTaskUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const assignableOwnerOptions = useMemo(
    () =>
      Array.from(new Set(["Sin asignar", ...ownerOptions, lead.owner || "Sin asignar"]))
        .filter(Boolean)
        .sort((a, b) => {
          if (a === "Sin asignar") return -1;
          if (b === "Sin asignar") return 1;
          return a.localeCompare(b);
        }),
    [lead.owner, ownerOptions],
  );
  const completedTasks = tasks.filter((task) => task.status === "hecha").length;
  const pendingTasks = tasks.length - completedTasks;
  const whatsappLink = buildWhatsAppLink(lead.phone);
  const lastConversation = conversations[0] ?? null;
  const latestActivity = activities[0] ?? null;
  const nextActionLabel = formatDate(draft.nextActionAt);
  const nextActionDescription = describeNextAction(draft.nextActionAt);
  const currentStageIndex = funnelStages.findIndex(
    (stage) => stage.key === draft.status,
  );
  const timelineEntries = useMemo(
    () =>
      [
        ...activities.map(buildActivityEntry),
        ...conversations.map(buildConversationEntry),
        ...tasks.flatMap(buildTaskEntries),
      ].sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      ),
    [activities, conversations, tasks],
  );
  const extendedProfileHighlights = [
    {
      label: "Rubro",
      value: draft.extendedProfile.sector || "Sin definir",
    },
    {
      label: "Localidad",
      value: draft.extendedProfile.locality || "Sin definir",
    },
    {
      label: "Canal publico",
      value: draft.extendedProfile.publicChannel || "Sin definir",
    },
  ];
  const commercialFlowChips = [
    draft.extendedProfile.route,
    draft.extendedProfile.stage2,
    draft.extendedProfile.stage3,
  ].filter((item) => item.trim().length > 0);

  async function saveLead() {
    setSaving(true);
    setMessage("");

    try {
      const payload: {
        status?: ChatbotLeadStatus;
        nextActionAt?: string;
        owner?: string;
        notes?: string;
        customerContext?: EditableLead["customerContext"];
        extendedProfile?: EditableLead["extendedProfile"];
      } = {};

      if (capabilities.canEditLeadStatus) {
        payload.status = draft.status;
      }

      if (capabilities.canScheduleLeadNextAction) {
        payload.nextActionAt = new Date(draft.nextActionAt).toISOString();
      }

      if (capabilities.canManageOwner) {
        payload.owner = draft.owner;
      }

      if (capabilities.canManageInternalNotes) {
        payload.notes = draft.notes;
      }

      payload.customerContext = draft.customerContext;
      payload.extendedProfile = draft.extendedProfile;

      const response = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setMessage(body?.error ?? "No pudimos guardar los cambios.");
        return;
      }

      setMessage("Ficha actualizada.");
      router.refresh();
    } catch {
      setMessage("No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function saveQuickAction(kind: "note" | "contact") {
    setQuickSaving(kind);
    setMessage("");

    try {
      const payload: {
        description: string;
        kind: "note" | "contact";
        nextActionAt?: string;
        status?: ChatbotLeadStatus;
      } = {
        description: quickAction.description,
        kind,
      };

      if (capabilities.canScheduleLeadNextAction) {
        payload.nextActionAt = new Date(quickAction.nextActionAt).toISOString();
      }

      if (capabilities.canEditLeadStatus && quickAction.status) {
        payload.status = quickAction.status;
      }

      const response = await fetch(`/api/crm/leads/${lead.id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setMessage(body?.error ?? "No pudimos registrar la accion.");
        return;
      }

      setQuickAction((current) => ({ ...current, description: "", status: "" }));
      setMessage(
        kind === "contact"
          ? "Contacto registrado en el historial."
          : "Nota agregada al historial.",
      );
      router.refresh();
    } catch {
      setMessage("No pudimos registrar la accion.");
    } finally {
      setQuickSaving(null);
    }
  }

  async function createTask() {
    setTaskSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/crm/leads/${lead.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskDraft.title,
          type: taskDraft.type,
          dueAt: new Date(taskDraft.dueAt).toISOString(),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setMessage(body?.error ?? "No pudimos crear la tarea.");
        return;
      }

      setTaskDraft((current) => ({ ...current, title: "" }));
      setMessage("Tarea creada.");
      router.refresh();
    } catch {
      setMessage("No pudimos crear la tarea.");
    } finally {
      setTaskSaving(false);
    }
  }

  async function toggleTask(task: CrmTask) {
    setTaskUpdatingId(task.id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/crm/leads/${lead.id}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: task.status === "hecha" ? "pendiente" : "hecha",
          }),
        },
      );

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setMessage(body?.error ?? "No pudimos actualizar la tarea.");
        return;
      }

      setMessage(
        task.status === "hecha"
          ? "Tarea reabierta."
          : "Tarea marcada como hecha.",
      );
      router.refresh();
    } catch {
      setMessage("No pudimos actualizar la tarea.");
    } finally {
      setTaskUpdatingId(null);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="grid gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.74)_0%,rgba(244,247,255,0.7)_50%,rgba(235,241,255,0.68)_100%)] p-6 shadow-soft backdrop-blur-[12px] md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong">
                Vista comercial
              </p>
              <h2 className="font-heading mt-3 text-[2rem] font-semibold text-ink md:text-[2.5rem]">
                Espacio operativo para avanzar este lead
              </h2>
              <p className="mt-3 text-[1rem] leading-7 text-muted">
                {role === "admin"
                  ? "Desde aca puedes actualizar estado, registrar avances, crear tareas y revisar el contexto completo del contacto sin volver al pipeline."
                  : "Desde aca puedes avanzar el estado comercial, registrar seguimientos y dejar tareas para mover la oportunidad sin salir del lead."}
              </p>
            </div>
            <div
              className={`inline-flex rounded-full border px-4 py-2 text-[0.92rem] font-semibold backdrop-blur-[8px] ${statusAccent[draft.status]}`}
            >
              {formatStatusLabel(draft.status)}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricPanel label="Proxima accion" value={nextActionLabel} />
            <MetricPanel label="Tareas pendientes" value={pendingTasks.toString()} />
            <MetricPanel label="Conversaciones" value={conversations.length.toString()} />
            <MetricPanel
              label="Ultimo movimiento"
              value={
                latestActivity ? formatDate(latestActivity.createdAt) : "Sin actividad"
              }
            />
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-white/70 bg-white/52 p-4 backdrop-blur-[8px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
                  Embudo comercial
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Ubicacion actual del lead y etapas siguientes del proceso.
                </p>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusAccent[draft.status]}`}
              >
                {formatStatusLabel(draft.status)}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
              {funnelStages.map((stage, index) => {
                const isCurrent = index === currentStageIndex;
                const isDone =
                  currentStageIndex >= 0 &&
                  index < currentStageIndex &&
                  draft.status !== "perdido";
                const isLost = draft.status === "perdido" && stage.key === "perdido";

                return (
                  <article
                    className={`rounded-[1.25rem] border px-3 py-3 transition ${
                      isCurrent
                        ? "border-[#cfd8ff] bg-[#eef3ff] shadow-[0_16px_40px_rgba(80,108,255,0.12)]"
                        : isDone
                          ? "border-[#daf2e4] bg-[#f1fbf5]"
                          : isLost
                            ? "border-[#f1b9b9] bg-[#fff2f2]"
                            : "border-white/70 bg-white/52"
                    }`}
                    key={stage.key}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {stage.shortLabel}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {stage.label}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {isCurrent
                        ? "Etapa actual"
                        : isDone
                          ? "Completada"
                          : isLost
                            ? "Cierre perdido"
                            : "Pendiente"}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Informacion general
          </h2>
          <div className="mt-5 grid gap-3">
            <InfoRow
              icon={<Building2 aria-hidden="true" size={16} />}
              label="Empresa"
              value={lead.company}
            />
            <InfoRow
              icon={<UserRound aria-hidden="true" size={16} />}
              label="Contacto"
              value={lead.name}
            />
            <InfoRow
              icon={<Mail aria-hidden="true" size={16} />}
              label="Email"
              value={lead.email || "No informado"}
            />
            <InfoRow
              icon={<Phone aria-hidden="true" size={16} />}
              label="Telefono"
              value={lead.phone || "No informado"}
            />
            <InfoRow
              icon={<MessageSquareMore aria-hidden="true" size={16} />}
              label="Interes"
              value={formatInterestLabel(lead.interest)}
            />
            <InfoRow
              icon={<Workflow aria-hidden="true" size={16} />}
              label="Canal"
              value={formatSourceLabel(lead.source)}
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-ink">
                Acciones de contacto
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Accesos rapidos para continuar la conversacion desde el canal mas conveniente.
              </p>
            </div>
            <div className="rounded-full border border-[#dce4ff] bg-[#f7f9ff] px-3 py-1 text-xs font-semibold text-primary-strong">
              {formatSourceLabel(lead.source)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <ActionCard
              description={lead.email || "No hay email cargado todavia."}
              disabled={!lead.email}
              href={lead.email ? `mailto:${lead.email}` : undefined}
              icon={<Mail aria-hidden="true" size={18} />}
              label="Enviar email"
            />
            <ActionCard
              description={lead.phone || "No hay telefono cargado todavia."}
              disabled={!lead.phone}
              href={lead.phone ? `tel:${lead.phone}` : undefined}
              icon={<Phone aria-hidden="true" size={18} />}
              label="Llamar ahora"
            />
            <ActionCard
              description={
                whatsappLink
                  ? "Abrir conversacion directa en WhatsApp."
                  : "Necesitamos un telefono valido para abrir WhatsApp."
              }
              disabled={!whatsappLink}
              href={whatsappLink ?? undefined}
              icon={<MessageSquareMore aria-hidden="true" size={18} />}
              label="Abrir WhatsApp"
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold text-ink">
              Gestion del lead
            </h2>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusAccent[draft.status]}`}
            >
              {formatStatusLabel(draft.status)}
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {capabilities.canEditLeadStatus ? (
              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Estado
                <select
                  className="field min-h-11 text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as ChatbotLeadStatus,
                    }))
                  }
                  value={draft.status}
                >
                  {crmLeadStatuses.map((option) => (
                    <option key={option} value={option}>
                      {formatStatusLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <ReadOnlyField
                label="Estado"
                value={formatStatusLabel(draft.status)}
              />
            )}

            {capabilities.canManageOwner ? (
              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Responsable
                <select
                  className="field min-h-11 text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      owner: event.target.value,
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
            ) : (
              <ReadOnlyField
                label="Responsable"
                value={draft.owner || "Sin asignar"}
              />
            )}

            {capabilities.canScheduleLeadNextAction ? (
              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Proxima accion
                <input
                  className="field min-h-11 text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      nextActionAt: event.target.value,
                    }))
                  }
                  type="datetime-local"
                  value={draft.nextActionAt}
                />
              </label>
            ) : (
              <ReadOnlyField
                label="Proxima accion"
                value={nextActionLabel}
              />
            )}

            {capabilities.canManageInternalNotes ? (
              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Notas internas
                <textarea
                  className="field min-h-28 resize-y text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Contexto comercial, objeciones, proximos pasos..."
                  value={draft.notes}
                />
              </label>
            ) : null}

            <div className="grid gap-4 rounded-[1.4rem] border border-white/70 bg-white/48 p-4 backdrop-blur-[8px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Contexto del cliente
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Registra problemas, metricas, frases textuales, sistemas y objeciones para no perder contexto comercial.
                </p>
              </div>

              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Problemas detectados
                <textarea
                  className="field min-h-20 resize-y text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      customerContext: {
                        ...current.customerContext,
                        detectedProblems: event.target.value,
                      },
                    }))
                  }
                  placeholder="Que esta fallando hoy en el proceso del cliente."
                  value={draft.customerContext.detectedProblems}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Metricas capturadas
                <textarea
                  className="field min-h-20 resize-y text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      customerContext: {
                        ...current.customerContext,
                        capturedMetrics: event.target.value,
                      },
                    }))
                  }
                  placeholder="Tiempos, volumen, consultas, conversion o cualquier dato relevante."
                  value={draft.customerContext.capturedMetrics}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Frases textuales
                <textarea
                  className="field min-h-20 resize-y text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      customerContext: {
                        ...current.customerContext,
                        verbatimQuotes: event.target.value,
                      },
                    }))
                  }
                  placeholder="Ej: 'Se nos enfrian los contactos' o 'Respondemos tarde por WhatsApp'."
                  value={draft.customerContext.verbatimQuotes}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Sistemas diagnosticados
                <textarea
                  className="field min-h-20 resize-y text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      customerContext: {
                        ...current.customerContext,
                        diagnosedSystems: event.target.value,
                      },
                    }))
                  }
                  placeholder="WhatsApp, Instagram, planillas, CRM, formularios, ERP u otras herramientas."
                  value={draft.customerContext.diagnosedSystems}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Objeciones
                <textarea
                  className="field min-h-20 resize-y text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      customerContext: {
                        ...current.customerContext,
                        objections: event.target.value,
                      },
                    }))
                  }
                  placeholder="Dudas sobre precio, tiempos, alcance, equipo interno o prioridad."
                  value={draft.customerContext.objections}
                />
              </label>
            </div>

            <div className="grid gap-4 rounded-[1.4rem] border border-white/70 bg-white/48 p-4 backdrop-blur-[8px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Perfil extendido
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Datos ampliados del cliente para trabajar mejor la oportunidad sin cargar de más el pipeline.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                    {extendedProfileHighlights.map((item) => (
                      <InsightCard
                        icon={<Building2 aria-hidden="true" size={16} />}
                        key={item.label}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                  </div>

                  <div className="rounded-[1.6rem] border border-[#eef1f7] bg-[#fafbfe] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Oportunidad detectada
                    </p>
                    <p className="mt-3 text-sm leading-6 text-ink">
                      {draft.extendedProfile.opportunityDetected ||
                        "Todavia no se registro una oportunidad puntual para este lead."}
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-[#eef1f7] bg-[#fafbfe] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Flujo sugerido
                    </p>
                    {commercialFlowChips.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {commercialFlowChips.map((item) => (
                          <span
                            className="inline-flex items-center rounded-full border border-[#d9e1ff] bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-primary-strong"
                            key={item}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-muted">
                        Aun no se definieron ruta ni etapas complementarias para esta cuenta.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReadOnlyField
                      label="Oferta inicial"
                      value={
                        draft.extendedProfile.initialOffer || "Sin propuesta inicial cargada"
                      }
                    />
                    <ReadOnlyField
                      label="Demo recomendada"
                      value={
                        draft.extendedProfile.recommendedDemo || "Sin demo sugerida"
                      }
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <ActionCard
                      description={
                        draft.extendedProfile.profileUrl
                          ? "Abrir el perfil o sitio de referencia para revisar presencia publica."
                          : "Todavia no hay un perfil o sitio cargado para este lead."
                      }
                      disabled={!draft.extendedProfile.profileUrl}
                      href={draft.extendedProfile.profileUrl || undefined}
                      icon={<ArrowUpRight aria-hidden="true" size={16} />}
                      label="Perfil o sitio"
                    />
                    <ActionCard
                      description={
                        draft.extendedProfile.address
                          ? draft.extendedProfile.address
                          : "Todavia no se cargo direccion para esta cuenta."
                      }
                      disabled={!draft.extendedProfile.address}
                      icon={<Target aria-hidden="true" size={16} />}
                      label="Direccion"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Logo o perfil URL
                  <input
                    className="field min-h-11 text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          profileUrl: event.target.value,
                        },
                      }))
                    }
                    placeholder="https://..."
                    value={draft.extendedProfile.profileUrl}
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Rubro
                  <input
                    className="field min-h-11 text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          sector: event.target.value,
                        },
                      }))
                    }
                    placeholder="Ej: salud, gastronomia, servicios"
                    value={draft.extendedProfile.sector}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Localidad
                  <input
                    className="field min-h-11 text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          locality: event.target.value,
                        },
                      }))
                    }
                    value={draft.extendedProfile.locality}
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Direccion
                  <input
                    className="field min-h-11 text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          address: event.target.value,
                        },
                      }))
                    }
                    value={draft.extendedProfile.address}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Ruta
                  <input
                    className="field min-h-11 text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          route: event.target.value,
                        },
                      }))
                    }
                    placeholder="Ruta comercial o recorrido"
                    value={draft.extendedProfile.route}
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Canal o modalidad publica
                  <input
                    className="field min-h-11 text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          publicChannel: event.target.value,
                        },
                      }))
                    }
                    placeholder="Local, online, mixto, franquicia..."
                    value={draft.extendedProfile.publicChannel}
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-xs font-semibold text-ink">
                Oportunidad detectada
                <textarea
                  className="field min-h-20 resize-y text-[0.95rem]"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      extendedProfile: {
                        ...current.extendedProfile,
                        opportunityDetected: event.target.value,
                      },
                    }))
                  }
                  value={draft.extendedProfile.opportunityDetected}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Oferta inicial
                  <textarea
                    className="field min-h-20 resize-y text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          initialOffer: event.target.value,
                        },
                      }))
                    }
                    value={draft.extendedProfile.initialOffer}
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Demo recomendada
                  <textarea
                    className="field min-h-20 resize-y text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          recommendedDemo: event.target.value,
                        },
                      }))
                    }
                    value={draft.extendedProfile.recommendedDemo}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Etapa 2
                  <input
                    className="field min-h-11 text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          stage2: event.target.value,
                        },
                      }))
                    }
                    value={draft.extendedProfile.stage2}
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-ink">
                  Etapa 3
                  <input
                    className="field min-h-11 text-[0.95rem]"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        extendedProfile: {
                          ...current.extendedProfile,
                          stage3: event.target.value,
                        },
                      }))
                    }
                    value={draft.extendedProfile.stage3}
                  />
                </label>
              </div>
            </div>

            {(capabilities.canEditLeadStatus ||
              capabilities.canScheduleLeadNextAction ||
              capabilities.canManageOwner ||
              capabilities.canManageInternalNotes) ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={saving}
                  onClick={() => void saveLead()}
                  type="button"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                {message ? <p className="text-sm text-muted">{message}</p> : null}
              </div>
            ) : null}
          </div>
        </section>

        {capabilities.canCreateLeadActivity ? (
          <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
            <h2 className="font-heading text-2xl font-semibold text-ink">
              Accion rapida
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Registra un avance comercial rapido sin volver al tablero.
            </p>

            <div className="mt-5 grid gap-4">
              <textarea
                className="field min-h-24 resize-y text-[0.95rem]"
                onChange={(event) =>
                  setQuickAction((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Ej: Hablamos con el cliente, pidio propuesta y quiere retomar el lunes."
                value={quickAction.description}
              />

              {capabilities.canScheduleLeadNextAction ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-ink">
                    Proxima accion sugerida
                    <input
                      className="field min-h-11 text-[0.95rem]"
                      onChange={(event) =>
                        setQuickAction((current) => ({
                          ...current,
                          nextActionAt: event.target.value,
                        }))
                      }
                      type="datetime-local"
                      value={quickAction.nextActionAt}
                    />
                  </label>

                  {capabilities.canEditLeadStatus ? (
                    <label className="grid gap-1.5 text-xs font-semibold text-ink">
                      Etapa sugerida
                      <select
                        className="field min-h-11 text-[0.95rem]"
                        onChange={(event) =>
                          setQuickAction((current) => ({
                            ...current,
                            status: event.target.value as ChatbotLeadStatus | "",
                          }))
                        }
                        value={quickAction.status}
                      >
                        <option value="">Sin cambiar etapa</option>
                        {crmLeadStatuses.map((option) => (
                          <option key={option} value={option}>
                            {formatStatusLabel(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/70 bg-white/64 px-4 py-2 text-[0.92rem] font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={quickSaving !== null}
                  onClick={() => void saveQuickAction("note")}
                  type="button"
                >
                  {quickSaving === "note" ? "Guardando..." : "Agregar nota"}
                </button>
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#10162f] px-4 py-2 text-[0.92rem] font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={quickSaving !== null}
                  onClick={() => void saveQuickAction("contact")}
                  type="button"
                >
                  {quickSaving === "contact"
                    ? "Guardando..."
                    : "Registrar contacto"}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {capabilities.canCreateLeadTasks ? (
          <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
            <h2 className="font-heading text-2xl font-semibold text-ink">
              Tareas comerciales
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Crea pendientes concretos para este lead y marcarlos cuando ya esten resueltos.
            </p>

            <div className="mt-5 grid gap-4">
              <input
                className="field min-h-11 text-[0.95rem]"
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Ej: Llamar para validar propuesta"
                value={taskDraft.title}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  className="field min-h-11 text-[0.95rem]"
                  onChange={(event) =>
                    setTaskDraft((current) => ({
                      ...current,
                      type: event.target.value as CrmTask["type"],
                    }))
                  }
                  value={taskDraft.type}
                >
                  <option value="llamada">Llamada</option>
                  <option value="reunion">Reunion</option>
                  <option value="propuesta">Propuesta</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="otro">Otro</option>
                </select>

                <input
                  className="field min-h-11 text-[0.95rem]"
                  onChange={(event) =>
                    setTaskDraft((current) => ({
                      ...current,
                      dueAt: event.target.value,
                    }))
                  }
                  type="datetime-local"
                  value={taskDraft.dueAt}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#10162f] px-4 py-2 text-[0.92rem] font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={taskSaving}
                  onClick={() => void createTask()}
                  type="button"
                >
                  {taskSaving ? "Guardando..." : "Crear tarea"}
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Seguimiento comercial
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricPanel label="Responsable" value={draft.owner || "Sin asignar"} />
            <MetricPanel label="Prioridad" value={lead.priority} />
            <MetricPanel label="Ultimo contacto" value={formatDate(lead.lastContactAt)} />
            <MetricPanel label="Proxima accion" value={nextActionLabel} />
            <MetricPanel label="Tareas pendientes" value={pendingTasks.toString()} />
            <MetricPanel label="Tareas resueltas" value={completedTasks.toString()} />
            {capabilities.canViewAuditTrail ? (
              <MetricPanel label="Creado" value={formatDate(lead.createdAt)} />
            ) : null}
            {capabilities.canViewAuditTrail ? (
              <MetricPanel
                label="Actualizado"
                value={formatDate(lead.updatedAt)}
              />
            ) : null}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-[#d9e6ff] bg-[linear-gradient(135deg,rgba(248,250,255,0.96)_0%,rgba(239,244,255,0.92)_100%)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
                  Proximo paso comprometido
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {nextActionLabel}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {nextActionDescription}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/80 bg-white/72 px-4 py-3 text-sm text-ink shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Responsable
                </p>
                <p className="mt-1 font-semibold">{draft.owner || "Sin asignar"}</p>
              </div>
            </div>
          </div>
        </section>

        {capabilities.canViewExecutiveSummary ? (
          <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-primary-strong">
                <Target aria-hidden="true" size={18} />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-semibold text-ink">
                  Resumen ejecutivo
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Una lectura rapida para saber donde esta parado este lead.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <InsightCard
                icon={<Sparkles aria-hidden="true" size={16} />}
                label="Interes principal"
                value={formatInterestLabel(lead.interest)}
              />
              <InsightCard
                icon={<CalendarClock aria-hidden="true" size={16} />}
                label="Siguiente paso"
                value={`Seguimiento previsto para ${nextActionLabel}.`}
              />
              <InsightCard
                icon={<Workflow aria-hidden="true" size={16} />}
                label="Canal preferente"
                value={`El lead ingreso por ${formatSourceLabel(lead.source)} y ya tiene ${conversations.length} conversacion(es) registradas.`}
              />
              <InsightCard
                icon={<MessageSquareMore aria-hidden="true" size={16} />}
                label="Ultimo contexto"
                value={
                  lastConversation?.transcriptSummary ||
                  "Todavia no hay una conversacion registrada para resumir."
                }
              />
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-ink">
                Linea de seguimiento
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Una lectura cronologica de mensajes, avances y tareas para entender rapido en que punto esta la oportunidad.
              </p>
            </div>
            <span className="rounded-full border border-[#dce4ff] bg-[#f7f9ff] px-3 py-1 text-xs font-semibold text-primary-strong">
              {timelineEntries.length} movimiento(s)
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {timelineEntries.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/70 bg-white/45 px-4 py-5 text-sm text-muted backdrop-blur-[8px]">
                Aun no hay seguimiento registrado para este lead.
              </p>
            ) : (
              timelineEntries.map((entry) => (
                <article
                  className="rounded-[1.35rem] border border-white/70 bg-white/56 px-4 py-4 backdrop-blur-[8px]"
                  key={entry.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${entry.tone}`}
                        >
                          {entry.badge}
                        </span>
                        <p className="text-xs text-muted">
                          {formatDate(entry.occurredAt)}
                        </p>
                      </div>
                      <p className="mt-3 text-[1rem] font-semibold text-ink">
                        {entry.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {entry.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Pendientes del lead
          </h2>
          <div className="mt-5 grid gap-3">
            {tasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/70 bg-white/45 px-4 py-5 text-sm text-muted backdrop-blur-[8px]">
                Todavia no hay tareas cargadas para este lead.
              </p>
            ) : (
              tasks.map((task) => (
                <article
                  className="rounded-[1.3rem] border border-white/70 bg-white/56 px-4 py-4 backdrop-blur-[8px]"
                  key={task.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.98rem] font-semibold text-ink">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">
                        {task.type} · {task.status}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        Vence: {formatDate(task.dueAt)}
                      </p>
                    </div>
                    {capabilities.canUpdateLeadTasks ? (
                      <button
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={taskUpdatingId === task.id}
                        onClick={() => void toggleTask(task)}
                        type="button"
                      >
                        {task.status === "hecha" ? (
                          <CheckCircle2 aria-hidden="true" size={14} />
                        ) : (
                          <Circle aria-hidden="true" size={14} />
                        )}
                        {taskUpdatingId === task.id
                          ? "Guardando..."
                          : task.status === "hecha"
                            ? "Reabrir"
                            : "Marcar hecha"}
                      </button>
                    ) : (
                      <span className="inline-flex min-h-9 items-center rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-xs font-semibold text-muted">
                        {task.status === "hecha" ? "Hecha" : "Pendiente"}
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Conversaciones
          </h2>
          <div className="mt-5 grid gap-3">
            {conversations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/70 bg-white/45 px-4 py-5 text-sm text-muted backdrop-blur-[8px]">
                Aun no hay conversaciones registradas para este lead.
              </p>
            ) : (
              conversations.map((conversation) => (
                <article
                  className="rounded-[1.3rem] border border-white/70 bg-white/56 px-4 py-4 backdrop-blur-[8px]"
                  key={conversation.id}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
                    {formatSourceLabel(conversation.channel)} ·{" "}
                    {formatIntentLabel(conversation.detectedIntent)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink">
                    {conversation.transcriptSummary}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Inicio: {formatDate(conversation.startedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Ultimo mensaje: {formatDate(conversation.lastMessageAt)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(249,251,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Historial de actividad
          </h2>
          <div className="mt-5 grid gap-3">
            {activities.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/70 bg-white/45 px-4 py-5 text-sm text-muted backdrop-blur-[8px]">
                Aun no hay actividad registrada para este lead.
              </p>
            ) : (
              activities.map((activity) => (
                <article
                  className="rounded-[1.3rem] border border-white/70 bg-white/56 px-4 py-4 backdrop-blur-[8px]"
                  key={activity.id}
                >
                  <p className="text-[0.98rem] font-semibold text-ink">
                    {activity.description}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDate(activity.createdAt)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1.3rem] border border-white/70 bg-white/56 px-4 py-4 backdrop-blur-[8px]">
      <div className="mt-0.5 text-primary-strong">{icon}</div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </p>
        <p className="mt-1 text-sm text-ink">{value}</p>
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1.5 text-xs font-semibold text-ink">
      <p>{label}</p>
      <div className="field flex min-h-11 items-center bg-white/52 text-[0.95rem] text-muted">
        {value}
      </div>
    </div>
  );
}

function ActionCard({
  label,
  description,
  href,
  icon,
  disabled = false,
}: {
  label: string;
  description: string;
  href?: string;
  icon: ReactNode;
  disabled?: boolean;
}) {
  const className = `group rounded-[1.6rem] border px-4 py-4 transition ${
    disabled
      ? "cursor-not-allowed border-[#edf0f7] bg-[#f8f9fc] text-muted"
      : "border-line bg-[#fbfcff] text-ink hover:-translate-y-0.5 hover:border-[#d4ddff]"
  }`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2ff] text-primary-strong">
          {icon}
        </div>
        {!disabled ? (
          <ArrowUpRight
            aria-hidden="true"
            className="text-[#7b88ab] transition group-hover:text-primary-strong"
            size={16}
          />
        ) : null}
      </div>
      <p className="mt-4 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm leading-6">{description}</p>
    </>
  );

  if (disabled || !href) {
    return <article className={className}>{content}</article>;
  }

  return (
    <a
      className={className}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  );
}

function MetricPanel({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.3rem] border border-white/70 bg-white/56 px-4 py-4 backdrop-blur-[8px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-[0.98rem] font-semibold text-ink">{value}</p>
    </article>
  );
}

function InsightCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[#eef1f7] bg-[#fafbfe] px-4 py-4">
      <div className="flex items-center gap-2 text-primary-strong">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink">{value}</p>
    </article>
  );
}
