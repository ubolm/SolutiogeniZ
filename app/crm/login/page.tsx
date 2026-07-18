import { ShieldCheck } from "lucide-react";

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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1b2250_0%,#0d1020_42%,#090b12_100%)] px-4 py-10">
      <div className="w-full max-w-md">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(245,248,255,0.94)_100%)] p-6 shadow-[0_30px_90px_rgba(8,10,18,0.26)] sm:p-8">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#eef1ff] text-[#4454f5]">
            <ShieldCheck aria-hidden="true" size={24} />
          </div>
          <div className="mt-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4454f5]">
              SolutiogeniZ
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-ink">
              Acceso al CRM
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Ingresá con tus credenciales para continuar.
            </p>
          </div>

          <div className="mt-6">
            <CrmLoginForm nextPath={nextPath} />
          </div>
        </section>
      </div>
    </main>
  );
}
