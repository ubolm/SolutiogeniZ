import { cookies } from "next/headers";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { CrmSurfaceCard } from "@/components/crm/CrmSurfaceCard";
import { LeadCsvImportCard } from "@/components/crm/LeadCsvImportCard";
import { LeadPipelineManager } from "@/components/crm/LeadPipelineManager";
import { ManualLeadForm } from "@/components/crm/ManualLeadForm";
import {
  getCrmRoleCapabilities,
  getCrmSessionCookieName,
} from "@/lib/crm-auth";
import { verifyActiveCrmSessionToken } from "@/lib/crm-session";
import { getCrmSnapshot, scopeCrmSnapshotToSession } from "@/lib/crm-store";
import { getAssignableCrmUsers } from "@/lib/crm-users";

export const dynamic = "force-dynamic";

export default async function CrmLeadsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyActiveCrmSessionToken(token);
  const role = session?.role ?? "vendedor";
  const capabilities = getCrmRoleCapabilities(role);
  const snapshot = scopeCrmSnapshotToSession(await getCrmSnapshot(), session);
  const ownerUsers = capabilities.canCreateManualLeads
    ? await getAssignableCrmUsers()
    : [];

  return (
    <div className="grid gap-8">
      <CrmPageIntro
        description="Gestiona oportunidades, organiza etapas y abre cada ficha para trabajar el seguimiento comercial en detalle."
        eyebrow="Leads"
        stats={[
          {
            label: "Totales",
            value: snapshot.leads.length.toString(),
          },
          {
            label: "Respondieron",
            value: snapshot.leads
              .filter((lead) => lead.status === "respondio")
              .length.toString(),
          },
          {
            label: "Propuesta enviada",
            value: snapshot.leads
              .filter((lead) => lead.status === "propuesta_enviada")
              .length.toString(),
          },
          {
            label: "Clientes",
            value: snapshot.leads
              .filter((lead) => lead.status === "cliente")
              .length.toString(),
          },
        ]}
        title="Pipeline comercial"
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <CrmSurfaceCard
          description="Visualiza los leads por etapa y trabajalos desde cada tarjeta."
          title="Pipeline"
        >
          <div className="mt-1">
            <LeadPipelineManager
              activities={snapshot.activities}
              conversations={snapshot.conversations}
              leads={snapshot.leads}
              ownerOptions={ownerUsers.map((user) => user.username)}
              role={role}
            />
          </div>
        </CrmSurfaceCard>

        <div className="grid gap-6">
          {capabilities.canCreateManualLeads ? (
            <>
              <ManualLeadForm ownerOptions={ownerUsers.map((user) => user.username)} />
              <LeadCsvImportCard />
            </>
          ) : null}

          <CrmSurfaceCard
            description="Una lectura corta del estado comercial actual."
            title="Estado rapido"
            tone="muted"
          >
            <div className="mt-5 grid gap-3">
              <QuickStat
                label="Contactados"
                value={snapshot.leads.filter((lead) => lead.status === "contactado").length.toString()}
              />
              <QuickStat
                label="Reunion agendada"
                value={snapshot.leads.filter((lead) => lead.status === "reunion_agendada").length.toString()}
              />
              <QuickStat
                label="En negociacion"
                value={snapshot.leads.filter((lead) => lead.status === "negociacion").length.toString()}
              />
              <QuickStat
                label="Clientes"
                value={snapshot.leads.filter((lead) => lead.status === "cliente").length.toString()}
              />
            </div>
          </CrmSurfaceCard>
        </div>
      </section>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-paper px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold text-ink">
        {value}
      </p>
    </article>
  );
}
