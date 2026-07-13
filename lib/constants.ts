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
  tagline: "Dejá de perder tiempo y oportunidades.",
  description:
    "Ordenamos tareas, seguimientos y datos para que tu empresa responda más rápido y deje de perder oportunidades.",
  trustLine:
    "Empezamos por un problema puntual y buscamos una mejora clara, útil y fácil de adoptar.",
};

export const businessContact = {
  email: "lucas@solutiogeniz.com",
  phone: "1160418279",
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
      "Tareas repetitivas que hacen perder tiempo todos los días.",
    benefit:
      "Menos tareas manuales y más tiempo para vender, atender y decidir mejor.",
    description:
      "Automatizamos avisos, registros y pasos operativos para que el proceso avance sin depender de recordatorios ni carga manual.",
    cta: "Analizar este proceso",
  },
  {
    name: "Seguimiento comercial y operativo",
    icon: RefreshCcw,
    problem:
      "Consultas, presupuestos o tareas que se enfrían por falta de seguimiento.",
    benefit:
      "Más respuestas a tiempo y menos oportunidades perdidas.",
    description:
      "Organizamos alertas y actualizaciones automáticas para que cada oportunidad y cada pendiente sigan avanzando.",
    cta: "Mejorar mi seguimiento",
  },
  {
    name: "Chatbots y atención automática",
    icon: MessageSquareMore,
    problem:
      "Consultas que se acumulan o equipos que repiten las mismas respuestas.",
    benefit:
      "Respuestas más rápidas sin cargar a tu equipo con lo repetitivo.",
    description:
      "Creamos asistentes que responden, toman datos y derivan cada caso cuando hace falta intervención humana.",
    cta: "Automatizar mi atención",
  },
  {
    name: "Herramientas internas a medida",
    icon: PanelsTopLeft,
    problem:
      "Procesos que ya no se sostienen con planillas, mensajes sueltos o herramientas incómodas.",
    benefit:
      "Más orden y una herramienta pensada para cómo trabajás de verdad.",
    description:
      "Creamos paneles, formularios y herramientas internas adaptadas a la operación real de cada empresa.",
    cta: "Crear una herramienta",
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
