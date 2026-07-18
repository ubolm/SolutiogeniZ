import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  KanbanSquare,
  MessageSquareMore,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { CrmSurfaceCard } from "@/components/crm/CrmSurfaceCard";
import { TaskInboxBoard } from "@/components/crm/TaskInboxBoard";
import { getCrmSnapshot } from "@/lib/crm-store";

type AlertTone = "danger" | "warning" | "positive" | "neutral";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDaysDifferenceFromToday(value: string) {
  const now = new Date();
  const target = new Date(value);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000,
  );
}

export default async function CrmDashboardPage() {
  const snapshot = await getCrmSnapshot();
  const latestActivities = snapshot.activities.slice(0, 5);
  const latestConversations = snapshot.conversations.slice(0, 4);
  const pendingTasks = snapshot.tasks.filter((task) => task.status === "pendiente");
  const overdueTasks = pendingTasks.filter(
    (task) => new Date(task.dueAt).getTime() < Date.now(),
  );
  const todayTasks = pendingTasks.filter(
    (task) => getDaysDifferenceFromToday(task.dueAt) === 0,
  );
  const proposalLeads = snapshot.leads.filter((lead) => lead.status === "propuesta");
  const followupLeads = snapshot.leads.filter(
    (lead) => lead.status === "seguimiento",
  );
  const wonLeads = snapshot.leads.filter(
    (lead) => lead.status === "cerrado_ganado",
  );
  const unattendedLeads = snapshot.leads.filter(
    (lead) => lead.status === "nuevo" || lead.status === "contactado",
  );

  const urgentLeads = [...snapshot.leads]
    .sort(
      (a, b) =>
        new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime(),
    )
    .slice(0, 4);

  const focusItems = [
    {
      label: "Retomar propuestas",
      value: proposalLeads.length.toString(),
      description:
        proposalLeads.length > 0
          ? "Hay oportunidades en propuesta para empujar hacia cierre."
          : "No hay propuestas activas en este momento.",
      href: "/crm/leads",
      icon: <TrendingUp aria-hidden="true" size={18} />,
      tone: "blue" as const,
    },
    {
      label: "Resolver atrasos",
      value: overdueTasks.length.toString(),
      description:
        overdueTasks.length > 0
          ? "Conviene limpiar tareas vencidas para no perder seguimiento."
          : "No hay tareas atrasadas, buen ritmo operativo.",
      href: "/crm/tareas",
      icon: <AlertTriangle aria-hidden="true" size={18} />,
      tone: "red" as const,
    },
    {
      label: "Mover seguimiento",
      value: followupLeads.length.toString(),
      description:
        followupLeads.length > 0
          ? "Leads en seguimiento que necesitan una accion concreta."
          : "No hay leads trabados en seguimiento ahora.",
      href: "/crm/mi-trabajo",
      icon: <Target aria-hidden="true" size={18} />,
      tone: "amber" as const,
    },
  ];

  const alertItems: Array<{
    label: string;
    value: number;
    description: string;
    href: string;
    tone: AlertTone;
  }> = [
    {
      label: "Tareas vencidas",
      value: overdueTasks.length,
      description:
        overdueTasks.length > 0
          ? "Prioridad alta para hoy."
          : "Sin atrasos operativos.",
      href: "/crm/tareas",
      tone: overdueTasks.length > 0 ? "danger" : "positive",
    },
    {
      label: "Pendientes para hoy",
      value: todayTasks.length,
      description: "Seguimientos que conviene ejecutar hoy mismo.",
      href: "/crm/tareas",
      tone: todayTasks.length > 0 ? "warning" : "neutral",
    },
    {
      label: "Leads sin cerrar",
      value: unattendedLeads.length,
      description: "Nuevos o contactados que todavia no avanzaron.",
      href: "/crm/leads",
      tone: unattendedLeads.length > 0 ? "warning" : "neutral",
    },
  ];

  return (
    <div className="grid gap-8">
      <CrmPageIntro
        description="Una vista ejecutiva para entrar al CRM y detectar rapido donde conviene actuar primero: oportunidades, tareas criticas y conversaciones que necesitan continuidad."
        eyebrow="Dashboard CRM"
        stats={[
          {
            label: "Leads activos",
            value: snapshot.leads.length.toString(),
          },
          {
            label: "Ganados",
            value: wonLeads.length.toString(),
          },
          {
            label: "Conversaciones",
            value: snapshot.conversations.length.toString(),
          },
          {
            label: "Tareas pendientes",
            value: pendingTasks.length.toString(),
          },
        ]}
        title="Centro operativo de SolutiogeniZ"
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-[2rem] border border-[#dfe5fb] bg-[linear-gradient(135deg,#10162f_0%,#1e2753_45%,#4454f5_100%)] p-6 text-white shadow-[0_30px_90px_rgba(16,22,47,0.24)] md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/66">
                Foco del dia
              </p>
              <h2 className="font-heading mt-3 text-3xl font-semibold">
                Prioridades comerciales para entrar en accion
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/80">
                Hoy conviene revisar propuestas abiertas, limpiar atrasos y mover los seguimientos con una accion concreta.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                Ritmo operativo
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold">
                {pendingTasks.length}
              </p>
              <p className="mt-1 text-sm text-white/74">pendientes abiertos</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {focusItems.map((item) => (
              <FocusCard
                description={item.description}
                href={item.href}
                icon={item.icon}
                key={item.label}
                label={item.label}
                tone={item.tone}
                value={item.value}
              />
            ))}
          </div>
        </section>

        <CrmSurfaceCard
          description="Lectura corta de lo que mas necesita atencion en este momento."
          title="Alertas y salud"
        >
          <div className="mt-5 grid gap-3">
            {alertItems.map((item) => (
              <AlertRow
                description={item.description}
                href={item.href}
                key={item.label}
                label={item.label}
                tone={item.tone}
                value={item.value}
              />
            ))}
          </div>
        </CrmSurfaceCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <ModuleCard
          cta="Abrir leads"
          description="Pipeline comercial, movimiento por etapas y fichas individuales."
          href="/crm/leads"
          icon={<KanbanSquare aria-hidden="true" size={18} />}
          title="Leads"
        />
        <ModuleCard
          cta="Abrir tareas"
          description="Bandeja operativa con atrasos, hoy y proximos seguimientos."
          href="/crm/tareas"
          icon={<CalendarClock aria-hidden="true" size={18} />}
          title="Tareas"
        />
        <ModuleCard
          cta="Abrir conversaciones"
          description="Contexto reciente por web y WhatsApp para responder mejor."
          href="/crm/conversaciones"
          icon={<MessageSquareMore aria-hidden="true" size={18} />}
          title="Conversaciones"
        />
        <ModuleCard
          cta="Abrir mi trabajo"
          description="Vista por responsable para concentrarte en lo que te toca seguir."
          href="/crm/mi-trabajo"
          icon={<UserRound aria-hidden="true" size={18} />}
          title="Mi trabajo"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <CrmSurfaceCard
          description="Leads que piden una accion cercana o ya vencida."
          title="Prioridades inmediatas"
        >
          <div className="mt-5 grid gap-3">
            {urgentLeads.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
                Todavia no hay leads con proxima accion definida.
              </p>
            ) : (
              urgentLeads.map((lead) => {
                const days = getDaysDifferenceFromToday(lead.nextActionAt);

                return (
                  <article
                    className="rounded-[1.6rem] border border-[#e8ecf6] bg-[linear-gradient(180deg,#fbfcff_0%,#f6f8fc_100%)] px-4 py-4 shadow-[0_10px_28px_rgba(15,19,36,0.05)]"
                    key={lead.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{lead.company}</p>
                        <p className="mt-1 text-xs text-muted">
                          {lead.name} • {lead.owner || "Sin asignar"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          days < 0
                            ? "bg-[#ffe0e0] text-[#b42318]"
                            : days === 0
                              ? "bg-[#dce8ff] text-[#2f5bea]"
                              : "bg-[#e4f4d8] text-[#267a2b]"
                        }`}
                      >
                        {days < 0 ? "Vencida" : days === 0 ? "Hoy" : `En ${days} dias`}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">{lead.summary}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted">
                        Proxima accion: {formatDate(lead.nextActionAt)}
                      </p>
                      <Link
                        className="inline-flex items-center gap-2 rounded-full bg-[#10162f] px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5"
                        href={`/crm/leads/${lead.id}`}
                      >
                        Abrir
                        <ArrowRight aria-hidden="true" size={12} />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </CrmSurfaceCard>

        <CrmSurfaceCard
          description="Lo ultimo que se movio en actividad y conversaciones para entrar rapido con contexto."
          title="Pulso reciente"
        >
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">Actividad reciente</h3>
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
                  {latestActivities.length} items
                </span>
              </div>
              {latestActivities.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
                  Aun no hay actividad registrada.
                </p>
              ) : (
                latestActivities.map((activity) => (
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

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">
                  Conversaciones recientes
                </h3>
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
                  {latestConversations.length} items
                </span>
              </div>
              {latestConversations.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
                  Aun no hay conversaciones registradas.
                </p>
              ) : (
                latestConversations.map((conversation) => (
                  <article
                    className="rounded-2xl bg-paper px-4 py-4"
                    key={conversation.id}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
                      {conversation.channel} •{" "}
                      {conversation.detectedIntent.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-ink">
                      {conversation.transcriptSummary}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {formatDate(conversation.lastMessageAt)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </CrmSurfaceCard>
      </section>

      <TaskInboxBoard leads={snapshot.leads} tasks={snapshot.tasks} />
    </div>
  );
}

function FocusCard({
  icon,
  label,
  value,
  description,
  href,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
  href: string;
  tone: "blue" | "red" | "amber";
}) {
  const toneClass =
    tone === "red"
      ? "border-white/12 bg-white/10"
      : tone === "amber"
        ? "border-white/12 bg-white/10"
        : "border-white/12 bg-white/10";

  return (
    <article className={`rounded-[1.5rem] border p-4 backdrop-blur ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex rounded-full bg-white/14 p-3 text-white">
          {icon}
        </div>
        <p className="font-heading text-3xl font-semibold">{value}</p>
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/74">{description}</p>
      <Link
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-white/80"
        href={href}
      >
        Ver modulo
        <ArrowRight aria-hidden="true" size={14} />
      </Link>
    </article>
  );
}

function AlertRow({
  label,
  value,
  description,
  href,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  href: string;
  tone: AlertTone;
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#ffd6d6] bg-[#fff4f4]"
      : tone === "warning"
        ? "border-[#ffe4b5] bg-[#fff8ec]"
        : tone === "positive"
          ? "border-[#d9ebd0] bg-[#f4fbef]"
          : "border-[#e7ebf6] bg-[#f8f9fc]";

  const valueClass =
    tone === "danger"
      ? "text-[#b42318]"
      : tone === "warning"
        ? "text-[#b56a06]"
        : tone === "positive"
          ? "text-[#267a2b]"
          : "text-ink";

  return (
    <article className={`rounded-[1.4rem] border px-4 py-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <p className={`mt-2 font-heading text-3xl font-semibold ${valueClass}`}>
            {value}
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-strong transition hover:opacity-80"
          href={href}
        >
          Abrir
          <ArrowRight aria-hidden="true" size={12} />
        </Link>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </article>
  );
}

function ModuleCard({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="rounded-[1.8rem] border border-line bg-white p-5 shadow-soft">
      <div className="inline-flex rounded-full bg-[#eef1ff] p-3 text-primary-strong">
        {icon}
      </div>
      <h2 className="font-heading mt-4 text-2xl font-semibold text-ink">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      <Link
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-strong transition hover:opacity-80"
        href={href}
      >
        {cta}
        <ArrowRight aria-hidden="true" size={14} />
      </Link>
    </article>
  );
}
