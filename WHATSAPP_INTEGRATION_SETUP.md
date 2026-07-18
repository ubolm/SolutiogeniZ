# Integracion WhatsApp Business para SolutiogeniZ

## Base implementada

El proyecto ya incluye una base tecnica para conectar WhatsApp Business con dos caminos posibles:

- webhook de verificacion y recepcion en `app/api/whatsapp/webhook/route.ts`;
- envio de mensajes desde `lib/whatsapp.ts`;
- logica comercial compartida del chatbot en `lib/chatbot-engine.ts`;
- registro de actividad y leads en el mini CRM desde `lib/crm-store.ts`.

Proveedores disponibles:

- `Meta Cloud API`
- `Evolution API`

## Variables necesarias

Configurar en `.env.local`:

```bash
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
EVOLUTION_API_BASE_URL=
EVOLUTION_API_INSTANCE_NAME=
EVOLUTION_API_KEY=
```

La prioridad actual del proyecto es:

1. `Evolution API` si esas variables existen.
2. `Meta Cloud API` si las variables de Evolution no existen y las de Meta si.

## Webhook a configurar en Meta

Usar esta ruta:

```text
https://tu-dominio.com/api/whatsapp/webhook
```

El token de verificacion debe coincidir con `WHATSAPP_VERIFY_TOKEN`.

## Webhook a configurar en Evolution

Usar esta misma ruta:

```text
https://tu-dominio.com/api/whatsapp/webhook
```

Recomendacion:

- `webhook_by_events`: `false`
- eventos: `MESSAGES_UPSERT`

## Que hace esta primera version

- valida el webhook;
- recibe mensajes de texto;
- genera una respuesta comercial automatica;
- envia la respuesta por WhatsApp;
- crea o actualiza un lead en `/crm` usando el telefono como referencia;
- guarda actividad de mensajes entrantes y salientes.

## Supuestos actuales

- solo procesa mensajes de texto;
- no maneja templates, multimedia ni botones interactivos;
- si el numero no existe en el CRM, crea un lead nuevo con origen `whatsapp`;
- usa la misma logica comercial del chatbot web para la primera capa de respuesta.

## Siguiente paso recomendado

Si usas Evolution:

1. cargar `EVOLUTION_API_BASE_URL`, `EVOLUTION_API_INSTANCE_NAME` y `EVOLUTION_API_KEY`;
2. configurar el webhook en Evolution;
3. enviar un mensaje real al numero conectado;
4. confirmar que entra al pipeline `/crm`.

Si usas Meta:

1. verificacion del webhook;
2. envio de un mensaje real al numero de SolutiogeniZ;
3. confirmacion de que entra al pipeline `/crm`;
4. ajuste del tono y de las respuestas iniciales para WhatsApp.
