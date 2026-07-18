import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LeadDetailWorkspace } from "@/components/crm/LeadDetailWorkspace";
import { getCrmLeadDetail } from "@/lib/crm-store";

const statusAccent = {
  nuevo: "bg-[#eef4ff] text-[#2f5bea] border-[#c9d8ff]",
  contactado: "bg-[#effaf4] text-[#16794e] border-[#bde7cc]",
  calificado: "bg-[#fff7e9] text-[#b56a06] border-[#f3d39a]",
  propuesta: "bg-[#f6efff] text-[#6d3cc7] border-[#d5c0f7]",
  seguimiento: "bg-[#fff0f0] text-[#c54646] border-[#f1b9b9]",
  cerrado_ganado: "bg-[#ebfbf2] text-[#0b7a43] border-[#b7e7ca]",
  cerrado_perdido: "bg-[#f2f4f7] text-[#5b6472] border-[#d8dde5]",
} as const;

export default async function CrmLeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const detail = await getCrmLeadDetail(params.id);

  if (!detail) {
    notFound();
  }

  const { lead, activities, conversations, tasks } = detail;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-strong transition hover:opacity-80"
          href="/crm/leads"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Volver a leads
        </Link>
      </div>

      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#10162f,#4454f5)] p-6 text-white shadow-[0_24px_80px_rgba(16,22,47,0.24)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              Ficha del lead
            </p>
            <h1 className="font-heading mt-3 text-3xl font-semibold md:text-4xl">
              {lead.company}
            </h1>
            <p className="mt-2 text-sm text-white/80 md:text-base">
              {lead.name}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/78 md:text-base">
              {lead.summary}
            </p>
          </div>

          <span
            className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${statusAccent[lead.status]}`}
          >
            {lead.status.replace("_", " ")}
          </span>
        </div>
      </section>

      <LeadDetailWorkspace
        activities={activities}
        conversations={conversations}
        lead={lead}
        tasks={tasks}
      />
    </div>
  );
}
