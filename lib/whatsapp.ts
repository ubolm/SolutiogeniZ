import { createHmac, timingSafeEqual } from "crypto";

export type WhatsAppIncomingMessage = {
  from: string;
  profileName?: string;
  text: string;
  messageId?: string;
};

export type WhatsAppProvider = "meta" | "ycloud" | "evolution" | "none";

type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ profile?: { name?: string } }>;
        messages?: Array<{
          from?: string;
          id?: string;
          text?: { body?: string };
          type?: string;
        }>;
      };
    }>;
  }>;
} | null;

type EvolutionMessageNode = {
  key?: {
    fromMe?: boolean;
    id?: string;
    remoteJid?: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string };
    videoMessage?: { caption?: string };
  };
  messageType?: string;
  pushName?: string;
};

type EvolutionWebhookPayload =
  | {
      data?: EvolutionMessageNode | { messages?: EvolutionMessageNode[] };
      event?: string;
      instance?: string;
    }
  | EvolutionMessageNode
  | null;

type YCloudWebhookPayload = {
  id?: string;
  type?: string;
  whatsappInboundMessage?: {
    id?: string;
    wamid?: string;
    from?: string;
    customerProfile?: { name?: string };
    type?: string;
    text?: { body?: string };
    interactive?: {
      type?: string;
      button_reply?: { id?: string; title?: string };
      list_reply?: { id?: string; title?: string; description?: string };
    };
  };
} | null;

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function hasMetaConfig() {
  return Boolean(
    env("WHATSAPP_ACCESS_TOKEN") &&
      env("WHATSAPP_PHONE_NUMBER_ID") &&
      env("WHATSAPP_VERIFY_TOKEN"),
  );
}

function hasYCloudConfig() {
  return Boolean(env("YCLOUD_API_KEY") && env("YCLOUD_WHATSAPP_FROM"));
}

function hasEvolutionConfig() {
  return Boolean(
    env("EVOLUTION_API_BASE_URL") &&
      env("EVOLUTION_API_INSTANCE_NAME") &&
      env("EVOLUTION_API_KEY"),
  );
}

function normalizeWhatsAppNumber(value: string) {
  return value
    .trim()
    .replace("@s.whatsapp.net", "")
    .replace("@c.us", "")
    .replace(/[^\d]/g, "");
}

function extractEvolutionText(message?: EvolutionMessageNode["message"]) {
  return (
    message?.conversation?.trim() ||
    message?.extendedTextMessage?.text?.trim() ||
    message?.imageMessage?.caption?.trim() ||
    message?.videoMessage?.caption?.trim() ||
    ""
  );
}

function mapEvolutionMessage(message: EvolutionMessageNode) {
  if (message.key?.fromMe) {
    return null;
  }

  const from = normalizeWhatsAppNumber(message.key?.remoteJid ?? "");
  const text = extractEvolutionText(message.message);

  if (!from || !text) {
    return null;
  }

  return {
    from,
    profileName: message.pushName?.trim(),
    text,
    messageId: message.key?.id,
  } satisfies WhatsAppIncomingMessage;
}

function isIncomingMessage(
  message: WhatsAppIncomingMessage | null,
): message is WhatsAppIncomingMessage {
  return message !== null;
}

export function getWhatsAppProvider(): WhatsAppProvider {
  if (hasYCloudConfig()) {
    return "ycloud";
  }

  if (hasEvolutionConfig()) {
    return "evolution";
  }

  if (hasMetaConfig()) {
    return "meta";
  }

  return "none";
}

export function isWhatsAppConfigured() {
  return getWhatsAppProvider() !== "none";
}

export function verifyWhatsAppWebhookToken(token: string | null) {
  if (getWhatsAppProvider() !== "meta") {
    return false;
  }

  return token === env("WHATSAPP_VERIFY_TOKEN");
}

export function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null,
) {
  if (getWhatsAppProvider() === "ycloud") {
    const secret = env("YCLOUD_WEBHOOK_SECRET");

    if (!secret || !signature) {
      return true;
    }

    const pairs = signature.split(",").map((item) => item.trim());
    const timestamp = pairs.find((item) => item.startsWith("t="))?.slice(2);
    const received = pairs.find((item) => item.startsWith("s="))?.slice(2);

    if (!timestamp || !received) {
      return false;
    }

    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    try {
      return timingSafeEqual(
        Buffer.from(expected, "utf8"),
        Buffer.from(received, "utf8"),
      );
    } catch {
      return false;
    }
  }

  if (getWhatsAppProvider() !== "meta") {
    return true;
  }

  const appSecret = env("WHATSAPP_APP_SECRET");

  if (!appSecret || !signature?.startsWith("sha256=")) {
    return true;
  }

  const expected = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  const received = signature.slice("sha256=".length);

  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(received, "utf8"),
    );
  } catch {
    return false;
  }
}

