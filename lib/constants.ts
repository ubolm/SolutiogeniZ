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
    "Automatizamos tareas y seguimientos para que tu empresa responda más rápido, reduzca errores y no deje oportunidades en el camino.",
  trustLine:
    "Empezamos por un problema concreto y buscamos una mejora simple, útil y adaptada a tu operación.",
};

export const businessContact = {
  email: "lucas@solutiogeniz.com",
  phone: "1160418279",
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
      "Tareas repetitivas que consumen tiempo, generan errores y frenan el trabajo diario.",
    benefit:
      "Menos trabajo repetitivo, mayor velocidad y más tiempo para las tareas importantes.",
    description:
      "Automatizamos avisos, registros, cargas de información y pasos operativos para que los procesos avancen sin depender de tareas manuales.",
    cta: "Analizar este proceso",
  },
  {
    name: "Seguimiento comercial y operativo",
    icon: RefreshCcw,
    problem:
      "Consultas, presupuestos, pagos o tareas que quedan olvidados por falta de seguimiento.",
    benefit:
      "Menos oportunidades perdidas y mayor visibilidad sobre clientes, ventas y pendientes.",
    description:
      "Organizamos recordatorios, alertas y actualizaciones automáticas para mantener cada oportunidad y tarea bajo control.",
    cta: "Mejorar mi seguimiento",
  },
  {
    name: "Chatbots y atención automática",
    icon: MessageSquareMore,
    problem:
      "Consultas que llegan fuera de horario o equipos que responden constantemente las mismas preguntas.",
    benefit:
      "Respuestas más rápidas, mejor atención y menos carga operativa para tu equipo.",
    description:
      "Creamos asistentes que responden consultas frecuentes, recopilan información y derivan cada conversación cuando hace falta atención humana.",
    cta: "Automatizar mi atención",
  },
  {
    name: "Herramientas internas a medida",
    icon: PanelsTopLeft,
    problem:
      "Procesos que ya no funcionan bien con planillas, mensajes sueltos o sistemas demasiado complejos.",
    benefit:
      "Más orden, información centralizada y una herramienta diseñada para la operación real.",
    description:
      "Creamos paneles, formularios y aplicaciones simples adaptadas a la forma real en la que trabaja cada empresa.",
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
      "Entendemos el proceso actual, cómo circula la información y dónde hoy se están perdiendo tiempo, oportunidades o control.",
  },
  {
    title: "Diseño de la solución",
    description:
      "Definimos una propuesta clara y viable según el beneficio esperado, el alcance y la forma real en que trabaja la empresa.",
  },
  {
    title: "Implementación",
    description:
      "Construimos y ajustamos la solución con foco en adopción rápida, claridad operativa y valor visible desde el uso cotidiano.",
  },
  {
    title: "Medición y mejora",
    description:
      "Revisamos resultados, detectamos ajustes y seguimos mejorando donde el proceso todavía tenga fricción.",
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
