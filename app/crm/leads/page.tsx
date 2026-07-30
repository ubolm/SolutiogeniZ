import {
  FilePlus2,
  Gauge,
  RefreshCcw,
  Upload,
  UsersRound,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { CrmSurfaceCard } from "@/components/crm/CrmSurfaceCard";
import { LeadPipelineManager } from "@/components/crm/LeadPipelineManager";
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
    <div className="grid gap-7">
      <CrmPageIntro
        description="Entra al pipeline, mueve etapas y abre la ficha justa sin cargar la vista con formularios secundarios."
        eyebrow="Leads"
        stats={[
          { label: "Totales", value: snapshot.leads.length.toString() },
          {
            label: "Respondieron",
            value: snapshot.leads
              .filter((lead) => lead.status === "respondio")
              .length.toString(),
          },
          {
            label: "Reuniones",
            value: snapshot.leads
              .filter((lead) => lead.status === "reunion_agendada")
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

      <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <CrmSurfaceCard
          description="Lectura corta para entender en qué parte del pipeline estás parado antes de entrar a mover tarjetas."
          title="Estado rápido"
          action={
            <span className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/58 px-3 py-1.5 text-[0.8rem] font-semibold text-muted backdrop-blur-[10px]">
              <Gauge aria-hidden="true" size={14} />
              Resumen
            </span>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <QuickStat
              label="Contactados"
              value={snapshot.leads
                .filter((lead) => lead.status === "contactado")
                .length.toString()}
            />
            <QuickStat
              label="Respondieron"
              value={snapshot.leads
                .filter((lead) => lead.status === "respondio")
                .length.toString()}
            />
            <QuickStat
              label="Propuesta"
              value={snapshot.leads
                .filter((lead) => lead.status === "propuesta_enviada")
                .length.toString()}
            />
            <QuickStat
              label="Negociación"
              value={snapshot.leads
                .filter((lead) => lead.status === "negociacion")
                .length.toString()}
            />
          </div>
        </CrmSurfaceCard>

        {capabilities.canCreateManualLeads ? (
          <CrmSurfaceCard
            description="Acciones secundarias fuera del pipeline para no recargar la vista principal."
            title="Accesos"
            tone="muted"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ActionShortcut
                description="Carga un lead nuevo en una vista aparte."
                href="/crm/leads/nuevo"
                icon={<FilePlus2 aria-hidden="true" size={18} />}
                label="Alta manual"
              />
              <ActionShortcut
                description="Importa CSV o Google Sheets en una subpantalla."
                href="/crm/leads/importar"
                icon={<Upload aria-hidden="true" size={18} />}
                label="Importación"
              />
              <ActionShortcut
                description="Abre el espacio de trabajo para responsables."
                href="/crm/mi-trabajo"
                icon={<UsersRound aria-hidden="true" size={18} />}
                label="Mi trabajo"
              />
              {role === "admin" ? (
                <ActionShortcut
                  description="Herramientas de limpieza y control operativo."
                  href="/crm/leads/herramientas"
                  icon={<RefreshCcw aria-hidden="true" size={18} />}
                  label="Herramientas"
                />
              ) : null}
            </div>
          </CrmSurfaceCard>
        ) : null}
      </section>

      <CrmSurfaceCard
        description="El pipeline ocupa el foco principal para ver mejor la distribución de oportunidades y trabajar el seguimiento con más aire."
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
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.25rem] border border-white/75 bg-white/58 px-4 py-4 backdrop-blur-[10px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-heading text-[1.8rem] font-semibold text-ink">
        {value}
      </p>
    </article>
  );
}

function ActionShortcut({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      className="group rounded-[1.35rem] border border-white/75 bg-white/62 px-4 py-4 shadow-soft backdrop-blur-[10px] transition hover:-translate-y-0.5 hover:bg-white/72"
      href={href}
    >
      <div className="inline-flex rounded-full bg-[#eef2ff] p-2.5 text-primary-strong transition group-hover:scale-105">
        {icon}
      </div>
      <p className="mt-3 text-[0.98rem] font-semibold text-ink">{label}</p>
      <p className="mt-1.5 text-[0.88rem] leading-6 text-muted">{description}</p>
    </Link>
  );
}
