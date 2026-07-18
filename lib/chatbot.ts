export type ChatbotLeadInterest =
  | "automatizaciones"
  | "seguimiento"
  | "chatbots"
  | "herramientas-internas"
  | "integraciones"
  | "centralizacion"
  | "diagnostico"
  | "sin-definir";

export type ChatbotLeadStatus =
  | "nuevo"
  | "contactado"
  | "calificado"
  | "propuesta"
  | "seguimiento"
  | "cerrado_ganado"
  | "cerrado_perdido";

export type ChatbotSource = "web" | "whatsapp" | "manual";

export type ChatbotIntent =
  | "consultar_servicios"
  | "pedir_auditoria"
  | "dejar_datos"
  | "hablar_con_persona"
  | "consulta_general";

export type ChatbotService = {
  slug: ChatbotLeadInterest;
  title: string;
  summary: string;
  pain: string;
  benefit: string;
};

export type ChatbotQuestion = {
  id: string;
  label: string;
  field:
    | "name"
    | "company"
    | "email"
    | "phone"
    | "interest"
    | "currentProcess"
    | "mainProblem";
  placeholder: string;
  required: boolean;
};

export const chatbotProfile = {
  name: "Asistente de SolutiogeniZ",
  tone: "calido, optimista, claro y profesional",
  welcomeMessage:
    "Hola, soy el asistente de SolutiogeniZ. Puedo ayudarte a conocer nuestros servicios, entender que proceso queres mejorar y dejar tu consulta para que te contactemos.",
  handoffMessage:
    "Perfecto. Si queres, puedo dejar tus datos para que el equipo de SolutiogeniZ te contacte.",
};

export const chatbotKnowledgeBase = {
  company: {
    name: "SolutiogeniZ",
    description:
      "Consultora enfocada en automatizaciones, integraciones, herramientas internas simples e inteligencia artificial aplicada cuando aporta valor real.",
    audience:
      "Empresas que quieren responder mas rapido, ordenar procesos y no perder oportunidades.",
    promise:
      "Ayudamos a ordenar consultas, seguimientos y tareas para que la operacion gane velocidad, control y continuidad.",
  },
  benefits: [
    "Menos carga manual",
    "Mas rapidez de respuesta",
    "Mejor seguimiento",
    "Menos errores",
    "Mas orden",
    "Mas control",
  ],
  painPoints: [
    "Consultas que quedan sin seguimiento",
    "Tareas repetitivas que consumen tiempo",
    "Informacion repartida en varios lugares",
    "Demoras comerciales u operativas",
    "Falta de visibilidad sobre que paso y que sigue",
  ],
};

export const chatbotServices: ChatbotService[] = [
  {
    slug: "automatizaciones",
    title: "Automatizacion de tareas repetitivas",
    summary:
      "Ordenamos tareas manuales para que avancen con menos intervencion humana.",
    pain: "Hay tareas diarias que consumen tiempo y frenan al equipo.",
    benefit: "Menos carga manual y mas foco en lo que mueve el negocio.",
  },
  {
    slug: "seguimiento",
    title: "Seguimiento comercial y operativo",
    summary:
      "Ayudamos a que consultas, pendientes y oportunidades no se enfrien.",
    pain: "Los contactos o tareas quedan a mitad de camino por falta de seguimiento.",
    benefit: "Mas continuidad, mas control y menos oportunidades perdidas.",
  },
  {
    slug: "chatbots",
    title: "Chatbots y atencion automatica",
    summary:
      "Creamos asistentes que responden, toman datos y derivan cuando hace falta.",
    pain: "El equipo repite respuestas y las consultas se acumulan.",
    benefit: "Respuestas mas rapidas sin sumar desgaste al equipo.",
  },
  {
    slug: "herramientas-internas",
    title: "Herramientas internas a medida",
    summary:
      "Creamos paneles, formularios y herramientas adaptadas al trabajo real de la empresa.",
    pain: "Planillas y mensajes sueltos ya no alcanzan para sostener el proceso.",
    benefit: "Mas orden y visibilidad con una herramienta pensada para tu operacion.",
  },
  {
    slug: "integraciones",
    title: "Integracion de sistemas",
    summary:
      "Conectamos herramientas para evitar doble carga y perdida de informacion.",
    pain: "Los datos viven separados y el equipo repite trabajo.",
    benefit: "Informacion mas conectada y procesos mas fluidos.",
  },
  {
    slug: "centralizacion",
    title: "Centralizacion de informacion",
    summary:
      "Reunimos la informacion importante en un flujo o espacio mas claro.",
    pain: "Cada dato esta en un lugar distinto y cuesta seguir el estado real.",
    benefit: "Mas claridad para actuar mejor y mas rapido.",
  },
  {
    slug: "diagnostico",
    title: "Diagnostico y consultoria de procesos",
    summary:
      "Analizamos el proceso actual para detectar donde hoy se pierde tiempo, orden o ventas.",
    pain: "No siempre esta claro por donde conviene empezar.",
    benefit: "Una lectura concreta para priorizar la mejora correcta.",
  },
];

