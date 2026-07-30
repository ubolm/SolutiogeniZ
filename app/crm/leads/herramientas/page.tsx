import { cookies } from "next/headers";
import Link from "next/link";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { CrmResetDataCard } from "@/components/crm/CrmResetDataCard";
import {
  getCrmRoleCapabilities,
  getCrmSessionCookieName,
} from "@/lib/crm-auth";
import { verifyActiveCrmSessionToken } from "@/lib/crm-session";

export const dynamic = "force-dynamic";

export default async function CrmLeadToolsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyActiveCrmSessionToken(token);
  const role = session?.role ?? "vendedor";
  const capabilities = getCrmRoleCapabilities(role);

  return (
    <div className="grid gap-7">
      <CrmPageIntro
        description="Separa las acciones de mantenimiento de la operación diaria para que el pipeline quede limpio."
        eyebrow="Leads"
        stats={[
          { label: "Vista", value: "Herramientas" },
          { label: "Acceso", value: role === "admin" ? "Admin" : "Restringido" },
        ]}
        title="Herramientas operativas"
      />

      <div className="flex items-center justify-end">
        <Link
          className="inline-flex rounded-full border border-white/75 bg-white/58 px-4 py-2 text-sm font-semibold text-ink backdrop-blur-[10px] transition hover:-translate-y-0.5"
          href="/crm/leads"
        >
          Volver al pipeline
        </Link>
      </div>

      {capabilities.canViewUsers ? (
        <CrmResetDataCard />
      ) : (
        <section className="rounded-[1.85rem] border border-white/70 bg-white/58 p-6 text-[0.98rem] text-muted shadow-soft backdrop-blur-[12px]">
          Esta vista es solo para administradores.
        </section>
      )}
    </div>
  );
}
