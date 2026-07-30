# Integracion YCloud + n8n para SolutiogeniZ

## Objetivo

Usar `YCloud` como proveedor oficial de WhatsApp y `n8n` como capa de automatizacion, dejando el `CRM` como base interna de leads, conversaciones y seguimiento comercial.

## Estado actual del proyecto

La aplicacion ya queda preparada para:

- recibir mensajes entrantes por `YCloud` en `app/api/whatsapp/webhook/route.ts`;
- responder mensajes de texto desde `lib/whatsapp.ts`;
- guardar actividad, conversaciones y leads dentro del CRM;
- seguir usando `Meta Cloud API` o `Evolution` si hiciera falta, aunque el camino recomendado ahora es `YCloud`.

## Variables nuevas

Agregar en `.env.local` o en produccion:

```bash
YCLOUD_API_KEY=
YCLOUD_WHATSAPP_FROM=
YCLOUD_WEBHOOK_SECRET=
N8N_CRM_EVENTS_WEBHOOK_URL=
N8N_CRM_EVENTS_WEBHOOK_SECRET=
```

- `YCLOUD_API_KEY`: API key de YCloud.
- `YCLOUD_WHATSAPP_FROM`: numero de WhatsApp Business en formato E.164, por ejemplo `+5491178225683`.
- `YCLOUD_WEBHOOK_SECRET`: secret de firma del endpoint webhook en YCloud.
- `N8N_CRM_EVENTS_WEBHOOK_URL`: webhook privado de n8n que recibira eventos internos del CRM.
- `N8N_CRM_EVENTS_WEBHOOK_SECRET`: secreto opcional enviado por el CRM en el header `x-sgz-crm-secret`.

## Flujo recomendado

### Etapa 1: conexion directa minima

```text
Cliente WhatsApp
  -> YCloud
  -> /api/whatsapp/webhook
  -> CRM
  -> respuesta automatica
  -> YCloud
  -> Cliente WhatsApp
```

Esto sirve para validar:

- que el numero ya esta operativo;
- que el CRM recibe mensajes;
- que el lead se crea o actualiza;
- que la respuesta automatica vuelve al usuario.

### Etapa 2: automatizacion con n8n

```text
Cliente WhatsApp
  -> YCloud
  -> /api/whatsapp/webhook
  -> CRM
  -> webhook interno / salida a n8n
  -> automatizaciones
```

Recomendacion:

- dejar a `YCloud` hablando directo con el proyecto para no perder el registro operativo dentro del CRM;
- usar `n8n` para automatizaciones posteriores, no como reemplazo del registro base;
- mover a `n8n` cosas como alertas, asignacion, scoring, emails, recordatorios y tareas.

## Eventos que conviene automatizar en n8n

Prioridad alta:

1. lead nuevo creado desde WhatsApp.
2. mensaje nuevo recibido de un lead existente.
3. lead sin responsable.
4. lead con interes detectado.
5. lead sin respuesta por mas de X horas.

Prioridad media:

1. crear tarea automatica si entra una consulta comercial nueva.
2. avisar al vendedor correcto segun interes o zona.
3. mandar email interno al equipo.
4. registrar seguimiento automatico si hubo respuesta del bot.

## Configuracion sugerida en YCloud

Webhook endpoint:

```text
https://tu-dominio.com/api/whatsapp/webhook
```

Evento minimo a subscribir:

```text
whatsapp.inbound_message.received
```

Opcional para despues:

```text
whatsapp.message.updated
```

Ese segundo evento sirve si luego quieres medir:

- enviado;
- entregado;
- leido;
- fallido.

## Configuracion sugerida en n8n

Flujo 1:

- disparador por webhook o por polling interno;
- filtrar lead nuevo o mensaje nuevo;
- decidir responsable;
- crear aviso interno;
- opcionalmente generar tarea.

Webhook sugerido para eventos del CRM:

```text
POST https://n8n.tu-dominio.com/webhook/crm-whatsapp-inbound
```

Payload que hoy envia el CRM cuando entra un WhatsApp:

```json
{
  "event": "crm.whatsapp.inbound_message.received",
  "source": "solutiogeniz-crm",
  "occurredAt": "2026-07-30T15:00:00.000Z",
  "provider": "ycloud",
  "contact": {
    "phone": "5491178225683",
    "profileName": "Juan"
  },
  "message": {
    "text": "Hola, quiero una demo",
    "detectedInterest": "chatbots",
    "intent": "agendar_demo"
  },
  "lead": {
    "id": "lead_xxx",
    "name": "Juan",
    "company": "Sin empresa",
    "phone": "5491178225683",
    "interest": "chatbots",
    "status": "respondio",
    "owner": "Sin asignar",
    "nextActionAt": "2026-07-31T15:00:00.000Z",
    "source": "whatsapp"
  },
  "conversation": {
    "id": "conv_xxx",
    "channel": "whatsapp",
    "startedAt": "2026-07-30T15:00:00.000Z",
    "lastMessageAt": "2026-07-30T15:00:00.000Z",
    "detectedIntent": "agendar_demo",
    "isBotEnabled": true,
    "humanTakenBy": null,
    "assignedTo": null,
    "unreadCount": 1
  },
  "bot": {
    "shouldReply": true,
    "reply": "Te ayudo a entender..."
  }
}
```

Header opcional para validar origen:

```text
x-sgz-crm-secret: tu-secreto
```

Flujo 2:

- revisar leads sin respuesta;
- detectar vencidos por `nextActionAt`;
- enviar aviso interno al equipo;
- actualizar prioridad o dejar nota.

## Orden recomendado de implementacion

1. cargar credenciales reales de YCloud.
2. crear en n8n un webhook `POST` para `crm-whatsapp-inbound`.
3. copiar esa URL en `N8N_CRM_EVENTS_WEBHOOK_URL`.
4. si quieres validar origen, definir tambien `N8N_CRM_EVENTS_WEBHOOK_SECRET`.
5. validar que entra un mensaje real al CRM.
6. validar que la respuesta automatica sale por YCloud.
7. validar que n8n recibe el evento interno del CRM.
8. recien ahi agregar reglas reales de automatizacion.

## Siguiente paso tecnico recomendado

Cuando quieras seguir con esta integracion, el siguiente trabajo ideal es:

1. consumir en n8n el evento `crm.whatsapp.inbound_message.received`;
2. crear la primera automatizacion real: asignacion o tarea automatica;
3. sumar trazabilidad de estados del mensaje dentro del CRM.
