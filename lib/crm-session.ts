import {
  getCrmSessionCookieName,
  verifyCrmSessionToken,
  type CrmSessionPayload,
} from "@/lib/crm-auth";
import { getActiveCrmIdentityByUsername } from "@/lib/crm-users";

export function getCrmTokenFromCookieHeader(cookieHeader: string | null) {
  return cookieHeader
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${getCrmSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export async function verifyActiveCrmSessionToken(
  token: string | undefined | null,
): Promise<CrmSessionPayload | null> {
  const session = await verifyCrmSessionToken(token);

  if (!session) {
    return null;
  }

  const activeIdentity = await getActiveCrmIdentityByUsername(session.username);

  if (!activeIdentity) {
    return null;
  }

  return {
    ...session,
    userId: activeIdentity.id,
    username: activeIdentity.username,
    role: activeIdentity.role,
  };
}
