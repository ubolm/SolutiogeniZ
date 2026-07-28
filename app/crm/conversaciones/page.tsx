import { cookies } from "next/headers";

import { CrmPageIntro } from "@/components/crm/CrmPageIntro";
import { ConversationInboxPanel } from "@/components/crm/ConversationInboxPanel";
import {
  getCrmSessionCookieName,
  verifyCrmSessionToken,
} from "@/lib/crm-auth";
import { getCrmSnapshot, scopeCrmSnapshotToSession } from "@/lib/crm-store";

export const dynamic = "force-dynamic";

export default async function CrmConversationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCrmSessionCookieName())?.value;
  const session = await verifyCrmSessionToken(token);
  const role = session?.role ?? "vendedor";
  const snapshot = scopeCrmSnapshotToSession(await getCrmSnapshot(), session);
  const webCount = snapshot.conversations.filter(
    (conversation) => conversation.channel === "web",
  ).length;
  const whatsappCount = snapshot.conversations.filter(
    (conversation) => conversation.channel === "whatsapp",
  ).length;

  return (
    <div className="grid gap-8">
      <CrmPageIntro
        description="Revisa lo que se hablo por web o WhatsApp, encuentra contexto rapido y entra al lead adecuado para continuar el seguimiento."
        eyebrow="Conversaciones"
        stats={[
          {
            label: "Totales",
            value: snapshot.conversations.length.toString(),
          },
          {
            label: "Web",
            value: webCount.toString(),
          },
          {
            label: "WhatsApp",
            value: whatsappCount.toString(),
          },
        ]}
        title="Conversaciones"
      />

      <ConversationInboxPanel
        conversations={snapshot.conversations}
        leads={snapshot.leads}
        role={role}
      />
    </div>
  );
}
