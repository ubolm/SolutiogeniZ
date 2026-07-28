import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

import { isPostgresConfigured, pgQuery } from "@/lib/postgres";
import type { CrmRole } from "@/lib/crm-auth";

type CrmUserRow = {
  id: string;
  username: string;
  password_hash: string;
  role: CrmRole;
  is_active: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
};

export type CrmUserIdentity = {
  id?: string;
  username: string;
  role: CrmRole;
};

export type CrmUserSummary = {
  id: string;
  username: string;
  role: CrmRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

let ensureCrmUsersPromise: Promise<void> | null = null;

function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");

  if (stored.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(stored, derived);
}

function getLegacySeedUsers() {
  const adminUsername = process.env.CRM_AUTH_USER?.trim() || "";
  const adminPassword = process.env.CRM_AUTH_PASSWORD?.trim() || "";
  const sellerUsername = process.env.CRM_SELLER_USER?.trim() || "";
  const sellerPassword = process.env.CRM_SELLER_PASSWORD?.trim() || "";

  const users: Array<{ username: string; password: string; role: CrmRole }> = [];

  if (adminUsername && adminPassword) {
    users.push({
      username: adminUsername,
      password: adminPassword,
      role: "admin",
    });
  }

  if (sellerUsername && sellerPassword) {
    users.push({
      username: sellerUsername,
      password: sellerPassword,
      role: "vendedor",
    });
  }

  return users;
}

function toIsoString(value: string | Date | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
}

function mapCrmUser(row: CrmUserRow): CrmUserSummary {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    isActive: row.is_active,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export async function ensureCrmUsersSchema() {
  if (!isPostgresConfigured()) {
    return;
  }

  if (!ensureCrmUsersPromise) {
    ensureCrmUsersPromise = (async () => {
      await pgQuery(`
        CREATE TABLE IF NOT EXISTS crm_users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pgQuery(
        "CREATE INDEX IF NOT EXISTS crm_users_username_idx ON crm_users (username);",
      );

      const countResult = await pgQuery<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM crm_users",
      );
      const usersCount = Number(countResult.rows[0]?.count || "0");

      if (usersCount > 0) {
        return;
      }

      const seedUsers = getLegacySeedUsers();

      for (const seedUser of seedUsers) {
        await pgQuery(
          `
            INSERT INTO crm_users (
              id,
              username,
              password_hash,
              role,
              is_active
            ) VALUES ($1, $2, $3, $4, TRUE)
            ON CONFLICT (username) DO NOTHING
          `,
          [
            `user_${randomBytes(6).toString("hex")}`,
            seedUser.username,
            createPasswordHash(seedUser.password),
            seedUser.role,
          ],
        );
      }
    })();
  }

  return ensureCrmUsersPromise;
}

export async function resolveCrmIdentityFromDatabase(
  username: string,
  password: string,
) {
  if (!isPostgresConfigured()) {
    return null;
  }

  await ensureCrmUsersSchema();

  const result = await pgQuery<CrmUserRow>(
    `
      SELECT id, username, password_hash, role, is_active
      FROM crm_users
      WHERE username = $1
      LIMIT 1
    `,
    [username],
  );

  const user = result.rows[0];

  if (!user || !user.is_active) {
    return null;
  }

  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  } satisfies CrmUserIdentity;
}

export async function getCrmUsers() {
  if (!isPostgresConfigured()) {
    return [];
  }

  await ensureCrmUsersSchema();

  const result = await pgQuery<CrmUserRow>(
    `
      SELECT id, username, password_hash, role, is_active, created_at, updated_at
      FROM crm_users
      ORDER BY created_at ASC, username ASC
    `,
  );

  return result.rows.map(mapCrmUser);
}

export async function getAssignableCrmUsers() {
  const users = await getCrmUsers();
  return users.filter((user) => user.isActive);
}

export async function createCrmUser(input: {
  username: string;
  password: string;
  role: CrmRole;
}) {
  if (!isPostgresConfigured()) {
    throw new Error("Postgres is not configured.");
  }

  await ensureCrmUsersSchema();

  const username = input.username.trim().toLowerCase();
  const password = input.password.trim();

  if (username.length < 3) {
    throw new Error("El usuario debe tener al menos 3 caracteres.");
  }

  if (password.length < 8) {
    throw new Error("La clave debe tener al menos 8 caracteres.");
  }

  const existing = await pgQuery<{ id: string }>(
    "SELECT id FROM crm_users WHERE username = $1 LIMIT 1",
    [username],
  );

  if (existing.rows[0]) {
    throw new Error("Ese usuario ya existe.");
  }

  const result = await pgQuery<CrmUserRow>(
    `
      INSERT INTO crm_users (
        id,
        username,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
      RETURNING id, username, password_hash, role, is_active, created_at, updated_at
    `,
    [
      `user_${randomBytes(6).toString("hex")}`,
      username,
      createPasswordHash(password),
      input.role,
    ],
  );

  return mapCrmUser(result.rows[0]);
}

export async function updateCrmUser(
  id: string,
  updates: {
    role?: CrmRole;
    isActive?: boolean;
    password?: string;
  },
) {
  if (!isPostgresConfigured()) {
    throw new Error("Postgres is not configured.");
  }

  await ensureCrmUsersSchema();

  const currentResult = await pgQuery<CrmUserRow>(
    `
      SELECT id, username, password_hash, role, is_active, created_at, updated_at
      FROM crm_users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  const current = currentResult.rows[0];

  if (!current) {
    throw new Error("Usuario no encontrado.");
  }

  const nextRole = updates.role ?? current.role;
  const nextIsActive =
    typeof updates.isActive === "boolean" ? updates.isActive : current.is_active;

  let nextPasswordHash = current.password_hash;

  if (typeof updates.password === "string" && updates.password.trim()) {
    if (updates.password.trim().length < 8) {
      throw new Error("La clave debe tener al menos 8 caracteres.");
    }

    nextPasswordHash = createPasswordHash(updates.password.trim());
  }

  const result = await pgQuery<CrmUserRow>(
    `
      UPDATE crm_users
      SET
        password_hash = $2,
        role = $3,
        is_active = $4,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, password_hash, role, is_active, created_at, updated_at
    `,
    [id, nextPasswordHash, nextRole, nextIsActive],
  );

  return mapCrmUser(result.rows[0]);
}
