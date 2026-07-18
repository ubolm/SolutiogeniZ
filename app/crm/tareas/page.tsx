import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { TaskInboxBoard } from "@/components/crm/TaskInboxBoard";
import { getCrmSnapshot } from "@/lib/crm-store";

export default async function CrmTasksPage() {
  const snapshot = await getCrmSnapshot();
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
        title="Bandeja operativa"
      />

      <TaskInboxBoard leads={snapshot.leads} tasks={snapshot.tasks} />
    </div>
  );
}
