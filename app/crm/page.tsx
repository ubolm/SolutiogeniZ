import {
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  MessageSquareMore,
  Target,
} from "lucide-react";
import Link from "next/link";

import { AdminStatusTable } from "@/components/crm/AdminStatusTable";
import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { CrmSurfaceCard } from "@/components/crm/CrmSurfaceCard";
import { getCrmSnapshot } from "@/lib/crm-store";
import type { CrmLead } from "@/lib/crm-store";

export const dynamic = "force-dynamic";

function getDayOffset(value: string) {
  const now = new Date();
  const target = new Date(value);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.round((targetDay.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function hasValidNextAction(value: string) {
  return Boolean(value) && !Number.isNaN(Date.parse(value));
}

function isLeadOwnerMissing(lead: CrmLead) {
  return !lead.owner.trim() || lead.owner.trim() === "Sin asignar";
}

function isLeadContextIncomplete(lead: CrmLead) {
  return (
    !lead.customerContext.detectedProblems.trim() ||
    !lead.customerContext.diagnosedSystems.trim() ||
    !lead.extendedProfile.opportunityDetected.trim()
  );
}

export default async function CrmDashboardPage() {
  const snapshot = await getCrmSnapshot();

  const pendingTasks = snapshot.tasks.filter((task) => task.status === "pendiente");
  const overdueTasks = pendingTasks.filter(
    (task) => new Date(task.dueAt).getTime() < Date.now(),
  );
  const todayTasks = pendingTasks.filter(
    (task) => getDayOffset(task.dueAt) === 0,
  );
  const proposalLeads = snapshot.leads.filter(
    (lead) => lead.status === "propuesta_enviada",
  );
  const followupLeads = snapshot.leads.filter(
    (lead) => lead.status === "negociacion",
  );
  const activeLeads = snapshot.leads.filter(
    (lead) => lead.status !== "cliente" && lead.status !== "perdido",
  );
  const overdueLeadActions = activeLeads.filter(
    (lead) => getDayOffset(lead.nextActionAt) < 0,
  );
  const todayLeadActions = activeLeads.filter(
    (lead) => getDayOffset(lead.nextActionAt) === 0,
  );
  const upcomingLeadActions = activeLeads
    .filter((lead) => {
      const offset = getDayOffset(lead.nextActionAt);
      return offset > 0 && offset <= 3;
    })
    .sort(
      (a, b) =>
        new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime(),
    );
  const recentConversations = snapshot.conversations.slice(0, 3);
  const recentTasks = pendingTasks
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 4);
  const urgentLeadList = [...overdueLeadActions, ...todayLeadActions]
    .sort(
      (a, b) =>
        new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime(),
    )
    .slice(0, 5);
  const leadsWithoutOwner = activeLeads.filter(isLeadOwnerMissing);
  const leadsWithoutNextAction = activeLeads.filter(
    (lead) => !hasValidNextAction(lead.nextActionAt),
  );
  const leadsWithIncompleteContext = activeLeads.filter(isLeadContextIncomplete);
  const hygieneLeadList = [
    ...leadsWithoutOwner.map((lead) => ({
      lead,
      label: "Sin responsable",
      tone: "danger" as const,
      detail: "Asigna un responsable para que alguien tome esta oportunidad.",
    })),
    ...leadsWithoutNextAction.map((lead) => ({
      lead,
      label: "Sin proxima accion",
      tone: "warning" as const,
      detail: "Define un seguimiento concreto para que no se enfrie.",
    })),
    ...leadsWithIncompleteContext.map((lead) => ({
      lead,
      label: "Contexto incompleto",
      tone: "neutral" as const,
      detail: "Faltan problemas, sistemas u oportunidad detectada.",
    })),
  ]
    .filter(
      (item, index, array) =>
        array.findIndex((candidate) => candidate.lead.id === item.lead.id) === index,
    )
    .slice(0, 6);

  return (
    <div className="grid gap-7">
      <CrmPageIntro
        eyebrow="Dashboard"
        title="Centro comercial"
        description="Una entrada corta para detectar que mover hoy y a donde conviene entrar primero."
        stats={[
          { label: "Leads activos", value: snapshot.leads.length.toString() },
          { label: "Tareas hoy", value: todayTasks.length.toString() },
          { label: "Propuestas enviadas", value: proposalLeads.length.toString() },
          {
            label: "Conversaciones",
            value: snapshot.conversations.length.toString(),
          },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <CrmSurfaceCard
          description="Tres alertas simples para entrar en accion sin ruido."
          title="Hoy importa"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <PriorityStat
              detail={
                overdueTasks.length > 0
                  ? "Conviene resolverlas primero."
                  : "No hay atrasos visibles."
              }
              icon={<AlertTriangle aria-hidden="true" size={16} />}
              label="Tareas vencidas"
              tone="danger"
              value={overdueTasks.length.toString()}
            />
            <PriorityStat
              detail={
                todayTasks.length > 0
                  ? "Seguimientos a ejecutar hoy."
                  : "No hay agenda urgente para hoy."
              }
              icon={<Clock3 aria-hidden="true" size={16} />}
              label="Pendientes hoy"
              tone="warning"
              value={todayTasks.length.toString()}
            />
            <PriorityStat
              detail={
                overdueLeadActions.length > 0
                  ? "Leads con seguimiento vencido."
                  : "No hay seguimientos vencidos."
              }
              icon={<Target aria-hidden="true" size={16} />}
              label="Leads vencidos"
              tone="neutral"
              value={overdueLeadActions.length.toString()}
            />
          </div>
        </CrmSurfaceCard>

        <CrmSurfaceCard
          action={
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong transition hover:opacity-80"
              href="/crm/tareas"
            >
              Abrir tareas
              <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          }
          description="Los proximos pendientes para no perder continuidad."
          title="Agenda inmediata"
        >
          <div className="grid gap-2.5">
            {recentTasks.length === 0 ? (
              <EmptyMiniState text="No hay tareas pendientes en este momento." />
            ) : (
              recentTasks.map((task) => (
                <MiniListItem
                  key={task.id}
                  meta={formatDate(task.dueAt)}
                  title={task.title}
                />
              ))
            )}
          </div>
        </CrmSurfaceCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <CrmSurfaceCard
          action={
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong transition hover:opacity-80"
              href="/crm/leads"
            >
              Abrir leads
              <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          }
          description="Leads que conviene retomar primero para no perder continuidad comercial."
          title="Seguimientos criticos"
        >
          <div className="grid gap-2.5">
            {urgentLeadList.length === 0 ? (
              <EmptyMiniState text="No hay leads urgentes por retomar en este momento." />
            ) : (
              urgentLeadList.map((lead) => (
                <LeadActionItem
                  company={lead.company}
                  href={`/crm/leads/${lead.id}`}
                  key={lead.id}
                  meta={`${formatDate(lead.nextActionAt)} · ${lead.owner || "Sin asignar"}`}
                  note={lead.summary}
                  tone={getDayOffset(lead.nextActionAt) < 0 ? "danger" : "warning"}
                />
              ))
            )}
          </div>
        </CrmSurfaceCard>

        <CrmSurfaceCard
          action={
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong transition hover:opacity-80"
              href="/crm/conversaciones"
            >
              Abrir conversaciones
              <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          }
          description="Contexto reciente para revisar antes de responder."
          title="Conversaciones recientes"
        >
          <div className="grid gap-2.5">
            {recentConversations.length === 0 ? (
              <EmptyMiniState text="Todavia no hay conversaciones registradas." />
            ) : (
              recentConversations.map((conversation) => (
                <MiniConversationItem
                  key={conversation.id}
                  summary={conversation.transcriptSummary}
                  title={`${conversation.channel} · ${conversation.detectedIntent.replaceAll("_", " ")}`}
                />
              ))
            )}
          </div>
        </CrmSurfaceCard>

        <CrmSurfaceCard
          description="Control interno integrado al dashboard para revisar estados rapido."
          title="Control rapido"
        >
          <AdminStatusTable />
        </CrmSurfaceCard>
      </section>

      <CrmSurfaceCard
        action={
          <Link
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong transition hover:opacity-80"
            href="/crm/leads"
          >
            Ver pipeline
            <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        }
        description="Proximas acciones comerciales dentro de los siguientes tres dias."
        title="Ventana proxima"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <PriorityStat
            detail={
              todayLeadActions.length > 0
                ? "Leads que deberian tocarse hoy."
                : "No hay acciones de lead para hoy."
            }
            icon={<Clock3 aria-hidden="true" size={16} />}
            label="Leads hoy"
            tone="warning"
            value={todayLeadActions.length.toString()}
          />
          <PriorityStat
            detail={
              upcomingLeadActions.length > 0
                ? "Seguimientos que vencen pronto."
                : "No hay acciones cercanas cargadas."
            }
            icon={<Target aria-hidden="true" size={16} />}
            label="Proximos 3 dias"
            tone="neutral"
            value={upcomingLeadActions.length.toString()}
          />
          <PriorityStat
            detail={
              followupLeads.length > 0
                ? "Oportunidades en negociacion activas."
                : "No hay negociaciones activas ahora."
            }
            icon={<MessageSquareMore aria-hidden="true" size={16} />}
            label="En negociacion"
            tone="neutral"
            value={followupLeads.length.toString()}
          />
        </div>
      </CrmSurfaceCard>

      <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <CrmSurfaceCard
          description="Lectura interna para que ninguna oportunidad quede floja por falta de datos o seguimiento."
          title="Higiene comercial"
        >
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <PriorityStat
              detail={
                leadsWithoutOwner.length > 0
                  ? "Leads que todavia no tienen vendedor asignado."
                  : "Todos los leads activos ya tienen responsable."
              }
              icon={<AlertTriangle aria-hidden="true" size={16} />}
              label="Sin responsable"
              tone="danger"
              value={leadsWithoutOwner.length.toString()}
            />
            <PriorityStat
              detail={
                leadsWithoutNextAction.length > 0
                  ? "Leads sin seguimiento agendado."
                  : "Todos tienen proxima accion cargada."
              }
              icon={<Clock3 aria-hidden="true" size={16} />}
              label="Sin proxima accion"
              tone="warning"
              value={leadsWithoutNextAction.length.toString()}
            />
            <PriorityStat
              detail={
                leadsWithIncompleteContext.length > 0
                  ? "Leads con contexto comercial incompleto."
                  : "El contexto base esta completo en los leads activos."
              }
              icon={<Target aria-hidden="true" size={16} />}
              label="Contexto incompleto"
              tone="neutral"
              value={leadsWithIncompleteContext.length.toString()}
            />
          </div>
        </CrmSurfaceCard>

        <CrmSurfaceCard
          action={
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong transition hover:opacity-80"
              href="/crm/leads"
            >
              Resolver en leads
              <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          }
          description="Casos donde conviene entrar a completar datos o dejar el seguimiento mejor ordenado."
          title="Pendientes de orden"
        >
          <div className="grid gap-2.5">
            {hygieneLeadList.length === 0 ? (
              <EmptyMiniState text="No hay leads activos con huecos operativos visibles en este momento." />
            ) : (
              hygieneLeadList.map((item) => (
                <HygieneLeadItem
                  company={item.lead.company}
                  detail={item.detail}
                  href={`/crm/leads/${item.lead.id}`}
                  key={`${item.label}-${item.lead.id}`}
                  meta={`${item.label} · ${item.lead.owner || "Sin asignar"}`}
                  tone={item.tone}
                />
              ))
            )}
          </div>
        </CrmSurfaceCard>
      </section>
    </div>
  );
}

function PriorityStat({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "danger" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#ffd8d8] bg-[linear-gradient(180deg,rgba(255,245,245,0.86)_0%,rgba(255,237,237,0.78)_100%)] text-[#b42318]"
      : tone === "warning"
        ? "border-[#ffe7bd] bg-[linear-gradient(180deg,rgba(255,248,236,0.86)_0%,rgba(255,242,221,0.78)_100%)] text-[#b56a06]"
        : "border-[#dde5ff] bg-[linear-gradient(180deg,rgba(243,246,255,0.86)_0%,rgba(234,239,255,0.78)_100%)] text-[#2f5bea]";

  return (
    <article className={`rounded-[1.45rem] border px-4 py-4 backdrop-blur-[10px] ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-white/80 p-2">{icon}</div>
        <p className="font-heading text-[2.1rem] font-semibold">{value}</p>
      </div>
      <p className="mt-3 text-[0.98rem] font-semibold">{label}</p>
      <p className="mt-1.5 text-[0.88rem] leading-6 opacity-80">{detail}</p>
    </article>
  );
}

function MiniListItem({
  title,
  meta,
}: {
  title: string;
  meta: string;
}) {
  return (
    <article className="rounded-[1.3rem] border border-white/70 bg-white/55 px-4 py-3.5 backdrop-blur-[10px]">
      <p className="text-[0.98rem] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[0.84rem] text-muted">{meta}</p>
    </article>
  );
}

function MiniConversationItem({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  return (
    <article className="rounded-[1.3rem] border border-white/70 bg-white/55 px-4 py-3.5 backdrop-blur-[10px]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex rounded-full bg-[#eef2ff] p-2 text-primary-strong">
          <MessageSquareMore aria-hidden="true" size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-[0.98rem] font-semibold capitalize text-ink">{title}</p>
          <p className="mt-1.5 line-clamp-2 text-[0.84rem] leading-6 text-muted">
            {summary}
          </p>
        </div>
      </div>
    </article>
  );
}

function LeadActionItem({
  company,
  meta,
  note,
  href,
  tone,
}: {
  company: string;
  meta: string;
  note: string;
  href: string;
  tone: "danger" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#ffd8d8] bg-[linear-gradient(180deg,rgba(255,245,245,0.86)_0%,rgba(255,237,237,0.78)_100%)]"
      : "border-[#ffe7bd] bg-[linear-gradient(180deg,rgba(255,248,236,0.86)_0%,rgba(255,242,221,0.78)_100%)]";

  return (
    <Link
      className={`block rounded-[1.3rem] border px-4 py-3.5 backdrop-blur-[10px] transition hover:-translate-y-0.5 ${toneClass}`}
      href={href}
    >
      <p className="text-[0.98rem] font-semibold text-ink">{company}</p>
      <p className="mt-1.5 text-[0.84rem] text-muted">{meta}</p>
      <p className="mt-2 line-clamp-2 text-[0.84rem] leading-6 text-ink/80">
        {note}
      </p>
    </Link>
  );
}

function HygieneLeadItem({
  company,
  meta,
  detail,
  href,
  tone,
}: {
  company: string;
  meta: string;
  detail: string;
  href: string;
  tone: "danger" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#ffd8d8] bg-[linear-gradient(180deg,rgba(255,245,245,0.86)_0%,rgba(255,237,237,0.78)_100%)]"
      : tone === "warning"
        ? "border-[#ffe7bd] bg-[linear-gradient(180deg,rgba(255,248,236,0.86)_0%,rgba(255,242,221,0.78)_100%)]"
        : "border-[#dde5ff] bg-[linear-gradient(180deg,rgba(243,246,255,0.86)_0%,rgba(234,239,255,0.78)_100%)]";

  return (
    <Link
      className={`block rounded-[1.3rem] border px-4 py-3.5 backdrop-blur-[10px] transition hover:-translate-y-0.5 ${toneClass}`}
      href={href}
    >
      <p className="text-[0.98rem] font-semibold text-ink">{company}</p>
      <p className="mt-1.5 text-[0.84rem] text-muted">{meta}</p>
      <p className="mt-2 text-[0.84rem] leading-6 text-ink/80">{detail}</p>
    </Link>
  );
}

function EmptyMiniState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.3rem] border border-dashed border-white/70 bg-white/45 px-4 py-5 text-[0.95rem] text-muted backdrop-blur-[8px]">
      {text}
    </div>
  );
}
