import { CrmLoginForm } from "@/components/crm/CrmLoginForm";

export const dynamic = "force-dynamic";

export default function CrmLoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextPath =
    typeof searchParams?.next === "string" &&
    searchParams.next.startsWith("/crm")
      ? searchParams.next
      : "/crm";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1d2452_0%,#0b0d16_38%,#090b12_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.95fr_0.85fr]">
        <section className="rounded-[2rem] border border-white/12 bg-[linear-gradient(160deg,#11162a_0%,#151d37_38%,#1e2753_100%)] p-7 text-white shadow-[0_32px_100px_rgba(7,10,20,0.28)] sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
            SolutiogeniZ
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Acceso seguro al CRM
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/76 sm:text-base">
            Protegimos el CRM para que solo el equipo autorizado pueda entrar,
            revisar conversaciones, editar leads y registrar seguimiento.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoCard
              title="Proteccion activa"
              value="Login requerido"
              description="Las rutas del CRM y sus acciones ya no quedan abiertas por link."
            />
            <InfoCard
              title="Sesion"
              value="Cookie segura"
              description="El acceso queda validado por sesion privada en el navegador."
            />
          </div>
        </section>

        <CrmLoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-4 py-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {title}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
    </article>
  );
}
