import { randomUUID } from "crypto";

import type {
  ChatbotIntent,
  ChatbotLeadInterest,
  ChatbotLeadStatus,
  ChatbotSource,
} from "@/lib/chatbot";
import type { ChatbotLeadFormState } from "@/lib/chatbot-lead";
import {
  getCrmSnapshot as getFileSnapshot,
  type CrmActivity,
  type CrmConversation,
  type CrmLead,
  type CrmTask,
} from "@/lib/crm-store-file";
import {
  isPostgresConfigured,
  pgQuery,
  pgTxQuery,
  withPgTransaction,
  type PgClient,
} from "@/lib/postgres";

type ChatTranscriptMessage = {
  role: "assistant" | "user";
  content: string;
};

type PersistChatbotLeadInput = {
  lead: ChatbotLeadFormState;
  transcript: ChatTranscriptMessage[];
  intent?: ChatbotIntent;
  detectedInterest?: ChatbotLeadInterest | "";
  sessionId?: string;
};

type PersistWebChatMessageInput = {
  sessionId: string;
  message: string;
  reply?: string;
  detectedInterest?: ChatbotLeadInterest | "";
  intent?: ChatbotIntent;
};

type CreateManualLeadInput = {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  interest?: ChatbotLeadInterest | "sin-definir";
  summary: string;
  owner?: string;
  notes?: string;
};

type UpdateCrmLeadInput = {
  id: string;
  status?: ChatbotLeadStatus;
  owner?: string;
  nextActionAt?: string;
  notes?: string;
};

type CreateCrmLeadActivityInput = {
  leadId: string;
  description: string;
  kind?: "note" | "contact";
  nextActionAt?: string;
};

type CreateCrmTaskInput = {
  leadId: string;
  title: string;
  type: CrmTask["type"];
  dueAt: string;
};

type UpdateCrmTaskInput = {
  leadId: string;
  taskId: string;
  status: CrmTask["status"];
};

type PersistWhatsAppMessageInput = {
  from: string;
  contactName?: string;
  message: string;
  reply?: string;
  detectedInterest?: ChatbotLeadInterest | "";
  intent?: ChatbotIntent;
};

type LeadRow = {
  id: string;
  created_at: string | Date;
  updated_at: string | Date;
  source: string;
  source_detail: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  interest: string;
  summary: string;
  priority: string;
  status: string;
  owner: string;
  last_contact_at: string | Date;
  next_action_at: string | Date;
  notes: string;
};

type ConversationRow = {
  id: string;
  lead_id: string;
  channel: string;
  started_at: string | Date;
  last_message_at: string | Date;
  transcript_summary: string;
  handoff_requested: boolean;
  detected_intent: string;
};

type ActivityRow = {
  id: string;
  lead_id: string;
  type: string;
  description: string;
  created_at: string | Date;
  created_by: string;
};

type TaskRow = {
  id: string;
  lead_id: string;
  title: string;
  type: string;
  due_at: string | Date;
  status: string;
  created_at: string | Date;
  completed_at: string | Date | null;
};

let ensureSchemaPromise: Promise<void> | null = null;

function createId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

