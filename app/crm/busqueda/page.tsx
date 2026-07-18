import Link from "next/link";
import { Search, MessageSquareMore, ListTodo, Building2 } from "lucide-react";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { CrmSurfaceCard } from "@/components/crm/CrmSurfaceCard";
import { searchCrm } from "@/lib/crm-store";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function CrmSearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q?.trim() || "";
  const results = await searchCrm(query);
  const totalResults =
    results.leads.length + results.tasks.length + results.conversations.length;

  return (
    <div className="grid gap-8">
      <CrmPageIntro
        eyebrow="Busqueda global"
        title={query ? `Resultados para "${query}"` : "Busca en todo el CRM"}
        description={
          query
            ? "Reunimos coincidencias de leads, tareas y conversaciones para que encuentres contexto rapido y sigas trabajando sin perder tiempo."
            : "Usa el buscador superior para encontrar empresas, contactos, tareas, telefonos, notas o conversaciones dentro del CRM."
        }
        stats={[
          {
            label: "Resultados",
            value: totalResults.toString(),
          },
          {
            label: "Leads",
            value: results.leads.length.toString(),
          },
          {
            label: "Tareas",
            value: results.tasks.length.toString(),
          },
          {
            label: "Conversaciones",
            value: results.conversations.length.toString(),
          },
        ]}
      />

      {!query ? (
        <CrmSurfaceCard
          title="Escribe algo para empezar"
          description="Por ejemplo: nombre de empresa, email, telefono, responsable o una palabra clave del seguimiento."
        >
          <div className="flex min-h-48 items-center justify-center rounded-[1.6rem] border border-dashed border-[#d8def4] bg-[#f8faff] p-8 text-center">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2ff] text-primary-strong">
                <Search size={24} />
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">
                El buscador recorre leads, tareas y conversaciones al mismo tiempo.
              </p>
            </div>
          </div>
        </CrmSurfaceCard>
      ) : null}

      {query && totalResults === 0 ? (
        <CrmSurfaceCard
          title="No encontramos coincidencias"
          description="Prueba con otra palabra, un telefono, parte del email o el nombre de la empresa."
        >
          <div className="rounded-[1.6rem] border border-dashed border-[#d8def4] bg-[#f8faff] p-8 text-sm leading-7 text-muted">
            No hay resultados para <span className="font-semibold text-ink">{query}</span>.
          </div>
        </CrmSurfaceCard>
      ) : null}

      {results.leads.length > 0 ? (
        <CrmSurfaceCard
          title="Leads"
          description="Coincidencias dentro de contactos y oportunidades comerciales."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {results.leads.map((lead) => (
              <article
                className="rounded-[1.6rem] border border-line bg-[#fbfcff] p-5 shadow-soft"
                key={lead.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">
                      {lead.status}
                    </p>
                    <h3 className="mt-2 font-heading text-2xl font-semibold text-ink">
                      {lead.company}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{lead.name || "Sin contacto"}</p>
                  </div>
                  <span className="rounded-full border border-[#dce4ff] bg-white px-3 py-1 text-xs font-semibold text-[#4454f5]">
                    {lead.source}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-muted">
                  <p>
                    <span className="font-semibold text-ink">Coincidio por:</span>{" "}
                    {lead.matchReason}
                  </p>
                  <p>{lead.summary}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center rounded-full bg-[#4454f5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3242db]"
                    href={`/crm/leads/${lead.id}`}
                  >
                    Abrir lead
                  </Link>
                  <Link
                    className="inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-[#cfd8ff] hover:bg-[#f5f7ff]"
                    href="/crm/leads"
                  >
                    Ver pipeline
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </CrmSurfaceCard>
      ) : null}

      {results.tasks.length > 0 ? (
        <CrmSurfaceCard
          title="Tareas"
          description="Acciones operativas relacionadas con lo que buscaste."
        >
          <div className="grid gap-4">
            {results.tasks.map((task) => (
              <article
                className="rounded-[1.6rem] border border-line bg-white p-5 shadow-soft"
                key={task.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-primary-strong">
                      <ListTodo size={18} />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-semibold text-ink">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {task.lead?.company || "Lead sin empresa"} • vence{" "}
                        {formatDate(task.dueAt)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#e5e7f2] bg-[#f8f9fc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    {task.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-muted">
                  <p>
                    <span className="font-semibold text-ink">Coincidio por:</span>{" "}
                    {task.matchReason}
                  </p>
                  <p>
                    Tipo: <span className="font-semibold text-ink">{task.type}</span>
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center rounded-full bg-[#11162a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d2440]"
                    href="/crm/tareas"
                  >
                    Ver bandeja de tareas
                  </Link>
                  {task.lead ? (
                    <Link
                      className="inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-[#cfd8ff] hover:bg-[#f5f7ff]"
                      href={`/crm/leads/${task.lead.id}`}
                    >
                      Abrir lead relacionado
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </CrmSurfaceCard>
      ) : null}

      {results.conversations.length > 0 ? (
        <CrmSurfaceCard
          title="Conversaciones"
          description="Interacciones recientes detectadas por web o WhatsApp."
        >
          <div className="grid gap-4">
            {results.conversations.map((conversation) => (
              <article
                className="rounded-[1.6rem] border border-line bg-white p-5 shadow-soft"
                key={conversation.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef7ff] text-[#1a73e8]">
                      <MessageSquareMore size={18} />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-semibold text-ink">
                        {conversation.lead?.company || "Conversacion sin empresa"}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {conversation.lead?.name || "Sin contacto"} •{" "}
                        {conversation.channel} • ultima actividad{" "}
                        {formatDate(conversation.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#dce4ff] bg-[#f7f9ff] px-3 py-1 text-xs font-semibold text-[#4454f5]">
                    {conversation.detectedIntent}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-muted">
                  <p>
                    <span className="font-semibold text-ink">Coincidio por:</span>{" "}
                    {conversation.matchReason}
                  </p>
                  <p className="line-clamp-3">{conversation.transcriptSummary}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center rounded-full bg-[#11162a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d2440]"
                    href="/crm/conversaciones"
                  >
                    Ver conversaciones
                  </Link>
                  {conversation.lead ? (
                    <Link
                      className="inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-[#cfd8ff] hover:bg-[#f5f7ff]"
                      href={`/crm/leads/${conversation.lead.id}`}
                    >
                      Abrir lead relacionado
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </CrmSurfaceCard>
      ) : null}

      {query && totalResults > 0 ? (
        <CrmSurfaceCard
          title="Siguiente paso sugerido"
          description="Usa estos accesos rapidos para seguir trabajando segun el tipo de hallazgo."
          tone="muted"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              className="rounded-[1.6rem] border border-white/70 bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[#d6ddff]"
              href="/crm/leads"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-primary-strong">
                <Building2 size={18} />
              </div>
              <p className="mt-4 font-semibold text-ink">Ir al pipeline</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Para mover oportunidades o actualizar responsables.
              </p>
            </Link>
            <Link
              className="rounded-[1.6rem] border border-white/70 bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[#d6ddff]"
              href="/crm/tareas"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3e8] text-[#d97706]">
                <ListTodo size={18} />
              </div>
              <p className="mt-4 font-semibold text-ink">Ir a tareas</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Para ejecutar seguimiento operativo y cerrar pendientes.
              </p>
            </Link>
            <Link
              className="rounded-[1.6rem] border border-white/70 bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[#d6ddff]"
              href="/crm/conversaciones"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef7ff] text-[#1a73e8]">
                <MessageSquareMore size={18} />
              </div>
              <p className="mt-4 font-semibold text-ink">Ir a conversaciones</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Para revisar contexto antes de responder o llamar.
              </p>
            </Link>
          </div>
        </CrmSurfaceCard>
      ) : null}
    </div>
  );
}
