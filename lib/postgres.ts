import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __sgzPostgresPool: Pool | undefined;
}

function getConnectionString() {
  return (
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    ""
  );
}

export function isPostgresConfigured() {
  return Boolean(getConnectionString());
}

export function getPostgresPool() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error("Postgres is not configured.");
  }

  if (!globalThis.__sgzPostgresPool) {
    globalThis.__sgzPostgresPool = new Pool({
      connectionString,
      ssl:
        process.env.POSTGRES_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  return globalThis.__sgzPostgresPool;
}

export async function pgQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return getPostgresPool().query<T>(text, values);
}

export async function withPgTransaction<T>(
  handler: (client: PoolClient) => Promise<T>,
) {
  const client = await getPostgresPool().connect();

  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function pgTxQuery<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient,
  text: string,
  values: unknown[] = [],
) {
  return client.query<T>(text, values);
}

export type PgQueryResult<T extends QueryResultRow = QueryResultRow> =
  QueryResult<T>;
export type PgClient = PoolClient;