function toIsoString(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

function buildSummary(lead: ChatbotLeadFormState) {
  return [
    `Interes: ${lead.interest || "sin-definir"}`,
    `Proceso actual: ${lead.currentProcess}`,
    `Problema principal: ${lead.mainProblem}`,
  ].join(" | ");
}

function buildTranscriptSummary(messages: ChatTranscriptMessage[]) {
  if (messages.length === 0) {
    return "No se registro transcripcion inicial.";
  }

  return messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "Cliente" : "Bot"}: ${message.content}`)
    .join(" || ");
}

function mapLead(row: LeadRow): CrmLead {
  return {
    id: row.id,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    source: row.source as ChatbotSource,
    sourceDetail: "chatbot",
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    interest: row.interest as ChatbotLeadInterest | "sin-definir",
    summary: row.summary,
    priority: "media",
    status: row.status as ChatbotLeadStatus,
    owner: row.owner,
    lastContactAt: toIsoString(row.last_contact_at),
    nextActionAt: toIsoString(row.next_action_at),
    notes: row.notes,
  };
}

function mapConversation(row: ConversationRow): CrmConversation {
  return {
    id: row.id,
    leadId: row.lead_id,
    channel: row.channel as ChatbotSource,
    startedAt: toIsoString(row.started_at),
    lastMessageAt: toIsoString(row.last_message_at),
    transcriptSummary: row.transcript_summary,
    handoffRequested: row.handoff_requested,
    detectedIntent: row.detected_intent as ChatbotIntent | "consulta_general",
  };
}

function mapActivity(row: ActivityRow): CrmActivity {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type as CrmActivity["type"],
    description: row.description,
    createdAt: toIsoString(row.created_at),
    createdBy: "chatbot",
  };
}

function mapTask(row: TaskRow): CrmTask {
  return {
    id: row.id,
    leadId: row.lead_id,
    title: row.title,
    type: row.type as CrmTask["type"],
    dueAt: toIsoString(row.due_at),
    status: row.status as CrmTask["status"],
    createdAt: toIsoString(row.created_at),
    completedAt: row.completed_at ? toIsoString(row.completed_at) : undefined,
  };
}

async function ensureCrmSchema() {
  if (!isPostgresConfigured()) {
    throw new Error("Postgres is not configured for CRM.");
  }

  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      await pgQuery(`
        CREATE TABLE IF NOT EXISTS crm_leads (
          id TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          source TEXT NOT NULL,
          source_detail TEXT NOT NULL,
          name TEXT NOT NULL,
          company TEXT NOT NULL,
          email TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          interest TEXT NOT NULL,
          summary TEXT NOT NULL,
          priority TEXT NOT NULL,
          status TEXT NOT NULL,
          owner TEXT NOT NULL,
          last_contact_at TIMESTAMPTZ NOT NULL,
          next_action_at TIMESTAMPTZ NOT NULL,
          notes TEXT NOT NULL DEFAULT ''
        );
      `);

      await pgQuery(`
        CREATE TABLE IF NOT EXISTS crm_conversations (
          id TEXT PRIMARY KEY,
          lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
          channel TEXT NOT NULL,
          started_at TIMESTAMPTZ NOT NULL,
          last_message_at TIMESTAMPTZ NOT NULL,
          transcript_summary TEXT NOT NULL,
          handoff_requested BOOLEAN NOT NULL DEFAULT FALSE,
          detected_intent TEXT NOT NULL
        );
      `);

      await pgQuery(`
        CREATE TABLE IF NOT EXISTS crm_activities (
          id TEXT PRIMARY KEY,
          lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          created_by TEXT NOT NULL
        );
      `);

      await pgQuery(`
        CREATE TABLE IF NOT EXISTS crm_tasks (
          id TEXT PRIMARY KEY,
          lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          due_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          completed_at TIMESTAMPTZ
        );
      `);

      await pgQuery(
        "CREATE INDEX IF NOT EXISTS crm_leads_status_idx ON crm_leads (status);",
      );
      await pgQuery(
        "CREATE INDEX IF NOT EXISTS crm_leads_phone_idx ON crm_leads (phone);",
      );
      await pgQuery(
        "CREATE INDEX IF NOT EXISTS crm_conversations_lead_idx ON crm_conversations (lead_id, channel);",
      );
      await pgQuery(
        "CREATE INDEX IF NOT EXISTS crm_activities_lead_idx ON crm_activities (lead_id, created_at DESC);",
      );
      await pgQuery(
        "CREATE INDEX IF NOT EXISTS crm_tasks_lead_idx ON crm_tasks (lead_id, due_at ASC);",
      );

      const rowCountResult = await pgQuery<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM crm_leads",
      );
      const leadCount = Number(rowCountResult.rows[0]?.count || "0");

      if (leadCount === 0) {
        const fallback = await getFileSnapshot();

        if (fallback.leads.length > 0) {
          await withPgTransaction(async (client) => {
            for (const lead of fallback.leads) {
              await insertLead(client, lead);
            }

            for (const conversation of fallback.conversations) {
              await insertConversation(client, conversation);
            }

            for (const activity of fallback.activities) {
              await insertActivity(client, activity);
            }

            for (const task of fallback.tasks) {
              await insertTask(client, task);
            }
          });
        }
      }
    })();
  }

  return ensureSchemaPromise;
}

async function insertLead(client: PgClient, lead: CrmLead) {
  await pgTxQuery(
    client,
    `
      INSERT INTO crm_leads (
        id, created_at, updated_at, source, source_detail, name, company, email,
        phone, interest, summary, priority, status, owner, last_contact_at,
        next_action_at, notes
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,
        $16,$17
      )
    `,
    [
      lead.id,
      lead.createdAt,
      lead.updatedAt,
      lead.source,
      lead.sourceDetail,
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      lead.interest,
      lead.summary,
      lead.priority,
      lead.status,
      lead.owner,
      lead.lastContactAt,
      lead.nextActionAt,
      lead.notes,
    ],
  );
}

async function insertConversation(client: PgClient, conversation: CrmConversation) {
  await pgTxQuery(
    client,
    `
      INSERT INTO crm_conversations (
        id, lead_id, channel, started_at, last_message_at, transcript_summary,
        handoff_requested, detected_intent
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      conversation.id,
      conversation.leadId,
      conversation.channel,
      conversation.startedAt,
      conversation.lastMessageAt,
      conversation.transcriptSummary,
      conversation.handoffRequested,
      conversation.detectedIntent,
    ],
  );
}

