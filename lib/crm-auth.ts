const SESSION_COOKIE_NAME = "sgz_crm_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

export type CrmRole = "admin" | "vendedor";

export type CrmSessionPayload = {
  userId?: string;
  username: string;
  role: CrmRole;
  exp: number;
};

type CrmIdentity = {
  id?: string;
  username: string;
  role: CrmRole;
};

export type CrmRoleCapabilities = {
  canViewAdminDashboard: boolean;
  canViewOwnerWorkspace: boolean;
  canViewUsers: boolean;
  canCreateManualLeads: boolean;
  canEditLeadStatus: boolean;
  canScheduleLeadNextAction: boolean;
  canCreateLeadActivity: boolean;
  canCreateLeadTasks: boolean;
  canUpdateLeadTasks: boolean;
  canManageOwner: boolean;
  canManageInternalNotes: boolean;
  canViewAuditTrail: boolean;
  canViewExecutiveSummary: boolean;
};

function getConfig() {
  const secret = process.env.CRM_AUTH_SECRET?.trim() || "";

  if (!secret) {
    return null;
  }

  return {
    secret,
  };
}

export function isCrmEnvFallbackAllowed() {
  return process.env.CRM_AUTH_ALLOW_ENV_FALLBACK?.trim() === "true";
}

function toBase64Url(value: string | Uint8Array) {
  const buffer =
    typeof value === "string" ? Buffer.from(value, "utf8") : Buffer.from(value);

  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return Buffer.from(padded, "base64");
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return toBase64Url(new Uint8Array(signature));
}

export function isCrmAuthConfigured() {
  return getConfig() !== null;
}

export function getCrmSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getCrmSessionMaxAge() {
  return SESSION_DURATION_SECONDS;
}

export function resolveCrmIdentityFromEnv(
  username: string,
  password: string,
): CrmIdentity | null {
  const adminUsername = process.env.CRM_AUTH_USER?.trim() || "";
  const adminPassword = process.env.CRM_AUTH_PASSWORD?.trim() || "";
  const sellerUsername = process.env.CRM_SELLER_USER?.trim() || "";
  const sellerPassword = process.env.CRM_SELLER_PASSWORD?.trim() || "";

  if (!adminUsername || !adminPassword) {
    return null;
  }

  if (username === adminUsername && password === adminPassword) {
    return {
      username,
      role: "admin",
    };
  }

  if (
    sellerUsername &&
    sellerPassword &&
    username === sellerUsername &&
    password === sellerPassword
  ) {
    return {
      username,
      role: "vendedor",
    };
  }

  return null;
}

export function getDefaultCrmPathForRole(role: CrmRole) {
  return role === "admin" ? "/crm" : "/crm/leads";
}

export function getCrmRoleCapabilities(
  role: CrmRole,
): CrmRoleCapabilities {
  if (role === "admin") {
    return {
      canViewAdminDashboard: true,
      canViewOwnerWorkspace: true,
      canViewUsers: true,
      canCreateManualLeads: true,
      canEditLeadStatus: true,
      canScheduleLeadNextAction: true,
      canCreateLeadActivity: true,
      canCreateLeadTasks: true,
      canUpdateLeadTasks: true,
      canManageOwner: true,
      canManageInternalNotes: true,
      canViewAuditTrail: true,
      canViewExecutiveSummary: true,
    };
  }

  return {
    canViewAdminDashboard: false,
    canViewOwnerWorkspace: false,
    canViewUsers: false,
    canCreateManualLeads: false,
    canEditLeadStatus: true,
    canScheduleLeadNextAction: true,
    canCreateLeadActivity: true,
    canCreateLeadTasks: true,
    canUpdateLeadTasks: true,
    canManageOwner: false,
    canManageInternalNotes: false,
    canViewAuditTrail: false,
    canViewExecutiveSummary: false,
  };
}

export function getCrmAllowedPathPrefixes(role: CrmRole) {
  if (role === "admin") {
    return ["/crm", "/api/crm"];
  }

  return [
    "/crm/leads",
    "/crm/conversaciones",
    "/crm/tareas",
    "/crm/busqueda",
    "/api/crm/leads",
    "/api/crm/conversations",
  ];
}

export function canAccessCrmPath(role: CrmRole, pathname: string) {
  const allowedPrefixes = getCrmAllowedPathPrefixes(role);

  return allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolveCrmSafePathForRole(role: CrmRole, pathname: string) {
  if (canAccessCrmPath(role, pathname)) {
    return pathname;
  }

  return getDefaultCrmPathForRole(role);
}

export async function createCrmSessionToken(identity: CrmIdentity) {
  const config = getConfig();

  if (!config) {
    throw new Error("CRM auth is not configured.");
  }

  const payload: CrmSessionPayload = {
    userId: identity.id,
    username: identity.username,
    role: identity.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signValue(encodedPayload, config.secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifyCrmSessionToken(token: string | undefined | null) {
  const config = getConfig();

  if (!config || !token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signValue(encodedPayload, config.secret);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(encodedPayload).toString("utf8"),
    ) as CrmSessionPayload;

    if (!payload.username || !payload.exp || !payload.role) {
      return null;
    }

    if (payload.role !== "admin" && payload.role !== "vendedor") {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
