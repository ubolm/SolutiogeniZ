import { cookies } from "next/headers";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { getCrmSessionCookieName } from "@/lib/crm-auth";
import { verifyActiveCrmSessionToken } from "@/lib/crm-session";
import { OwnerWorkspacePanel } from "@/components/crm/OwnerWorkspacePanel";
import { getCrmSnapshot, scopeCrmSnapshotToSession } from "@/lib/crm-store";

export const dynamic = "force-dynamic";

export default async function CrmMyWorkPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyActiveCrmSessionToken(token);
  const snapshot = scopeCrmSnapshotToSession(await getCrmSnapshot(), session);
  const assignedLeads = snapshot.leads.filter(
    (lead) => (lead.owner || "Sin asignar") !== "Sin asignar",
  );
  const pendingTasks = snapshot.tasks.filter((task) => task.status === "pendiente");

  return (
    <div className="grid gap-8">
      <CrmPageIntro
        description="Filtra por persona para ver rapido sus leads, tareas prioritarias y oportunidades que necesitan accion hoy."
        eyebrow="Mi trabajo"
        stats={[
          {
            label: "Leads asignados",
            value: assignedLeads.length.toString(),
          },
          {
            label: "Responsables",
            value: Array.from(
              new Set(assignedLeads.map((lead) => lead.owner || "Sin asignar")),
            ).length.toString(),
          },
          {
            label: "Tareas pendientes",
            value: pendingTasks.length.toString(),
          },
        ]}
        title="Vista por responsable"
      />

      <OwnerWorkspacePanel leads={snapshot.leads} tasks={snapshot.tasks} />
    </div>
  );
}
