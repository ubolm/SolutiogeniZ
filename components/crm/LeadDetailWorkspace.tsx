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
import { useState } from "react";

import {
  chatbotServices,
  crmLeadStatuses,
  type ChatbotLeadStatus,
} from "@/lib/chatbot";
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
};

type QuickActionDraft = {
  description: string;
  nextActionAt: string;
};

type TaskDraft = {
  title: string;
  type: CrmTask["type"];
  dueAt: string;
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

const interestLabelMap = Object.fromEntries(
  chatbotServices.map((service) => [service.slug, service.title]),
) as Record<string, string>;

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

function formatSourceLabel(value: "web" | "whatsapp" | "manual") {
  if (value === "web") return "Web";
  if (value === "whatsapp") return "WhatsApp";
  return "Manual";
}

function formatIntentLabel(value: string) {
  return value.replaceAll("_", " ");
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
}: {
  lead: CrmLead;
  activities: CrmActivity[];
  conversations: CrmConversation[];
  tasks: CrmTask[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<EditableLead>({
    status: lead.status,
    owner: lead.owner,
    nextActionAt: formatDateInput(lead.nextActionAt),
    notes: lead.notes,
  });
  const [quickAction, setQuickAction] = useState<QuickActionDraft>({
    description: "",
    nextActionAt: formatDateInput(lead.nextActionAt),
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
  const completedTasks = tasks.filter((task) => task.status === "hecha").length;
  const pendingTasks = tasks.length - completedTasks;
  const whatsappLink = buildWhatsAppLink(lead.phone);
  const lastConversation = conversations[0] ?? null;
  const latestActivity = activities[0] ?? null;
  const nextActionLabel = formatDate(draft.nextActionAt);

  async function saveLead() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/crm/leads/${lead.id}`, {
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
      const response = await fetch(`/api/crm/leads/${lead.id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: quickAction.description,
          kind,
          nextActionAt: new Date(quickAction.nextActionAt).toISOString(),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !body?.ok) {
        setMessage(body?.error ?? "No pudimos registrar la accion.");
        return;
      }

      setQuickAction((current) => ({ ...current, description: "" }));
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
        <section className="overflow-hidden rounded-[2rem] border border-[#dfe5fb] bg-[linear-gradient(135deg,#ffffff_0%,#f4f7ff_50%,#ebf1ff_100%)] p-5 shadow-soft md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong">
                Vista comercial
              </p>
              <h2 className="font-heading mt-3 text-2xl font-semibold text-ink md:text-3xl">
                Espacio operativo para avanzar este lead
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Desde aca puedes actualizar estado, registrar avances, crear tareas y revisar el contexto completo del contacto sin volver al pipeline.
              </p>
            </div>
            <div
              className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${statusAccent[draft.status]}`}
            >
              {draft.status.replace("_", " ")}
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
        </section>

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
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

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
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

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold text-ink">
              Gestion del lead
            </h2>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusAccent[draft.status]}`}
            >
              {draft.status.replace("_", " ")}
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-xs font-semibold text-ink">
              Estado
              <select
                className="field min-h-11 text-sm"
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
                    {option.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink">
              Responsable
              <input
                className="field min-h-11 text-sm"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    owner: event.target.value,
                  }))
                }
                placeholder="Sin asignar"
                value={draft.owner}
              />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink">
              Proxima accion
              <input
                className="field min-h-11 text-sm"
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

            <label className="grid gap-1.5 text-xs font-semibold text-ink">
              Notas internas
              <textarea
                className="field min-h-28 resize-y text-sm"
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
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Accion rapida
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Registra un avance comercial rapido sin volver al tablero.
          </p>

          <div className="mt-5 grid gap-4">
            <textarea
              className="field min-h-24 resize-y text-sm"
              onChange={(event) =>
                setQuickAction((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Ej: Hablamos con el cliente, pidio propuesta y quiere retomar el lunes."
              value={quickAction.description}
            />

            <label className="grid gap-1.5 text-xs font-semibold text-ink">
              Proxima accion sugerida
              <input
                className="field min-h-11 text-sm"
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

            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={quickSaving !== null}
                onClick={() => void saveQuickAction("note")}
                type="button"
              >
                {quickSaving === "note" ? "Guardando..." : "Agregar nota"}
              </button>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#10162f] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
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

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Tareas comerciales
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Crea pendientes concretos para este lead y marcarlos cuando ya esten resueltos.
          </p>

          <div className="mt-5 grid gap-4">
            <input
              className="field min-h-11 text-sm"
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
                className="field min-h-11 text-sm"
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
                className="field min-h-11 text-sm"
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
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#10162f] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={taskSaving}
                onClick={() => void createTask()}
                type="button"
              >
                {taskSaving ? "Guardando..." : "Crear tarea"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
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
            <MetricPanel label="Creado" value={formatDate(lead.createdAt)} />
            <MetricPanel label="Actualizado" value={formatDate(lead.updatedAt)} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
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

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Pendientes del lead
          </h2>
          <div className="mt-5 grid gap-3">
            {tasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
                Todavia no hay tareas cargadas para este lead.
              </p>
            ) : (
              tasks.map((task) => (
                <article
                  className="rounded-2xl bg-paper px-4 py-4"
                  key={task.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">
                        {task.type} · {task.status}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        Vence: {formatDate(task.dueAt)}
                      </p>
                    </div>
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
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Conversaciones
          </h2>
          <div className="mt-5 grid gap-3">
            {conversations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
                Aun no hay conversaciones registradas para este lead.
              </p>
            ) : (
              conversations.map((conversation) => (
                <article
                  className="rounded-2xl bg-paper px-4 py-4"
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

        <section className="rounded-[2rem] border border-line bg-white p-5 shadow-soft md:p-6">
          <h2 className="font-heading text-2xl font-semibold text-ink">
            Historial de actividad
          </h2>
          <div className="mt-5 grid gap-3">
            {activities.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
                Aun no hay actividad registrada para este lead.
              </p>
            ) : (
              activities.map((activity) => (
                <article
                  className="rounded-2xl bg-paper px-4 py-4"
                  key={activity.id}
                >
                  <p className="text-sm font-semibold text-ink">
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
    <div className="flex items-start gap-3 rounded-2xl bg-paper px-4 py-4">
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
    <article className="rounded-2xl bg-paper px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
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
