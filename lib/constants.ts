import {
  CheckCircle2,
  Clock3,
  MessageSquareMore,
  PanelsTopLeft,
  RefreshCcw,
  Workflow,
  Zap,
} from "lucide-react";

export const brand = {
  name: "SolutiogeniZ",
  tagline: "Cada demora te cuesta ventas.",
  description:
    "Ordenamos consultas, seguimientos y tareas para que tu empresa responda más rápido y no pierda oportunidades.",
  trustLine:
    "Empezamos por el punto donde hoy más se está frenando tu operación.",
};

export const businessContact = {
  email: "lucas@solutiogeniz.com",
  phone: "+54 1178225683",
};

export const legalContact = {
  responsibleName: "Lucas Uboldi",
  legalAddress: "Casacuberta 3641, Castelar, Buenos Aires, Argentina",
};

export const navigation = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Cómo trabajamos", href: "#proceso" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Preguntas frecuentes", href: "#preguntas" },
  { label: "Contacto", href: "#contacto" },
];

export const services = [
  {
    name: "Automatización de tareas",
    icon: Workflow,
    problem:
      "Hay tareas diarias que consumen tiempo y no empujan el negocio.",
    benefit:
      "Menos carga manual. Más foco en lo que sí mueve ventas.",
    description:
      "Avisos, registros y pasos internos quedan ordenados para que el proceso siga avanzando sin fricción.",
    cta: "Ver si aplica",
  },
  {
    name: "Seguimiento comercial y operativo",
    icon: RefreshCcw,
    problem:
      "Consultas, presupuestos o pendientes se enfrían por falta de seguimiento.",
    benefit:
      "Más continuidad. Menos oportunidades que se enfrían.",
    description:
      "Alertas, recordatorios y movimientos automáticos para que cada contacto o tarea no quede a mitad de camino.",
    cta: "Quiero más control",
  },
  {
    name: "Chatbots y atención automática",
    icon: MessageSquareMore,
    problem:
      "Se acumulan consultas y el equipo repite respuestas todo el tiempo.",
    benefit:
      "Respuestas más rápidas sin sumar desgaste al equipo.",
    description:
      "Asistentes que responden, toman datos y derivan cada caso cuando hace falta intervención humana.",
    cta: "Quiero responder mejor",
  },
  {
    name: "Herramientas internas a medida",
    icon: PanelsTopLeft,
    problem:
      "Tus procesos ya no se sostienen con planillas, mensajes sueltos o herramientas incómodas.",
    benefit:
      "Más orden y visibilidad en una herramienta pensada para tu forma de trabajar.",
    description:
      "Paneles, formularios y herramientas internas adaptadas al funcionamiento real de la empresa.",
    cta: "Quiero ordenar esto",
  },
];

export const painPoints = [
  "Tareas repetitivas todos los días.",
  "Consultas que quedan sin seguimiento.",
  "Información repartida en varios lugares.",
  "Respuestas que llegan demasiado tarde.",
];

export const processSteps = [
  {
    title: "Diagnóstico",
    description:
      "Entendemos el proceso actual y detectamos dónde hoy se pierde tiempo, control o ventas.",
  },
  {
    title: "Diseño de la solución",
    description:
      "Definimos una solución clara y viable según el impacto esperado y la forma real en que trabaja la empresa.",
  },
  {
    title: "Implementación",
    description:
      "Implementamos y ajustamos la solución para que empiece a dar valor en el uso cotidiano.",
  },
  {
    title: "Medición y mejora",
    description:
      "Revisamos resultados y ajustamos donde todavía haya fricción o pérdida de tiempo.",
  },
];

export const benefits = [
  {
    title: "Ahorrás tiempo",
    description: "Las tareas repetitivas avanzan sin intervención manual.",
    icon: Clock3,
  },
  {
    title: "Reducís errores",
    description: "La información se registra y circula de forma más ordenada.",
    icon: CheckCircle2,
  },
  {
    title: "Respondés más rápido",
    description: "Consultas, alertas y seguimientos no quedan olvidados.",
    icon: Zap,
  },
  {
    title: "Ganás control",
    description: "Sabés qué ocurrió, qué está pendiente y qué sigue.",
    icon: PanelsTopLeft,
  },
];

export const fitSignals = [
  {
    title: "Te conviene si hoy...",
    items: [
      "Hay tareas importantes que siguen dependiendo de mensajes o memoria.",
      "Se enfrían consultas, presupuestos o pendientes por falta de seguimiento.",
      "Tu equipo pierde tiempo repitiendo pasos que podrían resolverse solos.",
    ],
  },
  {
    title: "El cambio que buscás es...",
    items: [
      "Ordenar un proceso puntual antes de que siga creciendo el desorden.",
      "Responder más rápido sin sumar carga manual al equipo.",
      "Tener más visibilidad sobre qué pasó, qué falta y qué sigue.",
    ],
  },
  {
    title: "No necesitás...",
    items: [
      "Rehacer toda la operación para empezar a mejorar.",
      "Un proyecto enorme para ver un resultado concreto.",
      "Tener todo definido de antemano para pedir una demo o una primera revisión.",
    ],
  },
];

export const faqs = [
  {
    question: "¿Mi empresa necesita conocimientos técnicos para empezar?",
    answer:
      "No. La primera parte del trabajo consiste en entender el proceso y traducirlo a una solución clara. La idea es que el equipo pueda usarla sin depender de explicaciones técnicas.",
  },
  {
    question: "¿Qué tipo de procesos se pueden mejorar?",
    answer:
      "Seguimientos, carga o movimiento de información, recordatorios, alertas, formularios internos y tareas repetitivas que hoy consumen tiempo o generan errores.",
  },
  {
    question: "¿Siempre hace falta implementar algo grande?",
    answer:
      "No. Muchas veces el mayor valor aparece resolviendo un cuello de botella puntual, sin rehacer toda la operación.",
  },
  {
    question: "¿Cómo sé si esto me conviene?",
    answer:
      "La demo o la primera conversación sirve justamente para eso: entender si hay un problema con impacto real y si conviene resolverlo ahora.",
  },
  {
    question: "¿Cuánto tiempo lleva ver resultados?",
    answer:
      "Depende del caso, pero el objetivo es que el valor se note lo antes posible en el uso diario, no después de meses de trabajo abstracto.",
  },
  {
    question: "¿Es necesario cambiar los sistemas que ya utilizamos?",
    answer:
      "No siempre. Cuando es posible, la solución se integra con lo que ya usa la empresa para reducir fricción y aprovechar lo que hoy funciona.",
  },
  {
    question: "¿Cómo se inicia un proyecto?",
    answer:
      "Comienza con una conversación breve o una demo inicial para entender qué proceso querés mejorar y qué beneficio tendría resolverlo.",
  },
  {
    question: "¿Qué información necesitan en la primera reunión?",
    answer:
      "Alcanza con describir el proceso actual, qué tarea te hace perder más tiempo, dónde se enfrían oportunidades y qué impacto tendría ordenarlo mejor.",
  },
];

export const solutionOptions = [
  "Automatizar tareas repetitivas",
  "Mejorar el seguimiento",
  "Crear una herramienta interna",
  "Integrar sistemas",
  "Centralizar información",
  "Consultoría y diagnóstico de procesos",
  "Todavía no lo tengo definido",
];

export const diagnosticGoals = [
  "Automatizar tareas repetitivas",
  "Mejorar el seguimiento",
  "Crear una herramienta interna",
  "Integrar sistemas",
  "Centralizar información",
  "Todavía no estoy seguro",
];
