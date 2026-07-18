import { NextResponse } from "next/server";

import { buildChatbotResponse } from "@/lib/chatbot-engine";
import { persistWhatsAppMessage } from "@/lib/crm-store";
import {
  extractWhatsAppMessages,
  getWhatsAppProvider,
  isWhatsAppConfigured,
  sendWhatsAppTextMessage,
  verifyWhatsAppSignature,
  verifyWhatsAppWebhookToken,
} from "@/lib/whatsapp";

export async function GET(request: Request) {
  const provider = getWhatsAppProvider();

  if (provider === "evolution") {
    return NextResponse.json({ ok: true, provider });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    verifyWhatsAppWebhookToken(token) &&
    challenge
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: "WhatsApp todavia no esta configurado." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const payload = JSON.parse(rawBody) as unknown;
  const messages = extractWhatsAppMessages(payload).filter(
    (message): message is NonNullable<typeof message> => message !== null,
  );

  if (messages.length === 0) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      provider: getWhatsAppProvider(),
    });
  }

  await Promise.all(
    messages.map(async (message) => {
      const chatbotResponse = buildChatbotResponse(message.text);

      await persistWhatsAppMessage({
        from: message.from,
        contactName: message.profileName,
        message: message.text,
        reply: chatbotResponse.reply,
        detectedInterest: chatbotResponse.interest,
        intent: chatbotResponse.intent,
      });

      await sendWhatsAppTextMessage({
        to: message.from,
        body: chatbotResponse.reply,
      });
    }),
  );

  return NextResponse.json({ ok: true });
}
