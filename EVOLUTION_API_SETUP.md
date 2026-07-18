# Evolution API para SolutiogeniZ

## Estado actual

Desde el 18 de julio de 2026 el proyecto ya puede trabajar con dos proveedores:

- `Meta Cloud API`
- `Evolution API`

La seleccion es automatica:

- si existen `EVOLUTION_API_BASE_URL`, `EVOLUTION_API_INSTANCE_NAME` y `EVOLUTION_API_KEY`, el proyecto usa `Evolution API`;
- si no existen esas variables, pero si estan las variables de Meta, usa `Meta Cloud API`.

## Variables para `.env.local`

```bash
EVOLUTION_API_BASE_URL=
EVOLUTION_API_INSTANCE_NAME=
EVOLUTION_API_KEY=
```

Ejemplo:

```bash
EVOLUTION_API_BASE_URL=https://tu-servidor-evolution.com
EVOLUTION_API_INSTANCE_NAME=solutiogeniz
EVOLUTION_API_KEY=tu_api_key
```

## Webhook a configurar en Evolution

Usar esta URL:

```text
https://tu-dominio.com/api/whatsapp/webhook
```

Recomendacion:

- `webhook_by_events`: `false`
- eventos: `MESSAGES_UPSERT`

## Endpoint recomendado en Evolution

Segun la documentacion oficial, el webhook se configura con:

```text
POST {baseUrl}/webhook/set/{instanceName}
```

Y el envio de mensajes usa:

```text
POST {baseUrl}/message/sendText/{instanceName}
```

## Que hace esta integracion

- recibe mensajes entrantes desde Evolution;
- procesa mensajes de texto;
- genera respuesta comercial automatica;
- guarda o actualiza el lead en el CRM;
- registra actividad de WhatsApp;
- responde el mensaje por el mismo canal.

## Formato esperado del payload

La integracion actual tolera estos formatos comunes de Evolution:

- payload directo con `key.remoteJid`, `pushName` y `message.conversation`;
- payload con `data` conteniendo ese mismo nodo;
- payload con `data.messages[]`.

## Importante

Esta primera version esta pensada para mensajes de texto simples. Todavia no maneja:

- multimedia;
- notas de voz;
- botones interactivos;
- listas;
- templates;
- verificacion criptografica propia de Evolution.

## Proxima prueba recomendada

1. cargar las tres variables de Evolution en `.env.local`;
2. desplegar o levantar el proyecto;
3. configurar el webhook en tu instancia de Evolution;
4. enviar un mensaje real al numero conectado;
5. verificar que aparezca en `/crm/conversaciones` y `/crm/leads`.
