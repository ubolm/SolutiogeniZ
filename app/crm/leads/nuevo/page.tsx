import { cookies } from "next/headers";
import Link from "next/link";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { ManualLeadForm } from "@/components/crm/ManualLeadForm";
import {
  getCrmRoleCapabilities,
  getCrmSessionCookieName,
} from "@/lib/crm-auth";
import { verifyActiveCrmSessionToken } from "@/lib/crm-session";
import { getAssignableCrmUsers } from "@/lib/crm-users";

export const dynamic = "force-dynamic";

export default async function CrmNewLeadPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyActiveCrmSessionToken(token);
  const role = session?.role ?? "vendedor";
  const capabilities = getCrmRoleCapabilities(role);
  const ownerUsers = capabilities.canCreateManualLeads
    ? await getAssignableCrmUsers()
    : [];

  return (
    <div className="grid gap-7">
      <CrmPageIntro
        description="Carga un lead fuera del pipeline principal para no mezclar operación con alta inicial."
        eyebrow="Leads"
        stats={[
          { label: "Vista", value: "Alta" },
          { label: "Modo", value: "Manual" },
        ]}
        title="Alta manual"
      />

      <div className="flex items-center justify-end">
        <Link
          className="inline-flex rounded-full border border-white/75 bg-white/58 px-4 py-2 text-sm font-semibold text-ink backdrop-blur-[10px] transition hover:-translate-y-0.5"
          href="/crm/leads"
        >
          Volver al pipeline
        </Link>
      </div>

      {capabilities.canCreateManualLeads ? (
        <ManualLeadForm ownerOptions={ownerUsers.map((user) => user.username)} />
      ) : (
        <section className="rounded-[1.85rem] border border-white/70 bg-white/58 p-6 text-[0.98rem] text-muted shadow-soft backdrop-blur-[12px]">
          No tienes permiso para cargar leads manuales.
        </section>
      )}
    </div>
  );
}
