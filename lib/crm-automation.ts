import type { ChatbotIntent, ChatbotLeadInterest } from "@/lib/chatbot";
import type { CrmConversation, CrmLead } from "@/lib/crm-store";

type WhatsAppInboundAutomationPayload = {
  event: "crm.whatsapp.inbound_message.received";
  source: "solutiogeniz-crm";
  occurredAt: string;
  provider: string;
  contact: {
    phone: string;
    profileName?: string;
  };
  message: {
    text: string;
    detectedInterest?: ChatbotLeadInterest | "";
    intent?: ChatbotIntent;
  };
  lead: Pick<
    CrmLead,
    | "id"
    | "name"
    | "company"
    | "phone"
    | "interest"
    | "status"
    | "owner"
    | "nextActionAt"
    | "source"
  >;
  conversation: Pick<
    CrmConversation,
    | "id"
    | "channel"
    | "startedAt"
    | "lastMessageAt"
    | "detectedIntent"
    | "isBotEnabled"
    | "humanTakenBy"
    | "assignedTo"
    | "unreadCount"
  > | null;
  bot: {
    shouldReply: boolean;
    reply?: string;
  };
};

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function getAutomationWebhookHeaders() {
  const secret = env("N8N_CRM_EVENTS_WEBHOOK_SECRET");

  return {
    "Content-Type": "application/json",
    ...(secret ? { "x-sgz-crm-secret": secret } : {}),
  };
}

export async function emitWhatsAppInboundAutomationEvent(input: {
  provider: string;
  from: string;
  profileName?: string;
  message: string;
  detectedInterest?: ChatbotLeadInterest | "";
  intent?: ChatbotIntent;
  lead: CrmLead;
  conversation: CrmConversation | null;
  shouldReply: boolean;
  reply?: string;
}) {
  const webhookUrl = env("N8N_CRM_EVENTS_WEBHOOK_URL");

  if (!webhookUrl) {
    return { delivered: false as const, reason: "missing-webhook" as const };
  }

  const payload: WhatsAppInboundAutomationPayload = {
    event: "crm.whatsapp.inbound_message.received",
    source: "solutiogeniz-crm",
    occurredAt: new Date().toISOString(),
    provider: input.provider,
    contact: {
      phone: input.from,
      profileName: input.profileName,
    },
    message: {
      text: input.message,
      detectedInterest: input.detectedInterest,
      intent: input.intent,
    },
    lead: {
      id: input.lead.id,
      name: input.lead.name,
      company: input.lead.company,
      phone: input.lead.phone,
      interest: input.lead.interest,
      status: input.lead.status,
      owner: input.lead.owner,
      nextActionAt: input.lead.nextActionAt,
      source: input.lead.source,
    },
    conversation: input.conversation
      ? {
          id: input.conversation.id,
          channel: input.conversation.channel,
          startedAt: input.conversation.startedAt,
          lastMessageAt: input.conversation.lastMessageAt,
          detectedIntent: input.conversation.detectedIntent,
          isBotEnabled: input.conversation.isBotEnabled,
          humanTakenBy: input.conversation.humanTakenBy,
          assignedTo: input.conversation.assignedTo,
          unreadCount: input.conversation.unreadCount,
        }
      : null,
    bot: {
      shouldReply: input.shouldReply,
      reply: input.reply,
    },
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: getAutomationWebhookHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("The CRM automation webhook rejected the WhatsApp event.");
  }

  return { delivered: true as const, reason: "webhook" as const };
}
