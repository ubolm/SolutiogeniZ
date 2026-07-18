import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CalendarClock, Workflow } from "lucide-react";

import type { CrmLead, CrmTask } from "@/lib/crm-store";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTaskTimingLabel(value: string) {
  const now = new Date();
  const dueDate = new Date(value);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDueDate = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
  );
  const diffDays = Math.round(
    (startOfDueDate.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (diffDays < 0) return "Atrasada";
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Manana";
  return `En ${diffDays} dias`;
}

function getPendingTaskGroups(tasks: CrmTask[]) {
  const pendingTasks = tasks.filter((task) => task.status === "pendiente");
  const overdueTasks = pendingTasks.filter(
    (task) => new Date(task.dueAt).getTime() < Date.now(),
  );
  const todayTasks = pendingTasks.filter((task) => {
    const dueDate = new Date(task.dueAt);
    const now = new Date();
    return (
      dueDate.getFullYear() === now.getFullYear() &&
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getDate() === now.getDate()
    );
  });
  const upcomingTasks = pendingTasks
    .filter((task) => !overdueTasks.includes(task) && !todayTasks.includes(task))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return {
    pendingTasks,
    overdueTasks,
    todayTasks,
    upcomingTasks,
  };
}

export function TaskInboxBoard({
  leads,
  tasks,
  showHeader = true,
}: {
  leads: CrmLead[];
  tasks: CrmTask[];
  showHeader?: boolean;
}) {
  const { pendingTasks, overdueTasks, todayTasks, upcomingTasks } =
    getPendingTaskGroups(tasks);

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 xl:grid-cols-3">
        <TaskSummaryCard
          accent="border-[#ffd1d1] bg-[#fff4f4] text-[#b42318]"
          count={overdueTasks.length}
          icon={<AlertTriangle aria-hidden="true" size={18} />}
          label="Atrasadas"
        />
        <TaskSummaryCard
          accent="border-[#d6e4ff] bg-[#f3f7ff] text-[#2f5bea]"
          count={todayTasks.length}
          icon={<CalendarClock aria-hidden="true" size={18} />}
          label="Para hoy"
        />
        <TaskSummaryCard
          accent="border-[#d8e7cf] bg-[#f4fbef] text-[#267a2b]"
          count={upcomingTasks.length}
          icon={<Workflow aria-hidden="true" size={18} />}
          label="Proximas"
        />
      </section>

      <section className="rounded-[1.7rem] border border-line bg-white p-4 shadow-soft md:p-5">
        {showHeader ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-ink">
                Bandeja de tareas
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted">
                Una vista general para priorizar que seguimiento comercial hacer primero.
              </p>
            </div>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-muted">
              {pendingTasks.length} pendientes
            </span>
          </div>
        ) : null}

        <div className={`${showHeader ? "mt-5" : ""} grid gap-4 xl:grid-cols-3`}>
          <TaskColumn
            emptyLabel="No hay tareas atrasadas."
            leads={leads}
            tasks={overdueTasks.sort(
              (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
            )}
            title="Atrasadas"
          />
          <TaskColumn
            emptyLabel="No hay tareas para hoy."
            leads={leads}
            tasks={todayTasks.sort(
              (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
            )}
            title="Hoy"
          />
          <TaskColumn
            emptyLabel="No hay proximas tareas."
            leads={leads}
            tasks={upcomingTasks.slice(0, 8)}
            title="Proximas"
          />
        </div>
      </section>
    </div>
  );
}

function TaskSummaryCard({
  icon,
  label,
  count,
  accent,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  accent: string;
}) {
  return (
    <article className={`rounded-[1.3rem] border p-4 shadow-soft ${accent}`}>
      <div className="inline-flex rounded-full bg-white/80 p-2.5">{icon}</div>
      <p className="mt-3 text-sm font-medium">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold">{count}</p>
    </article>
  );
}

function TaskColumn({
  title,
  tasks,
  leads,
  emptyLabel,
}: {
  title: string;
  tasks: CrmTask[];
  leads: CrmLead[];
  emptyLabel: string;
}) {
  const toneClass =
    title === "Atrasadas"
      ? "border-[#ffd6d6] bg-[linear-gradient(180deg,#fff8f8_0%,#fff2f2_100%)]"
      : title === "Hoy"
        ? "border-[#d8e4ff] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]"
        : "border-[#dcead1] bg-[linear-gradient(180deg,#f8fcf4_0%,#f3f9ee_100%)]";

  return (
    <section className={`rounded-[1.4rem] border p-3.5 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-muted">
          {tasks.length}
        </span>
      </div>

      <div className="mt-3 grid gap-2.5">
        {tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white/84 px-4 py-5 text-sm text-muted">
            {emptyLabel}
          </p>
        ) : (
          tasks.map((task) => {
            const lead = leads.find((item) => item.id === task.leadId);
            const timingLabel = getTaskTimingLabel(task.dueAt);

            return (
              <article
                className="rounded-[1.2rem] border border-white/90 bg-white/92 px-3.5 py-3.5 shadow-[0_10px_24px_rgba(15,19,36,0.05)]"
                key={task.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{task.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[#edf2ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4454f5]">
                        {task.type}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          timingLabel === "Atrasada"
                            ? "bg-[#ffe0e0] text-[#b42318]"
                            : timingLabel === "Hoy"
                              ? "bg-[#dce8ff] text-[#2f5bea]"
                              : "bg-[#e4f4d8] text-[#267a2b]"
                        }`}
                      >
                        {timingLabel}
                      </span>
                    </div>
                  </div>
                  <p className="text-right text-[11px] text-muted">
                    {formatDate(task.dueAt)}
                  </p>
                </div>

                <div className="mt-3 rounded-[1rem] bg-[#f7f9fc] px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">
                    {lead?.company ?? "Lead eliminado"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {lead?.name ?? "Sin contacto"} · {lead?.owner || "Sin asignar"}
                  </p>
                </div>

                {lead ? (
                    <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                      Seguimiento pendiente
                    </p>
                    <Link
                      className="inline-flex rounded-full bg-[#10162f] px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5"
                      href={`/crm/leads/${lead.id}`}
                    >
                      Abrir lead
                    </Link>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
