import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import type {
  ChatbotIntent,
  ChatbotLeadInterest,
  ChatbotLeadStatus,
  ChatbotSource,
} from "@/lib/chatbot";
import type { ChatbotLeadFormState } from "@/lib/chatbot-lead";

export type CrmLead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: ChatbotSource;
  sourceDetail: "chatbot";
  name: string;
  company: string;
  email: string;
  phone: string;
  interest: ChatbotLeadInterest | "sin-definir";
  summary: string;
  priority: "media";
  status: ChatbotLeadStatus;
  owner: string;
  lastContactAt: string;
  nextActionAt: string;
  notes: string;
};

export type CrmConversation = {
  id: string;
  leadId: string;
  channel: ChatbotSource;
  startedAt: string;
  lastMessageAt: string;
  transcriptSummary: string;
  handoffRequested: boolean;
  detectedIntent: ChatbotIntent | "consulta_general";
};

export type CrmActivity = {
  id: string;
  leadId: string;
  type:
    | "lead_created"
    | "conversation_captured"
    | "lead_updated"
    | "whatsapp_message_received"
    | "whatsapp_message_sent";
  description: string;
  createdAt: string;
  createdBy: "chatbot";
};

export type CrmTask = {
  id: string;
  leadId: string;
  title: string;
  type: "llamada" | "reunion" | "propuesta" | "seguimiento" | "otro";
  dueAt: string;
  status: "pendiente" | "hecha";
  createdAt: string;
  completedAt?: string;
};

type CrmStore = {
  leads: CrmLead[];
  conversations: CrmConversation[];
  activities: CrmActivity[];
  tasks: CrmTask[];
};

export type CrmSearchLeadResult = CrmLead & {
  matchReason: string;
};

export type CrmSearchTaskResult = CrmTask & {
  lead: CrmLead | null;
  matchReason: string;
};

export type CrmSearchConversationResult = CrmConversation & {
  lead: CrmLead | null;
  matchReason: string;
};

export type CrmSearchResults = {
  query: string;
  leads: CrmSearchLeadResult[];
  tasks: CrmSearchTaskResult[];
  conversations: CrmSearchConversationResult[];
};

type ChatTranscriptMessage = {
  role: "assistant" | "user";
  content: string;
};

type PersistChatbotLeadInput = {
  lead: ChatbotLeadFormState;
  transcript: ChatTranscriptMessage[];
  intent?: ChatbotIntent;
  detectedInterest?: ChatbotLeadInterest | "";
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

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "crm-store.json");

const defaultStore: CrmStore = {
  leads: [],
  conversations: [],
  activities: [],
  tasks: [],
};

let writeQueue = Promise.resolve();

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findMatchReason(
  query: string,
  fields: Array<{ label: string; value: string | undefined }>,
) {
  for (const field of fields) {
    const cleanValue = field.value?.trim();

    if (!cleanValue) {
      continue;
    }

    if (normalizeSearchValue(cleanValue).includes(query)) {
      return `${field.label}: ${cleanValue}`;
    }
  }

  return null;
}

async function ensureStoreFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  const raw = await readFile(storePath, "utf8");

  try {
    const parsed = JSON.parse(raw) as Partial<CrmStore>;
    return {
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    } satisfies CrmStore;
  } catch {
    return defaultStore;
  }
}

