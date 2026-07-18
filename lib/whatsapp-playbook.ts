export const whatsappSalesPlaybook = {
  tone: "calido, claro, optimista, profesional y breve",
  welcome:
    "Hola, soy el asistente de SolutiogeniZ. Te puedo ayudar a conocer nuestros servicios y a entender que proceso te conviene mejorar primero. Si queres, contame brevemente que necesitas.",
  services:
    "Podemos ayudarte con automatizacion de tareas, seguimiento comercial, chatbots, integraciones y herramientas internas. Si queres, contame que proceso te esta trayendo mas demora o desorden y te oriento por donde conviene empezar.",
  audit:
    "Perfecto. La auditoria inicial nos sirve para detectar donde hoy se te estan yendo tiempo, orden u oportunidades. Si queres, puedo dejar tu consulta para que el equipo la revise y te contacte.",
  humanHandoff:
    "Claro. Si queres, dejo tu consulta registrada para que alguien del equipo de SolutiogeniZ te contacte y lo vea con vos.",
  discovery:
    "Para orientarte mejor, contame en una o dos frases: 1. que te gustaria mejorar primero; 2. como lo manejan hoy; 3. cual es el principal problema.",
  unclearNeed:
    "No hay problema. Muchas veces el primer paso es ordenar donde hoy se traba mas el proceso. Si queres, contame que te esta pasando hoy y te ayudo a identificar por donde conviene empezar.",
  closing:
    "Perfecto, ya tengo contexto suficiente para dejarlo registrado. El equipo de SolutiogeniZ va a revisar tu caso y seguir la conversacion con vos.",
};

export const whatsappInterestReplies = {
  automatizaciones:
    "En ese caso podemos ayudarte a automatizar tareas repetitivas para que el proceso avance con menos carga manual y menos riesgo de olvidos o demoras.",
  seguimiento:
    "Ahi suele haber mucho valor. Podemos ayudarte a ordenar consultas, pendientes y oportunidades para que no se enfrien por falta de seguimiento.",
  chatbots:
    "Podemos ayudarte a responder mas rapido con un chatbot que tome datos, ordene consultas y derive cuando haga falta intervencion humana.",
  integraciones:
    "Podemos integrar herramientas para evitar doble carga, informacion suelta y procesos cortados entre sistemas.",
  "herramientas-internas":
    "Si hoy trabajan con planillas, mensajes sueltos o procesos incomodos, podemos armar una herramienta interna mas ordenada y pensada para el uso real del equipo.",
  centralizacion:
    "Podemos ayudarte a centralizar la informacion importante para que el proceso no dependa de varios lugares desconectados.",
  diagnostico:
    "A veces el mayor valor esta en hacer primero una lectura clara del proceso para decidir bien por donde conviene empezar.",
  "sin-definir":
    "No hace falta que lo tengas definido desde el principio. Si queres, contame que te esta pasando hoy y te ayudo a ubicar la mejor linea de trabajo.",
} as const;

export const whatsappBotRules = {
  shouldAutoReplyTo: [
    "consultas comerciales iniciales",
    "preguntas sobre servicios",
    "interes en auditoria",
    "primer contacto",
    "necesidades generales",
  ],
  shouldHandoffWhen: [
    "pide hablar con una persona",
    "consulta compleja o muy especifica",
    "quiere precios cerrados",
    "hay varias integraciones o condiciones tecnicas",
    "muestra interes real y ya dio contexto suficiente",
  ],
  shouldNeverDo: [
    "prometer resultados garantizados",
    "inventar plazos o precios",
    "usar tecnicismos innecesarios",
    "discutir implementacion profunda por WhatsApp",
    "insistir cuando la persona no quiere seguir",
  ],
};
