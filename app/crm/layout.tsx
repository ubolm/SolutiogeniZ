import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { CrmAppShell } from "@/components/crm/CrmAppShell";
import {
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";

export default async function CrmLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyCrmSessionToken(token);

  return <CrmAppShell role={session?.role ?? null}>{children}</CrmAppShell>;
}
