"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarClock, ListTodo, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

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

export function OwnerWorkspacePanel({
  leads,
  tasks,
}: {
  leads: CrmLead[];
  tasks: CrmTask[];
}) {
  const ownerOptions = useMemo(
    () => [
      "todos",
      ...Array.from(
        new Set(leads.map((lead) => lead.owner || "Sin asignar").filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [leads],
  );

  const [selectedOwner, setSelectedOwner] = useState(ownerOptions[1] ?? "todos");

  const ownedLeads = useMemo(
    () =>
      leads.filter((lead) =>
        selectedOwner === "todos"
          ? true
          : (lead.owner || "Sin asignar") === selectedOwner,
      ),
    [leads, selectedOwner],
  );

  const pendingTasks = useMemo(() => {
    const ownedLeadIds = new Set(ownedLeads.map((lead) => lead.id));

    return tasks
      .filter(
        (task) =>
          task.status === "pendiente" &&
          (selectedOwner === "todos" || ownedLeadIds.has(task.leadId)),
      )
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [ownedLeads, selectedOwner, tasks]);

  const overdueTasks = pendingTasks.filter(
    (task) => new Date(task.dueAt).getTime() < Date.now(),
  );

  const dueTodayTasks = pendingTasks.filter((task) => {
    const dueDate = new Date(task.dueAt);
    const now = new Date();
    return (
      dueDate.getFullYear() === now.getFullYear() &&
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getDate() === now.getDate()
    );
  });

  const leadsNeedingAction = ownedLeads
    .filter((lead) => new Date(lead.nextActionAt).getTime() <= Date.now())
    .sort(
      (a, b) =>
        new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime(),
    )
    .slice(0, 6);

  return (
    <section className="rounded-[1.85rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(248,250,255,0.66)_100%)] p-5 shadow-soft backdrop-blur-[12px] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-[1.55rem] font-semibold text-ink">
            Mi trabajo
          </h2>
          <p className="mt-1.5 text-[0.98rem] leading-6 text-muted">
            Filtra por responsable para ver pendientes y oportunidades activas sin ruido.
          </p>
        </div>

        <label className="grid gap-1 text-xs font-semibold text-muted">
          Responsable
          <select
            className="field min-h-11 min-w-[16rem] text-[0.95rem]"
            onChange={(event) => setSelectedOwner(event.target.value)}
            value={selectedOwner}
          >
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner === "todos" ? "Todos los responsables" : owner}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <OwnerMetric
          icon={<UserRound aria-hidden="true" size={18} />}
          label="Leads asignados"
          value={ownedLeads.length.toString()}
        />
        <OwnerMetric
          icon={<ListTodo aria-hidden="true" size={18} />}
          label="Tareas pendientes"
          value={pendingTasks.length.toString()}
        />
        <OwnerMetric
          icon={<CalendarClock aria-hidden="true" size={18} />}
          label="Vencen hoy o antes"
          value={(overdueTasks.length + dueTodayTasks.length).toString()}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="rounded-[1.55rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.6)_0%,rgba(243,246,255,0.68)_100%)] p-4 backdrop-blur-[10px]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[0.98rem] font-semibold text-ink">Tareas prioritarias</h3>
            <span className="rounded-full border border-white/75 bg-white/64 px-2.5 py-1 text-[0.78rem] font-semibold text-muted">
              {pendingTasks.length}
            </span>
          </div>

          <div className="mt-3.5 grid gap-3">
            {pendingTasks.length === 0 ? (
              <p className="rounded-[1.25rem] border border-dashed border-white/70 bg-white/52 px-4 py-5 text-[0.95rem] text-muted backdrop-blur-[8px]">
                No hay tareas pendientes para este responsable.
              </p>
            ) : (
              pendingTasks.slice(0, 8).map((task) => {
                const lead = leads.find((item) => item.id === task.leadId);
                const timingLabel = getTaskTimingLabel(task.dueAt);

                return (
                  <article
                    className="rounded-[1.35rem] border border-white/80 bg-white/66 px-4 py-4 shadow-[0_14px_28px_rgba(15,19,36,0.06)] backdrop-blur-[10px]"
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

                    <div className="mt-3.5 rounded-[1.05rem] border border-white/70 bg-white/56 px-3.5 py-3">
                      <p className="text-[0.95rem] font-semibold text-ink">
                        {lead?.company ?? "Lead eliminado"}
                      </p>
                    </div>

                    {lead ? (
                      <div className="mt-3.5 flex justify-end">
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

        <section className="rounded-[1.55rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.6)_0%,rgba(243,246,255,0.68)_100%)] p-4 backdrop-blur-[10px]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[0.98rem] font-semibold text-ink">
              Leads que necesitan accion
            </h3>
            <span className="rounded-full border border-white/75 bg-white/64 px-2.5 py-1 text-[0.78rem] font-semibold text-muted">
              {leadsNeedingAction.length}
            </span>
          </div>

          <div className="mt-3.5 grid gap-3">
            {leadsNeedingAction.length === 0 ? (
              <p className="rounded-[1.25rem] border border-dashed border-white/70 bg-white/52 px-4 py-5 text-[0.95rem] text-muted backdrop-blur-[8px]">
                No hay leads vencidos o para trabajar hoy para este responsable.
              </p>
            ) : (
              leadsNeedingAction.map((lead) => (
                <article
                  className="rounded-[1.35rem] border border-white/80 bg-white/66 px-4 py-4 shadow-[0_14px_28px_rgba(15,19,36,0.06)] backdrop-blur-[10px]"
                  key={lead.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.98rem] font-semibold text-ink">{lead.company}</p>
                      <p className="mt-1 text-[0.82rem] text-muted">{lead.name}</p>
                    </div>
                    <span className="rounded-full border border-white/70 bg-white/56 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {lead.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="mt-3.5 rounded-[1.05rem] border border-white/70 bg-white/56 px-3.5 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                      Proxima accion
                    </p>
                    <p className="mt-1.5 text-[0.95rem] font-semibold text-ink">
                      {formatDate(lead.nextActionAt)}
                    </p>
                  </div>

                  <div className="mt-3.5 flex justify-end">
                    <Link
                      className="inline-flex rounded-full bg-[#10162f] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:-translate-y-0.5"
                      href={`/crm/leads/${lead.id}`}
                    >
                      Abrir lead
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function OwnerMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.4rem] border border-white/75 bg-white/58 p-4 shadow-soft backdrop-blur-[10px]">
      <div className="inline-flex rounded-full bg-white/78 p-2.5 text-primary-strong">
        {icon}
      </div>
      <p className="mt-3 text-[0.95rem] font-medium text-muted">{label}</p>
      <p className="mt-1.5 font-heading text-[1.85rem] font-semibold text-ink">
        {value}
      </p>
    </article>
  );
}
