import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { CrmSurfaceCard } from "@/components/crm/CrmSurfaceCard";
import { LeadPipelineManager } from "@/components/crm/LeadPipelineManager";
import { ManualLeadForm } from "@/components/crm/ManualLeadForm";
import { getCrmSnapshot } from "@/lib/crm-store";

export const dynamic = "force-dynamic";

export default async function CrmLeadsPage() {
  const snapshot = await getCrmSnapshot();

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
            label: "Nuevos",
            value: snapshot.leads
              .filter((lead) => lead.status === "nuevo")
              .length.toString(),
          },
          {
            label: "En propuesta",
            value: snapshot.leads
              .filter((lead) => lead.status === "propuesta")
              .length.toString(),
          },
          {
            label: "Ganados",
            value: snapshot.leads
              .filter((lead) => lead.status === "cerrado_ganado")
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
            />
          </div>
        </CrmSurfaceCard>

        <div className="grid gap-6">
          <ManualLeadForm />

          <CrmSurfaceCard
            description="Una lectura corta del estado comercial actual."
            title="Estado rapido"
            tone="muted"
          >
            <div className="mt-5 grid gap-3">
              <QuickStat
                label="Leads nuevos"
                value={snapshot.leads.filter((lead) => lead.status === "nuevo").length.toString()}
              />
              <QuickStat
                label="En propuesta"
                value={snapshot.leads.filter((lead) => lead.status === "propuesta").length.toString()}
              />
              <QuickStat
                label="En seguimiento"
                value={snapshot.leads.filter((lead) => lead.status === "seguimiento").length.toString()}
              />
              <QuickStat
                label="Ganados"
                value={snapshot.leads.filter((lead) => lead.status === "cerrado_ganado").length.toString()}
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
