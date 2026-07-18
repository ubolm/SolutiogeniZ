const SESSION_COOKIE_NAME = "sgz_crm_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

type CrmSessionPayload = {
  username: string;
  exp: number;
};

function getConfig() {
  const username = process.env.CRM_AUTH_USER?.trim() || "";
  const password = process.env.CRM_AUTH_PASSWORD?.trim() || "";
  const secret = process.env.CRM_AUTH_SECRET?.trim() || "";

  if (!username || !password || !secret) {
    return null;
  }

  return { username, password, secret };
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

export function isValidCrmCredentials(username: string, password: string) {
  const config = getConfig();

  if (!config) {
    return false;
  }

  return username === config.username && password === config.password;
}

export async function createCrmSessionToken(username: string) {
  const config = getConfig();

  if (!config) {
    throw new Error("CRM auth is not configured.");
  }

  const payload: CrmSessionPayload = {
    username,
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

    if (!payload.username || !payload.exp) {
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
