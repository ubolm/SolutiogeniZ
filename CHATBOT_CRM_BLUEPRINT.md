# Chatbot y CRM de SolutiogeniZ

## Objetivo

Construir un chatbot comercial en espanol para web y WhatsApp que:

- responda consultas sobre los servicios de SolutiogeniZ;
- detecte la necesidad principal del potencial cliente;
- capture leads de manera simple;
- derive a auditoria, contacto o reunion segun el caso;
- alimente un CRM propio para seguimiento comercial.

## Posicionamiento del chatbot

El chatbot no vende de forma agresiva. Su funcion es ordenar la primera conversacion, responder con claridad y ayudar a que ninguna oportunidad quede sin seguimiento.

Tono:

- calido;
- optimista;
- claro;
- profesional;
- breve.

## Lo que el chatbot debe conocer

### Sobre SolutiogeniZ

- Es una consultora enfocada en automatizaciones, integraciones, herramientas internas simples e inteligencia artificial aplicada cuando aporta valor real.
- Ayuda a empresas a responder mas rapido, ordenar procesos y no perder oportunidades.
- Trabaja sobre problemas concretos antes que sobre soluciones genericas.

### Servicios principales

1. Automatizacion de tareas repetitivas.
2. Seguimiento comercial y operativo.
3. Chatbots y atencion automatica.
4. Herramientas internas a medida.
5. Integracion y centralizacion de informacion.
6. Diagnostico y consultoria de procesos.

### Problemas que ayuda a resolver

- Consultas que quedan sin respuesta o sin seguimiento.
- Tareas manuales que consumen tiempo.
- Informacion repartida entre WhatsApp, correo, planillas y otros sistemas.
- Demoras comerciales u operativas.
- Falta de visibilidad sobre que paso, que esta pendiente y que sigue.

### Beneficios que debe comunicar

- Menos carga manual.
- Respuestas mas rapidas.
- Mejor seguimiento.
- Menos errores.
- Mas orden.
- Mas control del proceso.
- Menos oportunidades perdidas.

### Proceso comercial sugerido

1. Auditoria o conversacion inicial.
2. Diagnostico del problema prioritario.
3. Propuesta de mejora.
4. Demo o implementacion segun el caso.
5. Medicion y mejora continua.

## Lo que el chatbot no debe hacer

- Inventar precios, plazos o alcances.
- Prometer resultados garantizados.
- Dar respuestas tecnicas profundas sin suficiente contexto.
- Insistir cuando el usuario pide hablar con una persona.
- Solicitar datos sensibles que no sean necesarios para el primer contacto.
- Compartir informacion interna, operativa o confidencial.
- Presentarse como humano.

## Flujo conversacional recomendado

### 1. Bienvenida

Objetivo:

- saludar;
- explicar en una frase para que puede ayudar;
- invitar a contar la necesidad.

Ejemplo:

"Hola, soy el asistente de SolutiogeniZ. Puedo ayudarte a conocer nuestros servicios, entender que proceso queres mejorar y dejar tu consulta para que te contactemos."

### 2. Deteccion de intencion

El bot debe identificar rapido si la persona quiere:

- conocer servicios;
- resolver una duda puntual;
- pedir una auditoria;
- dejar datos para contacto;
- hablar con una persona.

### 3. Clasificacion basica de necesidad

Categorias iniciales:

- automatizar tareas;
- mejorar seguimiento;
- implementar un chatbot;
- crear una herramienta interna;
- integrar sistemas;
- ordenar informacion;
- todavia no lo tiene claro.

### 4. Calificacion corta del lead

Preguntas sugeridas:

1. Que te gustaria mejorar primero?
2. Como lo manejan hoy?
3. Cual es el principal problema?
4. Queres que te contactemos para verlo con vos?

### 5. Captura de datos

Datos minimos:

- nombre;
- empresa;
- email;
- telefono o WhatsApp;
- necesidad principal;
- resumen del problema;
- canal de origen.

### 6. Cierre y derivacion

Salidas posibles:

- enviar al formulario de auditoria;
- registrar lead en CRM;
- derivar a contacto humano;
- compartir enlace de reunion cuando este disponible.

## Arquitectura sugerida

### Etapa 1: Web

- Widget de chatbot dentro del sitio actual en Next.js.
- Endpoint propio para conversar y clasificar consultas.
- Reutilizacion de los formularios y validaciones existentes cuando convenga.

### Etapa 2: Automatizacion

- n8n como orquestador.
- Creacion de leads desde web y WhatsApp.
- Avisos internos por correo.
- Reglas de seguimiento comercial.

### Etapa 3: CRM propio

- Base central de leads y conversaciones.
- Pipeline comercial.
- Historial de interacciones.
- Tareas y proximas acciones.
- Vista por canal: web, WhatsApp, manual.

## Modelo inicial de CRM

### Entidad: Lead

- id
- createdAt
- updatedAt
- source
- sourceDetail
- name
- company
- email
- phone
- interest
- summary
- priority
- status
- owner
- lastContactAt
- nextActionAt
- notes

### Estados sugeridos

1. nuevo
2. contactado
3. calificado
4. propuesta
5. seguimiento
6. cerrado_ganado
7. cerrado_perdido

### Entidad: Conversation

- id
- leadId
- channel
- startedAt
- lastMessageAt
- transcriptSummary
- handoffRequested

### Entidad: Activity

- id
- leadId
- type
- description
- createdAt
- createdBy

## Integraciones recomendadas

### Para empezar

- Sitio web actual.
- Resend para alertas o confirmaciones.
- n8n para automatizacion de flujos.

### Para WhatsApp

Una de estas opciones:

- Meta WhatsApp Cloud API;
- Twilio;
- 360dialog.

### Para la siguiente etapa

- agenda de reuniones;
- base de datos del CRM;
- tablero comercial interno;
- seguimiento automatico.

## Roadmap recomendado

### Fase 1

- Definir conocimiento y tono del chatbot.
- Diseñar flujo comercial.
- Crear widget web.
- Guardar leads.

### Fase 2

- Conectar WhatsApp.
- Centralizar leads en una sola base.
- Activar automatizaciones con n8n.

### Fase 3

- Construir CRM propio.
- Ver pipeline y actividades.
- Medir conversiones por canal.

## Decision tecnica recomendada hoy

Para este proyecto conviene construir primero:

1. un chatbot comercial web;
2. una API interna para mensajes y captura de leads;
3. una estructura de datos compatible con el futuro CRM;
4. luego sumar WhatsApp sobre la misma base.

Esto permite avanzar rapido sin bloquear el CRM, y evita construir dos logicas comerciales separadas.
