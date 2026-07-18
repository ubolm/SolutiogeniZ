import type {
  ChatbotIntent,
  ChatbotLeadInterest,
  ChatbotLeadStatus,
  ChatbotSource,
} from "@/lib/chatbot";
import type { ChatbotLeadFormState } from "@/lib/chatbot-lead";
import {
  createCrmLeadActivity as createCrmLeadActivityFile,
  createCrmTask as createCrmTaskFile,
  createManualCrmLead as createManualCrmLeadFile,
  getCrmSnapshot as getCrmSnapshotFile,
  persistChatbotLead as persistChatbotLeadFile,
  persistWebChatMessage as persistWebChatMessageFile,
  persistWhatsAppMessage as persistWhatsAppMessageFile,
  updateCrmLead as updateCrmLeadFile,
  updateCrmTask as updateCrmTaskFile,
  type CrmActivity,
  type CrmConversation,
  type CrmLead,
  type CrmTask,
} from "@/lib/crm-store-file";
import {
  createCrmLeadActivityPostgres,
  createCrmTaskPostgres,
  createManualCrmLeadPostgres,
  getCrmSnapshotPostgres,
  persistChatbotLeadPostgres,
  persistWebChatMessagePostgres,
  persistWhatsAppMessagePostgres,
  updateCrmLeadPostgres,
  updateCrmTaskPostgres,
} from "@/lib/crm-store-postgres";
import { isPostgresConfigured } from "@/lib/postgres";

export type { CrmActivity, CrmConversation, CrmLead, CrmTask };

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

type PersistChatbotLeadInput = {
  lead: ChatbotLeadFormState;
  transcript: Array<{ role: "assistant" | "user"; content: string }>;
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

async function readBackendSnapshot() {
  return isPostgresConfigured()
    ? getCrmSnapshotPostgres()
    : getCrmSnapshotFile();
}

export async function getCrmSnapshot() {
  return readBackendSnapshot();
}

export async function searchCrm(query: string): Promise<CrmSearchResults> {
  const store = await readBackendSnapshot();
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
  const store = await readBackendSnapshot();
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

export async function persistChatbotLead(input: PersistChatbotLeadInput) {
  return isPostgresConfigured()
    ? persistChatbotLeadPostgres(input)
    : persistChatbotLeadFile(input);
}

export async function persistWebChatMessage(
  input: PersistWebChatMessageInput,
) {
  return isPostgresConfigured()
    ? persistWebChatMessagePostgres(input)
    : persistWebChatMessageFile(input);
}

export async function createManualCrmLead(input: CreateManualLeadInput) {
  return isPostgresConfigured()
    ? createManualCrmLeadPostgres(input)
    : createManualCrmLeadFile(input);
}

export async function updateCrmLead(input: UpdateCrmLeadInput) {
  return isPostgresConfigured()
    ? updateCrmLeadPostgres(input)
    : updateCrmLeadFile(input);
}

export async function createCrmLeadActivity(
  input: CreateCrmLeadActivityInput,
) {
  return isPostgresConfigured()
    ? createCrmLeadActivityPostgres(input)
    : createCrmLeadActivityFile(input);
}

export async function createCrmTask(input: CreateCrmTaskInput) {
  return isPostgresConfigured()
    ? createCrmTaskPostgres(input)
    : createCrmTaskFile(input);
}

export async function updateCrmTask(input: UpdateCrmTaskInput) {
  return isPostgresConfigured()
    ? updateCrmTaskPostgres(input)
    : updateCrmTaskFile(input);
}

export async function persistWhatsAppMessage(
  input: PersistWhatsAppMessageInput,
) {
  return isPostgresConfigured()
    ? persistWhatsAppMessagePostgres(input)
    : persistWhatsAppMessageFile(input);
}
