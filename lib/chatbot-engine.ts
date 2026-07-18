import {
  chatbotKnowledgeBase,
  chatbotProfile,
  chatbotServices,
  type ChatbotIntent,
  type ChatbotLeadInterest,
} from "@/lib/chatbot";

export type MessageAction = {
  type: "message";
  label: string;
  value: string;
};

export type LinkAction = {
  type: "link";
  label: string;
  href: string;
};

export type LeadAction = {
  type: "lead";
  label: string;
};

export type ChatbotAction = MessageAction | LinkAction | LeadAction;

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function detectInterest(message: string): ChatbotLeadInterest | "" {
  const text = normalize(message);

  if (
    text.includes("chatbot") ||
    text.includes("whatsapp") ||
    text.includes("atencion")
  ) {
    return "chatbots";
  }

  if (
    text.includes("seguimiento") ||
    text.includes("lead") ||
    text.includes("ventas") ||
    text.includes("comercial")
  ) {
    return "seguimiento";
  }

  if (
    text.includes("automat") ||
    text.includes("tarea") ||
    text.includes("proceso")
  ) {
    return "automatizaciones";
  }

  if (
    text.includes("integr") ||
    text.includes("sistema") ||
    text.includes("crm")
  ) {
    return "integraciones";
  }

  if (text.includes("herramienta") || text.includes("panel")) {
    return "herramientas-internas";
  }

  if (text.includes("orden") || text.includes("central")) {
    return "centralizacion";
  }

  if (text.includes("auditoria") || text.includes("diagnost")) {
    return "diagnostico";
  }

  return "";
}

export function detectIntent(message: string): ChatbotIntent {
  const text = normalize(message);

  if (
    text.includes("hablar con alguien") ||
    text.includes("persona") ||
    text.includes("asesor") ||
    text.includes("contacten")
  ) {
    return "hablar_con_persona";
  }

  if (text.includes("auditoria") || text.includes("diagnost")) {
    return "pedir_auditoria";
  }

  if (
    text.includes("dejar mis datos") ||
    text.includes("dejar datos") ||
    text.includes("contacto")
  ) {
    return "dejar_datos";
  }

  if (
    text.includes("servicio") ||
    text.includes("que hacen") ||
    text.includes("solucion")
  ) {
    return "consultar_servicios";
  }

  return "consulta_general";
}

function getServiceCopy(interest: ChatbotLeadInterest | "") {
  if (!interest) return null;
  return chatbotServices.find((service) => service.slug === interest) ?? null;
}

export function buildChatbotResponse(message: string) {
  const intent = detectIntent(message);
  const interest = detectInterest(message);
  const service = getServiceCopy(interest);

  let reply = "";
  let actions: ChatbotAction[] = [];
  let captureLead = false;

  if (intent === "consultar_servicios") {
    reply = `Te acompano con estas soluciones:\n- Automatizacion de tareas repetitivas\n- Seguimiento comercial y operativo\n- Chatbots para WhatsApp y web\n- Integraciones y herramientas internas\n\nSi queres, contame que proceso te gustaria mejorar y te digo por donde conviene empezar.`;
    actions = [
      {
        type: "message",
        label: "Automatizar tareas",
        value: "Quiero automatizar tareas repetitivas",
      },
      {
        type: "message",
        label: "Mejorar seguimiento",
        value: "Quiero mejorar el seguimiento comercial",
      },
      {
        type: "message",
        label: "Implementar chatbot",
        value: "Quiero implementar un chatbot para WhatsApp y web",
      },
      { type: "lead", label: "Quiero que me contacten" },
    ];
  } else if (intent === "pedir_auditoria") {
    reply =
      "Buen camino. La auditoria inicial nos sirve para detectar donde hoy se te estan yendo tiempo, orden u oportunidades. Si queres avanzar ahora, podes completar el diagnostico o dejar tus datos y te contactamos.";
    actions = [
      { type: "link", label: "Ir al diagnostico", href: "#diagnostico" },
      { type: "lead", label: "Dejar mis datos" },
    ];
    captureLead = true;
  } else if (intent === "dejar_datos" || intent === "hablar_con_persona") {
    reply = `${chatbotProfile.handoffMessage} Con un resumen corto del proceso actual ya podemos orientarte mejor.`;
    actions = [{ type: "lead", label: "Completar datos" }];
    captureLead = true;
  } else if (service) {
    reply = `${service.title}\n- ${service.summary}\n- ${service.benefit}\n\nSi queres, puedo dejar tu consulta para que el equipo vea tu caso puntual.`;
    actions = [
      { type: "lead", label: "Quiero dejar mi consulta" },
      { type: "link", label: "Ver auditoria", href: "#auditoria" },
    ];
    captureLead = true;
  } else {
    reply = `Te puedo ayudar a ordenar tu consulta y definir por donde empezar.\n\nPuntos en los que solemos trabajar:\n- Automatizacion\n- Seguimiento comercial\n- Chatbots\n- Integraciones\n- Herramientas internas\n\n${chatbotKnowledgeBase.company.promise}`;
    actions = [
      {
        type: "message",
        label: "Ver servicios",
        value: "Quiero conocer sus servicios",
      },
      {
        type: "message",
        label: "Pedir auditoria",
        value: "Quiero pedir una auditoria",
      },
      { type: "lead", label: "Dejar mis datos" },
    ];
  }

  return { reply, actions, captureLead, intent, interest };
}