async function writeStore(store: CrmStore) {
  await ensureStoreFile();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

async function updateStore<T>(updater: (store: CrmStore) => T | Promise<T>) {
  const pending = writeQueue.then(async () => {
    const store = await readStore();
    const result = await updater(store);
    await writeStore(store);
    return result;
  });

  writeQueue = pending.then(
    () => undefined,
    () => undefined,
  );

  return pending;
}

export async function persistChatbotLead({
  lead,
  transcript,
  intent,
  detectedInterest,
}: PersistChatbotLeadInput) {
  return updateStore((store) => {
    const now = new Date().toISOString();
    const leadId = createId("lead");
    const conversationId = createId("conv");
    const nextActionAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const crmLead: CrmLead = {
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

    const crmConversation: CrmConversation = {
      id: conversationId,
      leadId,
      channel: lead.source,
      startedAt: now,
      lastMessageAt: now,
      transcriptSummary: buildTranscriptSummary(transcript),
      handoffRequested: true,
      detectedIntent: intent || "consulta_general",
    };

    store.leads.unshift(crmLead);
    store.conversations.unshift(crmConversation);
    store.activities.unshift(
      {
        id: createId("act"),
        leadId,
        type: "lead_created",
        description: `Lead creado desde chatbot para ${lead.company}.`,
        createdAt: now,
        createdBy: "chatbot",
      },
      {
        id: createId("act"),
        leadId,
        type: "conversation_captured",
        description: "Conversacion inicial registrada desde el chatbot web.",
        createdAt: now,
        createdBy: "chatbot",
      },
    );

    return {
      lead: crmLead,
      conversation: crmConversation,
    };
  });
}

export async function getCrmSnapshot() {
  return readStore();
}

export async function searchCrm(query: string): Promise<CrmSearchResults> {
  const store = await readStore();
  const normalizedQuery = normalizeSearchValue(query.trim());

  if (!normalizedQuery) {
    return {
      query: query.trim(),
      leads: [],
      tasks: [],
      conversations: [],
    };
  }

  const leadById = new Map(store.leads.map((lead) => [lead.id, lead]));

  const leads = store.leads
    .map((lead) => {
      const matchReason = findMatchReason(normalizedQuery, [
        { label: "Empresa", value: lead.company },
        { label: "Contacto", value: lead.name },
        { label: "Email", value: lead.email },
        { label: "Telefono", value: lead.phone },
        { label: "Interes", value: lead.interest },
        { label: "Resumen", value: lead.summary },
        { label: "Responsable", value: lead.owner },
        { label: "Notas", value: lead.notes },
      ]);

      return matchReason ? { ...lead, matchReason } : null;
    })
    .filter((lead): lead is CrmSearchLeadResult => lead !== null);

  const tasks = store.tasks
    .map((task) => {
      const lead = leadById.get(task.leadId) ?? null;
      const matchReason = findMatchReason(normalizedQuery, [
        { label: "Tarea", value: task.title },
        { label: "Tipo", value: task.type },
        { label: "Empresa", value: lead?.company },
        { label: "Contacto", value: lead?.name },
        { label: "Responsable", value: lead?.owner },
      ]);

      return matchReason ? { ...task, lead, matchReason } : null;
    })
    .filter((task): task is CrmSearchTaskResult => task !== null);

  const conversations = store.conversations
    .map((conversation) => {
      const lead = leadById.get(conversation.leadId) ?? null;
      const matchReason = findMatchReason(normalizedQuery, [
        { label: "Canal", value: conversation.channel },
        { label: "Intento detectado", value: conversation.detectedIntent },
        { label: "Resumen", value: conversation.transcriptSummary },
        { label: "Empresa", value: lead?.company },
        { label: "Contacto", value: lead?.name },
        { label: "Telefono", value: lead?.phone },
      ]);

      return matchReason ? { ...conversation, lead, matchReason } : null;
    })
    .filter(
      (conversation): conversation is CrmSearchConversationResult =>
        conversation !== null,
    );

  return {
    query: query.trim(),
    leads,
    tasks,
    conversations,
  };
}

export async function getCrmLeadDetail(id: string) {
  const store = await readStore();
  const lead = store.leads.find((item) => item.id === id) ?? null;

  if (!lead) {
    return null;
  }

  return {
    lead,
    activities: store.activities.filter((activity) => activity.leadId === id),
    conversations: store.conversations.filter(
      (conversation) => conversation.leadId === id,
    ),
    tasks: store.tasks.filter((task) => task.leadId === id),
  };
}

export async function createManualCrmLead({
  name,
  company,
  email,
  phone,
  interest,
  summary,
  owner,
  notes,
}: CreateManualLeadInput) {
  return updateStore((store) => {
    const now = new Date().toISOString();
    const leadId = createId("lead");
    const nextActionAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const lead: CrmLead = {
      id: leadId,
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
      nextActionAt,
      notes: notes?.trim() || "",
    };

    store.leads.unshift(lead);
    store.activities.unshift({
      id: createId("act"),
      leadId,
      type: "lead_created",
      description: `Lead cargado manualmente para ${lead.company}.`,
      createdAt: now,
      createdBy: "chatbot",
    });

    return lead;
  });
}

type UpdateCrmLeadInput = {
  id: string;
  status?: ChatbotLeadStatus;
  owner?: string;
  nextActionAt?: string;
  notes?: string;
};

export async function updateCrmLead({
  id,
  status,
  owner,
  nextActionAt,
  notes,
}: UpdateCrmLeadInput) {
  return updateStore((store) => {
    const lead = store.leads.find((item) => item.id === id);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    const changes: string[] = [];
    const now = new Date().toISOString();

    if (status && status !== lead.status) {
      changes.push(`estado: ${lead.status} -> ${status}`);
      lead.status = status;
    }

    if (typeof owner === "string" && owner.trim() !== lead.owner) {
      changes.push(
        `responsable: ${lead.owner} -> ${owner.trim() || "Sin asignar"}`,
      );
      lead.owner = owner.trim() || "Sin asignar";
    }

    if (typeof nextActionAt === "string" && nextActionAt !== lead.nextActionAt) {
      changes.push("proxima accion actualizada");
      lead.nextActionAt = nextActionAt;
    }

    if (typeof notes === "string" && notes !== lead.notes) {
      changes.push("notas actualizadas");
      lead.notes = notes;
    }

    lead.updatedAt = now;
    lead.lastContactAt = now;

    if (changes.length > 0) {
      store.activities.unshift({
        id: createId("act"),
        leadId: lead.id,
        type: "lead_updated",
        description: `Lead ${lead.company} actualizado (${changes.join(", ")}).`,
        createdAt: now,
        createdBy: "chatbot",
      });
    }

    return lead;
  });
}

type CreateCrmLeadActivityInput = {
  leadId: string;
  description: string;
  kind?: "note" | "contact";
  nextActionAt?: string;
};

export async function createCrmLeadActivity({
  leadId,
  description,
  kind = "note",
  nextActionAt,
}: CreateCrmLeadActivityInput) {
  return updateStore((store) => {
    const lead = store.leads.find((item) => item.id === leadId);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    const now = new Date().toISOString();
    const cleanDescription = description.trim();

    if (!cleanDescription) {
      throw new Error("Description required.");
    }

    if (kind === "contact") {
      lead.lastContactAt = now;
      lead.updatedAt = now;

      if (lead.status === "nuevo") {
        lead.status = "contactado";
      }
    } else {
      lead.updatedAt = now;
    }

    if (typeof nextActionAt === "string" && !Number.isNaN(Date.parse(nextActionAt))) {
      lead.nextActionAt = nextActionAt;
    }

    lead.notes = lead.notes
      ? `${lead.notes}\n${cleanDescription}`
      : cleanDescription;

    store.activities.unshift({
      id: createId("act"),
      leadId: lead.id,
      type: "lead_updated",
      description:
        kind === "contact"
          ? `Contacto registrado con ${lead.company}: ${cleanDescription}`
          : `Nota agregada para ${lead.company}: ${cleanDescription}`,
      createdAt: now,
      createdBy: "chatbot",
    });

    return lead;
  });
}

type CreateCrmTaskInput = {
  leadId: string;
  title: string;
  type: CrmTask["type"];
  dueAt: string;
};

export async function createCrmTask({
  leadId,
  title,
  type,
  dueAt,
}: CreateCrmTaskInput) {
  return updateStore((store) => {
    const lead = store.leads.find((item) => item.id === leadId);

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

    store.tasks.unshift(task);
    lead.updatedAt = now;
    lead.nextActionAt = dueAt;

    store.activities.unshift({
      id: createId("act"),
      leadId,
      type: "lead_updated",
      description: `Tarea creada para ${lead.company}: ${cleanTitle}.`,
      createdAt: now,
      createdBy: "chatbot",
    });

    return task;
  });
}

type UpdateCrmTaskInput = {
  leadId: string;
  taskId: string;
  status: CrmTask["status"];
};

export async function updateCrmTask({
  leadId,
  taskId,
  status,
}: UpdateCrmTaskInput) {
  return updateStore((store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    const task = store.tasks.find(
      (item) => item.id === taskId && item.leadId === leadId,
    );

    if (!lead || !task) {
      throw new Error("Task not found.");
    }

    if (task.status === status) {
      return task;
    }

    const now = new Date().toISOString();
    task.status = status;
    task.completedAt = status === "hecha" ? now : undefined;
    lead.updatedAt = now;

    if (status === "hecha") {
      lead.lastContactAt = now;
    }

    store.activities.unshift({
      id: createId("act"),
      leadId,
      type: "lead_updated",
      description:
        status === "hecha"
          ? `Tarea completada para ${lead.company}: ${task.title}.`
          : `Tarea reabierta para ${lead.company}: ${task.title}.`,
      createdAt: now,
      createdBy: "chatbot",
    });

    return task;
  });
}

type PersistWhatsAppMessageInput = {
  from: string;
  contactName?: string;
  message: string;
  reply?: string;
  detectedInterest?: ChatbotLeadInterest | "";
  intent?: ChatbotIntent;
};

export async function persistWhatsAppMessage({
  from,
  contactName,
  message,
  reply,
  detectedInterest,
  intent,
}: PersistWhatsAppMessageInput) {
  return updateStore((store) => {
    const now = new Date().toISOString();
    const normalizedPhone = from.trim();

    let lead = store.leads.find((item) => item.phone === normalizedPhone);

    if (!lead) {
      const leadId = createId("lead");
      const nextActionAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();

      lead = {
        id: leadId,
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

      store.leads.unshift(lead);
      store.activities.unshift({
        id: createId("act"),
        leadId,
        type: "lead_created",
        description: `Lead creado desde WhatsApp para ${lead.name}.`,
        createdAt: now,
        createdBy: "chatbot",
      });
    } else {
      lead.updatedAt = now;
      lead.lastContactAt = now;
      lead.source = "whatsapp";

      if (
        (lead.interest === "sin-definir" || !lead.interest) &&
        detectedInterest
      ) {
        lead.interest = detectedInterest;
      }
    }

    const existingConversation = store.conversations.find(
      (conversation) =>
        conversation.leadId === lead.id && conversation.channel === "whatsapp",
    );

    if (!existingConversation) {
      store.conversations.unshift({
        id: createId("conv"),
        leadId: lead.id,
        channel: "whatsapp",
        startedAt: now,
        lastMessageAt: now,
        transcriptSummary: [
          `Cliente: ${message}`,
          reply ? `Bot: ${reply}` : "",
        ]
          .filter(Boolean)
          .join(" || "),
        handoffRequested: false,
        detectedIntent: intent || "consulta_general",
      });
    } else {
      existingConversation.lastMessageAt = now;
      existingConversation.detectedIntent =
        intent || existingConversation.detectedIntent;
      existingConversation.transcriptSummary = [
        existingConversation.transcriptSummary,
        `Cliente: ${message}`,
        reply ? `Bot: ${reply}` : "",
      ]
        .filter(Boolean)
        .join(" || ");
    }

    store.activities.unshift({
      id: createId("act"),
      leadId: lead.id,
      type: "whatsapp_message_received",
      description: `Mensaje recibido por WhatsApp desde ${lead.name}.`,
      createdAt: now,
      createdBy: "chatbot",
    });

    if (reply) {
      store.activities.unshift({
        id: createId("act"),
        leadId: lead.id,
        type: "whatsapp_message_sent",
        description: `Respuesta automatica enviada por WhatsApp a ${lead.name}.`,
        createdAt: now,
        createdBy: "chatbot",
      });
    }

    return lead;
  });
}
