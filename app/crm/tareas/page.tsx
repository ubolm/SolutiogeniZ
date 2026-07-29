import { cookies } from "next/headers";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { TaskInboxBoard } from "@/components/crm/TaskInboxBoard";
import { getCrmSessionCookieName } from "@/lib/crm-auth";
import { verifyActiveCrmSessionToken } from "@/lib/crm-session";
import { getCrmSnapshot, scopeCrmSnapshotToSession } from "@/lib/crm-store";

export const dynamic = "force-dynamic";

export default async function CrmTasksPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyActiveCrmSessionToken(token);
  const role = session?.role ?? "vendedor";
  const snapshot = scopeCrmSnapshotToSession(await getCrmSnapshot(), session);
  const pendingTasks = snapshot.tasks.filter((task) => task.status === "pendiente");
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

  return (
    <div className="grid gap-8">
      <CrmPageIntro
        description="Prioriza seguimientos comerciales, detecta vencimientos y entra rapido al lead correcto para resolver cada pendiente."
        eyebrow="Tareas"
        stats={[
          {
            label: "Pendientes",
            value: pendingTasks.length.toString(),
          },
          {
            label: "Atrasadas",
            value: overdueTasks.length.toString(),
          },
          {
            label: "Para hoy",
            value: todayTasks.length.toString(),
          },
        ]}
        title="Tareas"
      />

      <TaskInboxBoard leads={snapshot.leads} role={role} tasks={snapshot.tasks} />
    </div>
  );
}
