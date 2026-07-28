import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LeadDetailWorkspace } from "@/components/crm/LeadDetailWorkspace";
import type { ChatbotLeadStatus } from "@/lib/chatbot";
import {
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";
import { getCrmLeadDetailForSession } from "@/lib/crm-store";
import { getAssignableCrmUsers } from "@/lib/crm-users";

export const dynamic = "force-dynamic";

const statusAccent: Record<ChatbotLeadStatus, string> = {
  contactado: "bg-[#effaf4] text-[#16794e] border-[#bde7cc]",
  respondio: "bg-[#eef4ff] text-[#2f5bea] border-[#c9d8ff]",
  reunion_agendada: "bg-[#fff7e9] text-[#b56a06] border-[#f3d39a]",
  propuesta_enviada: "bg-[#f6efff] text-[#6d3cc7] border-[#d5c0f7]",
  negociacion: "bg-[#fff0f0] text-[#c54646] border-[#f1b9b9]",
  cliente: "bg-[#ebfbf2] text-[#0b7a43] border-[#b7e7ca]",
  perdido: "bg-[#f2f4f7] text-[#5b6472] border-[#d8dde5]",
};

function getLeadStatusAccent(status: unknown) {
  if (
    typeof status === "string" &&
    Object.prototype.hasOwnProperty.call(statusAccent, status)
  ) {
    return statusAccent[status as ChatbotLeadStatus];
  }

  return statusAccent.contactado;
}

function formatLeadStatusLabel(status: unknown) {
  return typeof status === "string" ? status.replaceAll("_", " ") : "contactado";
}

export default async function CrmLeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyCrmSessionToken(token);
  const detail = await getCrmLeadDetailForSession(params.id, session);

  if (!detail) {
    notFound();
  }

  const { lead, activities, conversations, tasks } = detail;
  const ownerUsers =
    session?.role === "admin" ? await getAssignableCrmUsers() : [];
  const leadStatusAccent = getLeadStatusAccent(lead.status);
  const leadStatusLabel = formatLeadStatusLabel(lead.status);

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
      <div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-strong transition hover:opacity-80"
          href="/crm/leads"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Volver a leads
        </Link>
      </div>

      <section className="rounded-[2.15rem] border border-white/18 bg-[linear-gradient(135deg,rgba(16,22,47,0.92),rgba(68,84,245,0.78))] p-6 text-white shadow-[0_24px_80px_rgba(16,22,47,0.24)] backdrop-blur-[14px] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              Ficha del lead
            </p>
            <h1 className="font-heading mt-3 text-[2.35rem] font-semibold md:text-[3rem]">
              {lead.company}
            </h1>
            <p className="mt-2 text-[0.98rem] text-white/80 md:text-[1.08rem]">
              {lead.name}
            </p>
            <p className="mt-4 max-w-4xl text-[1rem] leading-7 text-white/78 md:text-[1.08rem]">
              {lead.summary}
            </p>
          </div>

          <span
            className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${leadStatusAccent}`}
          >
            {leadStatusLabel}
          </span>
        </div>
      </section>

      <LeadDetailWorkspace
        activities={activities}
        conversations={conversations}
        lead={lead}
        ownerOptions={ownerUsers.map((user) => user.username)}
        role={session?.role ?? "vendedor"}
        tasks={tasks}
      />
    </div>
  );
}