export const chatbotIntents: Array<{
  id: ChatbotIntent;
  title: string;
  description: string;
}> = [
  {
    id: "consultar_servicios",
    title: "Consultar servicios",
    description: "El visitante quiere entender que hace SolutiogeniZ.",
  },
  {
    id: "pedir_auditoria",
    title: "Pedir auditoria",
    description: "El visitante quiere avanzar con un primer analisis.",
  },
  {
    id: "dejar_datos",
    title: "Dejar datos",
    description: "El visitante quiere ser contactado.",
  },
  {
    id: "hablar_con_persona",
    title: "Hablar con una persona",
    description: "El visitante prefiere derivacion humana.",
  },
  {
    id: "consulta_general",
    title: "Consulta general",
    description: "La necesidad todavia no esta del todo clara.",
  },
];

export const chatbotLeadQuestions: ChatbotQuestion[] = [
  {
    id: "interest",
    label: "Que te gustaria mejorar primero?",
    field: "interest",
    placeholder: "Ejemplo: seguimiento comercial, consultas por WhatsApp...",
    required: true,
  },
  {
    id: "current-process",
    label: "Como manejan hoy ese proceso?",
    field: "currentProcess",
    placeholder: "Contame brevemente como lo trabajan ahora.",
    required: true,
  },
  {
    id: "main-problem",
    label: "Cual es el principal problema que te esta pasando hoy?",
    field: "mainProblem",
    placeholder: "Demoras, olvidos, consultas sin respuesta, doble carga...",
    required: true,
  },
  {
    id: "name",
    label: "Como es tu nombre?",
    field: "name",
    placeholder: "Tu nombre",
    required: true,
  },
  {
    id: "company",
    label: "De que empresa sos?",
    field: "company",
    placeholder: "Nombre de tu empresa",
    required: true,
  },
  {
    id: "email",
    label: "A que email te podemos escribir?",
    field: "email",
    placeholder: "tuemail@empresa.com",
    required: true,
  },
  {
    id: "phone",
    label: "Si queres, dejame tu telefono o WhatsApp.",
    field: "phone",
    placeholder: "Telefono o WhatsApp",
    required: false,
  },
];

export const chatbotGuardrails = [
  "No inventar precios, plazos ni alcances.",
  "No prometer resultados garantizados.",
  "No responder con tecnicismos innecesarios.",
  "No insistir si la persona pide hablar con alguien del equipo.",
  "No pedir datos sensibles para una primera conversacion.",
  "No compartir informacion interna o confidencial.",
];

export const crmLeadStatuses: ChatbotLeadStatus[] = [
  "nuevo",
  "contactado",
  "calificado",
  "propuesta",
  "seguimiento",
  "cerrado_ganado",
  "cerrado_perdido",
];

export const crmLeadSources: ChatbotSource[] = ["web", "whatsapp", "manual"];