async function insertActivity(client: PgClient, activity: CrmActivity) {
  await pgTxQuery(
    client,
    `
      INSERT INTO crm_activities (
        id, lead_id, type, description, created_at, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6)
    `,
    [
      activity.id,
      activity.leadId,
      activity.type,
      activity.description,
      activity.createdAt,
      activity.createdBy,
    ],
  );
}

async function insertTask(client: PgClient, task: CrmTask) {
  await pgTxQuery(
    client,
    `
      INSERT INTO crm_tasks (
        id, lead_id, title, type, due_at, status, created_at, completed_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      task.id,
      task.leadId,
      task.title,
      task.type,
      task.dueAt,
      task.status,
      task.createdAt,
      task.completedAt ?? null,
    ],
  );
}

async function getLeadById(client: PgClient, id: string) {
  const result = await pgTxQuery<LeadRow>(
    client,
    "SELECT * FROM crm_leads WHERE id = $1 LIMIT 1",
    [id],
  );

  return result.rows[0] ? mapLead(result.rows[0]) : null;
}

async function getLeadByPhone(client: PgClient, phone: string) {
  const result = await pgTxQuery<LeadRow>(
    client,
    "SELECT * FROM crm_leads WHERE phone = $1 LIMIT 1",
    [phone],
  );

  return result.rows[0] ? mapLead(result.rows[0]) : null;
}

async function getWebLeadBySession(client: PgClient, sessionKey: string) {
  const result = await pgTxQuery<LeadRow>(
    client,
    "SELECT * FROM crm_leads WHERE source = 'web' AND phone = $1 LIMIT 1",
    [sessionKey],
  );

  return result.rows[0] ? mapLead(result.rows[0]) : null;
}

async function getConversationByLeadChannel(
  client: PgClient,
  leadId: string,
  channel: ChatbotSource,
) {
  const result = await pgTxQuery<ConversationRow>(
    client,
    "SELECT * FROM crm_conversations WHERE lead_id = $1 AND channel = $2 LIMIT 1",
    [leadId, channel],
  );

  return result.rows[0] ? mapConversation(result.rows[0]) : null;
}

async function updateLeadRecord(client: PgClient, lead: CrmLead) {
  await pgTxQuery(
    client,
    `
      UPDATE crm_leads
      SET
        updated_at = $2,
        source = $3,
        source_detail = $4,
        name = $5,
        company = $6,
        email = $7,
        phone = $8,
        interest = $9,
        summary = $10,
        priority = $11,
        status = $12,
        owner = $13,
        last_contact_at = $14,
        next_action_at = $15,
        notes = $16
      WHERE id = $1
    `,
    [
      lead.id,
      lead.updatedAt,
      lead.source,
      lead.sourceDetail,
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      lead.interest,
      lead.summary,
      lead.priority,
      lead.status,
      lead.owner,
      lead.lastContactAt,
      lead.nextActionAt,
      lead.notes,
    ],
  );
}

async function upsertConversationRecord(client: PgClient, conversation: CrmConversation) {
  await pgTxQuery(
    client,
    `
      INSERT INTO crm_conversations (
        id, lead_id, channel, started_at, last_message_at, transcript_summary,
        handoff_requested, detected_intent
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO UPDATE SET
        last_message_at = EXCLUDED.last_message_at,
        transcript_summary = EXCLUDED.transcript_summary,
        handoff_requested = EXCLUDED.handoff_requested,
        detected_intent = EXCLUDED.detected_intent
    `,
    [
      conversation.id,
      conversation.leadId,
      conversation.channel,
      conversation.startedAt,
      conversation.lastMessageAt,
      conversation.transcriptSummary,
      conversation.handoffRequested,
      conversation.detectedIntent,
    ],
  );
}

async function createActivity(
  client: PgClient,
  leadId: string,
  type: CrmActivity["type"],
  description: string,
  createdAt: string,
) {
  const activity: CrmActivity = {
    id: createId("act"),
    leadId,
    type,
    description,
    createdAt,
    createdBy: "chatbot",
  };

  await insertActivity(client, activity);
}

export async function getCrmSnapshotPostgres() {
  await ensureCrmSchema();

  const [leadsResult, conversationsResult, activitiesResult, tasksResult] =
    await Promise.all([
      pgQuery<LeadRow>("SELECT * FROM crm_leads ORDER BY created_at DESC"),
      pgQuery<ConversationRow>(
        "SELECT * FROM crm_conversations ORDER BY last_message_at DESC",
      ),
      pgQuery<ActivityRow>(
        "SELECT * FROM crm_activities ORDER BY created_at DESC",
      ),
      pgQuery<TaskRow>("SELECT * FROM crm_tasks ORDER BY created_at DESC"),
    ]);

  return {
    leads: leadsResult.rows.map(mapLead),
    conversations: conversationsResult.rows.map(mapConversation),
    activities: activitiesResult.rows.map(mapActivity),
    tasks: tasksResult.rows.map(mapTask),
  };
}

export async function persistChatbotLeadPostgres({
  lead,
  transcript,
  intent,
  detectedInterest,
  sessionId,
}: PersistChatbotLeadInput) {
  await ensureCrmSchema();

  return withPgTransaction(async (client) => {
    const now = new Date().toISOString();
    const sessionPhone = sessionId ? `web:${sessionId}` : "";
    const existingWebLead = sessionPhone
      ? await getWebLeadBySession(client, sessionPhone)
      : null;
    const leadId = existingWebLead?.id ?? createId("lead");
    const nextActionAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const crmLead: CrmLead = existingWebLead
      ? {
          ...existingWebLead,
          updatedAt: now,
          source: lead.source,
          name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone?.trim() || existingWebLead.phone,
          interest: lead.interest || detectedInterest || "sin-definir",
          summary: buildSummary(lead),
          status: "nuevo",
          lastContactAt: now,
          nextActionAt,
        }
      : {
          id: leadId,
          createdAt: now,
          updatedAt: now,
          source: lead.source,
          sourceDetail: "chatbot",
          name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone?.trim() || "",
          interest: lead.interest || detectedInterest || "sin-definir",
          summary: buildSummary(lead),
          priority: "media",
          status: "nuevo",
          owner: "Sin asignar",
          lastContactAt: now,
          nextActionAt,
          notes: "",
        };

    if (existingWebLead) {
      await updateLeadRecord(client, crmLead);
    } else {
      await insertLead(client, crmLead);
      await createActivity(
        client,
        leadId,
        "lead_created",
        `Lead creado desde chatbot para ${lead.company}.`,
        now,
      );
    }

    const existingConversation = await getConversationByLeadChannel(
      client,
      leadId,
      lead.source,
    );

    const crmConversation: CrmConversation = existingConversation
      ? {
          ...existingConversation,
          lastMessageAt: now,
          transcriptSummary: buildTranscriptSummary(transcript),
          handoffRequested: true,
          detectedIntent: intent || "consulta_general",
        }
      : {
          id: createId("conv"),
          leadId,
          channel: lead.source,
          startedAt: now,
          lastMessageAt: now,
          transcriptSummary: buildTranscriptSummary(transcript),
          handoffRequested: true,
          detectedIntent: intent || "consulta_general",
        };

    await upsertConversationRecord(client, crmConversation);
    await createActivity(
      client,
      leadId,
      "conversation_captured",
      "Conversacion inicial registrada desde el chatbot web.",
      now,
    );

    return {
      lead: crmLead,
      conversation: crmConversation,
    };
  });
}

export async function persistWebChatMessagePostgres({
  sessionId,
  message,
  reply,
  detectedInterest,
  intent,
}: PersistWebChatMessageInput) {
  await ensureCrmSchema();

  return withPgTransaction(async (client) => {
    const now = new Date().toISOString();
    const sessionPhone = `web:${sessionId}`;
    const nextActionAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    let lead = await getWebLeadBySession(client, sessionPhone);

    if (!lead) {
      lead = {
        id: createId("lead"),
        createdAt: now,
        updatedAt: now,
        source: "web",
        sourceDetail: "chatbot",
        name: "Visitante web",
        company: "Lead web sin datos",
        email: "",
        phone: sessionPhone,
        interest: detectedInterest || "sin-definir",
        summary: `Web chat: ${message}`,
        priority: "media",
        status: "nuevo",
        owner: "Sin asignar",
        lastContactAt: now,
        nextActionAt,
        notes: "",
      };

      await insertLead(client, lead);
      await createActivity(
        client,
        lead.id,
        "lead_created",
        "Lead web creado desde una nueva conversacion del chatbot.",
        now,
      );
    } else {
      lead = {
        ...lead,
        updatedAt: now,
        lastContactAt: now,
        summary: `Web chat: ${message}`,
        interest:
          (lead.interest === "sin-definir" || !lead.interest) && detectedInterest
            ? detectedInterest
            : lead.interest,
      };
      await updateLeadRecord(client, lead);
    }

    const existingConversation = await getConversationByLeadChannel(
      client,
      lead.id,
      "web",
    );

    const transcriptSummary = existingConversation
      ? [
          existingConversation.transcriptSummary,
          `Cliente: ${message}`,
          reply ? `Bot: ${reply}` : "",
        ]
          .filter(Boolean)
          .join(" || ")
      : [`Cliente: ${message}`, reply ? `Bot: ${reply}` : ""]
          .filter(Boolean)
          .join(" || ");

    const conversation: CrmConversation = existingConversation
      ? {
          ...existingConversation,
          lastMessageAt: now,
          transcriptSummary,
          detectedIntent: intent || existingConversation.detectedIntent,
        }
      : {
          id: createId("conv"),
          leadId: lead.id,
          channel: "web",
          startedAt: now,
          lastMessageAt: now,
          transcriptSummary,
          handoffRequested: false,
          detectedIntent: intent || "consulta_general",
        };

    await upsertConversationRecord(client, conversation);
    await createActivity(
      client,
      lead.id,
      "web_message_received",
      "Mensaje recibido desde el chatbot web.",
      now,
    );

    if (reply) {
      await createActivity(
        client,
        lead.id,
        "web_message_sent",
        "Respuesta automatica enviada desde el chatbot web.",
        now,
      );
    }

    return lead;
  });
}

export async function createManualCrmLeadPostgres({
  name,
  company,
  email,
  phone,
  interest,
  summary,
  owner,
  notes,
}: CreateManualLeadInput) {
  await ensureCrmSchema();

  return withPgTransaction(async (client) => {
    const now = new Date().toISOString();
    const lead: CrmLead = {
      id: createId("lead"),
      createdAt: now,
      updatedAt: now,
      source: "manual",
      sourceDetail: "chatbot",
      name: name.trim(),
      company: company.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      interest: interest || "sin-definir",
      summary: summary.trim(),
      priority: "media",
      status: "nuevo",
      owner: owner?.trim() || "Sin asignar",
      lastContactAt: now,
      nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notes: notes?.trim() || "",
    };

    await insertLead(client, lead);
    await createActivity(
      client,
      lead.id,
      "lead_created",
      `Lead cargado manualmente para ${lead.company}.`,
      now,
    );

    return lead;
  });
}

export async function updateCrmLeadPostgres({
  id,
  status,
  owner,
  nextActionAt,
  notes,
}: UpdateCrmLeadInput) {
  await ensureCrmSchema();

  return withPgTransaction(async (client) => {
    const lead = await getLeadById(client, id);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    const changes: string[] = [];
    const now = new Date().toISOString();
    const nextLead = { ...lead };

    if (status && status !== nextLead.status) {
      changes.push(`estado: ${nextLead.status} -> ${status}`);
      nextLead.status = status;
    }

    if (typeof owner === "string" && owner.trim() !== nextLead.owner) {
      changes.push(
        `responsable: ${nextLead.owner} -> ${owner.trim() || "Sin asignar"}`,
      );
      nextLead.owner = owner.trim() || "Sin asignar";
    }

    if (
      typeof nextActionAt === "string" &&
      nextActionAt !== nextLead.nextActionAt
    ) {
      changes.push("proxima accion actualizada");
      nextLead.nextActionAt = nextActionAt;
    }

    if (typeof notes === "string" && notes !== nextLead.notes) {
      changes.push("notas actualizadas");
      nextLead.notes = notes;
    }

    nextLead.updatedAt = now;
    nextLead.lastContactAt = now;

    await updateLeadRecord(client, nextLead);

    if (changes.length > 0) {
      await createActivity(
        client,
        nextLead.id,
        "lead_updated",
        `Lead ${nextLead.company} actualizado (${changes.join(", ")}).`,
        now,
      );
    }

    return nextLead;
  });
}

export async function createCrmLeadActivityPostgres({
  leadId,
  description,
  kind = "note",
  nextActionAt,
}: CreateCrmLeadActivityInput) {
  await ensureCrmSchema();

  return withPgTransaction(async (client) => {
    const lead = await getLeadById(client, leadId);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    const cleanDescription = description.trim();

    if (!cleanDescription) {
      throw new Error("Description required.");
    }

    const now = new Date().toISOString();
    const nextLead = { ...lead };

    if (kind === "contact") {
      nextLead.lastContactAt = now;
      nextLead.updatedAt = now;

      if (nextLead.status === "nuevo") {
        nextLead.status = "contactado";
      }
    } else {
      nextLead.updatedAt = now;
    }

    if (
      typeof nextActionAt === "string" &&
      !Number.isNaN(Date.parse(nextActionAt))
    ) {
      nextLead.nextActionAt = nextActionAt;
    }

    nextLead.notes = nextLead.notes
      ? `${nextLead.notes}\n${cleanDescription}`
      : cleanDescription;

    await updateLeadRecord(client, nextLead);
    await createActivity(
      client,
      nextLead.id,
      "lead_updated",
      kind === "contact"
        ? `Contacto registrado con ${nextLead.company}: ${cleanDescription}`
        : `Nota agregada para ${nextLead.company}: ${cleanDescription}`,
      now,
    );

    return nextLead;
  });
}

export async function createCrmTaskPostgres({
  leadId,
  title,
  type,
  dueAt,
}: CreateCrmTaskInput) {
  await ensureCrmSchema();

  return withPgTransaction(async (client) => {
    const lead = await getLeadById(client, leadId);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      throw new Error("Task title required.");
    }

    if (Number.isNaN(Date.parse(dueAt))) {
      throw new Error("Task due date invalid.");
    }

    const now = new Date().toISOString();
    const task: CrmTask = {
      id: createId("task"),
      leadId,
      title: cleanTitle,
      type,
      dueAt,
      status: "pendiente",
      createdAt: now,
    };

    await insertTask(client, task);
    await updateLeadRecord(client, {
      ...lead,
      updatedAt: now,
      nextActionAt: dueAt,
    });
    await createActivity(
      client,
      leadId,
      "lead_updated",
      `Tarea creada para ${lead.company}: ${cleanTitle}.`,
      now,
    );

    return task;
  });
}

export async function updateCrmTaskPostgres({
  leadId,
  taskId,
  status,
}: UpdateCrmTaskInput) {
  await ensureCrmSchema();

  return withPgTransaction(async (client) => {
    const lead = await getLeadById(client, leadId);
    const taskResult = await pgTxQuery<TaskRow>(
      client,
      "SELECT * FROM crm_tasks WHERE id = $1 AND lead_id = $2 LIMIT 1",
      [taskId, leadId],
    );
    const task = taskResult.rows[0] ? mapTask(taskResult.rows[0]) : null;

    if (!lead || !task) {
      throw new Error("Task not found.");
    }

    if (task.status === status) {
      return task;
    }

    const now = new Date().toISOString();
    const updatedTask: CrmTask = {
      ...task,
      status,
      completedAt: status === "hecha" ? now : undefined,
    };

    await pgTxQuery(
      client,
      `
        UPDATE crm_tasks
        SET status = $3, completed_at = $4
        WHERE id = $1 AND lead_id = $2
      `,
      [taskId, leadId, status, updatedTask.completedAt ?? null],
    );

    const nextLead: CrmLead = {
      ...lead,
      updatedAt: now,
      lastContactAt: status === "hecha" ? now : lead.lastContactAt,
    };

    await updateLeadRecord(client, nextLead);
    await createActivity(
      client,
      leadId,
      "lead_updated",
      status === "hecha"
        ? `Tarea completada para ${lead.company}: ${task.title}.`
        : `Tarea reabierta para ${lead.company}: ${task.title}.`,
      now,
    );

    return updatedTask;
  });
}

export async function persistWhatsAppMessagePostgres({
  from,
  contactName,
  message,
  reply,
  detectedInterest,
  intent,
}: PersistWhatsAppMessageInput) {
  await ensureCrmSchema();

  return withPgTransaction(async (client) => {
    const now = new Date().toISOString();
    const normalizedPhone = from.trim();
    const nextActionAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    let lead = await getLeadByPhone(client, normalizedPhone);

    if (!lead) {
      lead = {
        id: createId("lead"),
        createdAt: now,
        updatedAt: now,
        source: "whatsapp",
        sourceDetail: "chatbot",
        name: contactName?.trim() || "Contacto WhatsApp",
        company: "Sin empresa",
        email: "",
        phone: normalizedPhone,
        interest: detectedInterest || "sin-definir",
        summary: `WhatsApp: ${message}`,
        priority: "media",
        status: "nuevo",
        owner: "Sin asignar",
        lastContactAt: now,
        nextActionAt,
        notes: "",
      };

      await insertLead(client, lead);
      await createActivity(
        client,
        lead.id,
        "lead_created",
        `Lead creado desde WhatsApp para ${lead.name}.`,
        now,
      );
    } else {
      lead = {
        ...lead,
        updatedAt: now,
        lastContactAt: now,
        source: "whatsapp",
        interest:
          (lead.interest === "sin-definir" || !lead.interest) && detectedInterest
            ? detectedInterest
            : lead.interest,
      };
      await updateLeadRecord(client, lead);
    }

    const existingConversation = await getConversationByLeadChannel(
      client,
      lead.id,
      "whatsapp",
    );

    const transcriptSummary = existingConversation
      ? [
          existingConversation.transcriptSummary,
          `Cliente: ${message}`,
          reply ? `Bot: ${reply}` : "",
        ]
          .filter(Boolean)
          .join(" || ")
      : [`Cliente: ${message}`, reply ? `Bot: ${reply}` : ""]
          .filter(Boolean)
          .join(" || ");

    const conversation: CrmConversation = existingConversation
      ? {
          ...existingConversation,
          lastMessageAt: now,
          transcriptSummary,
          detectedIntent: intent || existingConversation.detectedIntent,
        }
      : {
          id: createId("conv"),
          leadId: lead.id,
          channel: "whatsapp",
          startedAt: now,
          lastMessageAt: now,
          transcriptSummary,
          handoffRequested: false,
          detectedIntent: intent || "consulta_general",
        };

    await upsertConversationRecord(client, conversation);
    await createActivity(
      client,
      lead.id,
      "whatsapp_message_received",
      `Mensaje recibido por WhatsApp desde ${lead.name}.`,
      now,
    );

    if (reply) {
      await createActivity(
        client,
        lead.id,
        "whatsapp_message_sent",
        `Respuesta automatica enviada por WhatsApp a ${lead.name}.`,
        now,
      );
    }

    return lead;
  });
}