export function extractWhatsAppMessages(payload: unknown) {
  const provider = getWhatsAppProvider();

  if (provider === "meta") {
    const body = payload as MetaWebhookPayload;

    if (!body?.entry) {
      return [] as WhatsAppIncomingMessage[];
    }

    return body.entry.flatMap((entry) =>
      (entry.changes ?? []).flatMap((change) => {
        const profileName = change.value?.contacts?.[0]?.profile?.name;

        return (change.value?.messages ?? [])
          .filter((message) => message.type === "text" && message.text?.body)
          .map((message) => ({
            from: String(message.from ?? "").trim(),
            profileName,
            text: String(message.text?.body ?? "").trim(),
            messageId: message.id,
          }))
          .filter((message) => message.from && message.text);
      }),
    );
  }

  if (provider === "ycloud") {
    const body = payload as YCloudWebhookPayload;

    if (
      body?.type !== "whatsapp.inbound_message.received" ||
      !body.whatsappInboundMessage
    ) {
      return [] as WhatsAppIncomingMessage[];
    }

    const incoming = body.whatsappInboundMessage;
    const from = normalizeWhatsAppNumber(incoming.from ?? "");
    const profileName = incoming.customerProfile?.name?.trim();
    const messageId = incoming.wamid || incoming.id;

    let text = "";

    if (incoming.type === "text") {
      text = incoming.text?.body?.trim() || "";
    }

    if (incoming.type === "interactive") {
      text =
        incoming.interactive?.button_reply?.title?.trim() ||
        incoming.interactive?.list_reply?.title?.trim() ||
        incoming.interactive?.list_reply?.description?.trim() ||
        "";
    }

    if (!from || !text) {
      return [] as WhatsAppIncomingMessage[];
    }

    return [
      {
        from,
        profileName,
        text,
        messageId,
      } satisfies WhatsAppIncomingMessage,
    ];
  }

  if (provider === "evolution") {
    const body = payload as EvolutionWebhookPayload;
    const directMessage = mapEvolutionMessage(body as EvolutionMessageNode);

    if (directMessage) {
      return [directMessage];
    }

    const dataNode = body && "data" in body ? body.data : null;

    if (!dataNode) {
      return [] as WhatsAppIncomingMessage[];
    }

    const singleNode = mapEvolutionMessage(dataNode as EvolutionMessageNode);

    if (singleNode) {
      return [singleNode];
    }

    const multipleNodes =
      typeof dataNode === "object" &&
      dataNode !== null &&
      "messages" in dataNode &&
      Array.isArray(dataNode.messages)
        ? dataNode.messages
        : [];

    return multipleNodes
      .map((message) => mapEvolutionMessage(message))
      .filter(isIncomingMessage);
  }

  return [] as WhatsAppIncomingMessage[];
}

export async function sendWhatsAppTextMessage({
  to,
  body,
}: {
  to: string;
  body: string;
}) {
  const provider = getWhatsAppProvider();

  if (provider === "meta") {
    const accessToken = env("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = env("WHATSAPP_PHONE_NUMBER_ID");

    if (!accessToken || !phoneNumberId) {
      return { delivered: false };
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `WhatsApp API rejected the message (${response.status}): ${errorBody}`,
      );
    }

    return { delivered: true };
  }

  if (provider === "ycloud") {
    const apiKey = env("YCLOUD_API_KEY");
    const from = env("YCLOUD_WHATSAPP_FROM");

    if (!apiKey || !from) {
      return { delivered: false };
    }

    const response = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: normalizeWhatsAppNumber(to),
        type: "text",
        text: {
          body,
          preview_url: false,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `YCloud API rejected the message (${response.status}): ${errorBody}`,
      );
    }

    return { delivered: true };
  }

  if (provider === "evolution") {
    const baseUrl = env("EVOLUTION_API_BASE_URL").replace(/\/+$/, "");
    const instanceName = env("EVOLUTION_API_INSTANCE_NAME");
    const apiKey = env("EVOLUTION_API_KEY");

    if (!baseUrl || !instanceName || !apiKey) {
      return { delivered: false };
    }

    const response = await fetch(
      `${baseUrl}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: {
          apikey: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: normalizeWhatsAppNumber(to),
          textMessage: {
            text: body,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Evolution API rejected the message (${response.status}): ${errorBody}`,
      );
    }

    return { delivered: true };
  }

  return { delivered: false };
}
