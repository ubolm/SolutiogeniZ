import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CalendarClock, Workflow } from "lucide-react";

import {
  getCrmRoleCapabilities,
  type CrmRole,
} from "@/lib/crm-auth";
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
  role,
  tasks,
  showHeader = true,
}: {
  leads: CrmLead[];
  role: CrmRole;
  tasks: CrmTask[];
  showHeader?: boolean;
}) {
  const { pendingTasks, overdueTasks, todayTasks, upcomingTasks } =
    getPendingTaskGroups(tasks);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-3">
        <TaskSummaryCard
          accent="border-[#ffd1d1] bg-[linear-gradient(180deg,rgba(255,244,244,0.88)_0%,rgba(255,236,236,0.78)_100%)] text-[#b42318]"
          count={overdueTasks.length}
          icon={<AlertTriangle aria-hidden="true" size={18} />}
          label="Atrasadas"
        />
        <TaskSummaryCard
          accent="border-[#d6e4ff] bg-[linear-gradient(180deg,rgba(243,247,255,0.88)_0%,rgba(232,240,255,0.78)_100%)] text-[#2f5bea]"
          count={todayTasks.length}
          icon={<CalendarClock aria-hidden="true" size={18} />}
          label="Para hoy"
        />
        <TaskSummaryCard
          accent="border-[#d8e7cf] bg-[linear-gradient(180deg,rgba(244,251,239,0.88)_0%,rgba(235,247,227,0.78)_100%)] text-[#267a2b]"
          count={upcomingTasks.length}
          icon={<Workflow aria-hidden="true" size={18} />}
          label="Proximas"
        />
      </section>

      <section className="rounded-[1.85rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(248,250,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
        {showHeader ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-[1.6rem] font-semibold text-ink">
                Bandeja
              </h2>
              <p className="mt-1.5 text-[0.98rem] leading-6 text-muted">
                Vista corta para ejecutar seguimientos sin perder tiempo.
              </p>
            </div>
            <span className="rounded-full border border-white/70 bg-white/58 px-3.5 py-1.5 text-[0.82rem] font-semibold text-muted backdrop-blur-[10px]">
              {pendingTasks.length} pendientes
            </span>
          </div>
        ) : null}

        <div className={`${showHeader ? "mt-6" : ""} grid gap-4 xl:grid-cols-3`}>
          <TaskColumn
            emptyLabel="No hay tareas atrasadas."
            leads={leads}
            role={role}
            tasks={overdueTasks.sort(
              (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
            )}
            title="Atrasadas"
          />
          <TaskColumn
            emptyLabel="No hay tareas para hoy."
            leads={leads}
            role={role}
            tasks={todayTasks.sort(
              (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
            )}
            title="Hoy"
          />
          <TaskColumn
            emptyLabel="No hay proximas tareas."
            leads={leads}
            role={role}
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
    <article className={`rounded-[1.5rem] border p-4 shadow-soft backdrop-blur-[10px] ${accent}`}>
      <div className="inline-flex rounded-full bg-white/80 p-2.5">{icon}</div>
      <p className="mt-3 text-[0.98rem] font-medium">{label}</p>
      <p className="mt-1.5 font-heading text-[2rem] font-semibold">{count}</p>
    </article>
  );
}

function TaskColumn({
  title,
  tasks,
  leads,
  role,
  emptyLabel,
}: {
  title: string;
  tasks: CrmTask[];
  leads: CrmLead[];
  role: CrmRole;
  emptyLabel: string;
}) {
  const capabilities = getCrmRoleCapabilities(role);
  const toneClass =
    title === "Atrasadas"
      ? "border-[#ffd6d6] bg-[linear-gradient(180deg,rgba(255,248,248,0.84)_0%,rgba(255,242,242,0.7)_100%)]"
      : title === "Hoy"
        ? "border-[#d8e4ff] bg-[linear-gradient(180deg,rgba(248,251,255,0.84)_0%,rgba(238,244,255,0.7)_100%)]"
        : "border-[#dcead1] bg-[linear-gradient(180deg,rgba(248,252,244,0.84)_0%,rgba(243,249,238,0.7)_100%)]";

  return (
    <section className={`rounded-[1.55rem] border p-4 backdrop-blur-[10px] ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[0.98rem] font-semibold text-ink">{title}</h3>
        <span className="rounded-full border border-white/70 bg-white/72 px-2.5 py-1 text-[0.78rem] font-semibold text-muted">
          {tasks.length}
        </span>
      </div>

      <div className="mt-3.5 grid gap-3">
        {tasks.length === 0 ? (
          <p className="rounded-[1.2rem] border border-dashed border-white/70 bg-white/56 px-4 py-5 text-[0.95rem] text-muted backdrop-blur-[8px]">
            {emptyLabel}
          </p>
        ) : (
          tasks.map((task) => {
            const lead = leads.find((item) => item.id === task.leadId);
            const timingLabel = getTaskTimingLabel(task.dueAt);

            return (
              <article
                className="rounded-[1.3rem] border border-white/80 bg-white/62 px-4 py-4 shadow-[0_14px_28px_rgba(15,19,36,0.06)] backdrop-blur-[10px]"
                key={task.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.98rem] font-semibold text-ink">{task.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
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
                  <p className="text-right text-[11px] leading-5 text-muted">
                    {formatDate(task.dueAt)}
                  </p>
                </div>

                <div className="mt-3.5 rounded-[1.05rem] border border-white/70 bg-white/6 px-3.5 py-3">
                  <p className="text-[0.95rem] font-semibold text-ink">
                    {lead?.company ?? "Lead eliminado"}
                  </p>
                  <p className="mt-1 text-[0.82rem] text-muted">
                    {lead?.name ?? "Sin contacto"}
                    {capabilities.canManageOwner
                      ? ` · ${lead?.owner || "Sin asignar"}`
                      : ""}
                  </p>
                </div>

                {lead ? (
                  <div className="mt-3.5 flex items-center justify-end gap-3">
                    <Link
                      className="inline-flex rounded-full bg-[#10162f] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:-translate-y-0.5"
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
