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
```

- `YCLOUD_API_KEY`: API key de YCloud.
- `YCLOUD_WHATSAPP_FROM`: numero de WhatsApp Business en formato E.164, por ejemplo `+5491178225683`.
- `YCLOUD_WEBHOOK_SECRET`: secret de firma del endpoint webhook en YCloud.

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

Flujo 2:

- revisar leads sin respuesta;
- detectar vencidos por `nextActionAt`;
- enviar aviso interno al equipo;
- actualizar prioridad o dejar nota.

## Orden recomendado de implementacion

1. cargar credenciales reales de YCloud.
2. validar que entra un mensaje real al CRM.
3. validar que la respuesta automatica sale por YCloud.
4. definir que automatizacion va primero en n8n.
5. recien ahi conectar `n8n` con reglas reales.

## Siguiente paso tecnico recomendado

Cuando quieras seguir con esta integracion, el siguiente trabajo ideal es:

1. crear un evento interno del CRM para "mensaje WhatsApp recibido";
2. exponer una salida estable para `n8n`;
3. sumar trazabilidad de estados del mensaje dentro del CRM.
