import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { CrmUsersPanel } from "@/components/crm/CrmUsersPanel";
import {
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";
import { getCrmUsers } from "@/lib/crm-users";

export const dynamic = "force-dynamic";

export default async function CrmUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyCrmSessionToken(token);

  if (!session) {
    redirect("/crm/login?next=%2Fcrm%2Fusuarios");
  }

  if (session.role !== "admin") {
    redirect("/crm/leads");
  }

  const users = await getCrmUsers();
  const activeCount = users.filter((user) => user.isActive).length;
  const vendorCount = users.filter((user) => user.role === "vendedor").length;
  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <div className="grid gap-6">
      <CrmPageIntro
        eyebrow="Usuarios CRM"
        title="Accesos y roles"
        description="Gestiona quien entra al CRM y que nivel de visibilidad tiene cada persona."
        stats={[
          { label: "Usuarios", value: users.length.toString() },
          { label: "Activos", value: activeCount.toString() },
          { label: "Admins", value: adminCount.toString() },
          { label: "Vendedores", value: vendorCount.toString() },
        ]}
      />

      <CrmUsersPanel initialUsers={users} />
    </div>
  );
}
