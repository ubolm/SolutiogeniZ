import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { CrmAppShell } from "@/components/crm/CrmAppShell";
import { getCrmSessionCookieName } from "@/lib/crm-auth";
import { verifyActiveCrmSessionToken } from "@/lib/crm-session";

export default async function CrmLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyActiveCrmSessionToken(token);

  return <CrmAppShell role={session?.role ?? null}>{children}</CrmAppShell>;
}
