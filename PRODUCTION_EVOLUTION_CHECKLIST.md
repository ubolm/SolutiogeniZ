# Checklist de produccion con Evolution API

## Objetivo

Dejar `https://solutiogeniz.com` funcionando con:

- chatbot web en la pagina;
- CRM operativo;
- webhook publico de WhatsApp;
- integracion activa con Evolution API.

## Variables de entorno para Easypanel

```env
CONTACT_TO_EMAIL=uboldi.lucasmicael@gmail.com
NEXT_PUBLIC_SITE_URL=https://solutiogeniz.com
N8N_LEAD_WEBHOOK_URL=
NEXT_PUBLIC_BOOKING_URL=
RESEND_API_KEY=
EVOLUTION_API_BASE_URL=https://evolution.solutiogeniz.com
EVOLUTION_API_INSTANCE_NAME=solutiogeniz - ChatBot
EVOLUTION_API_KEY=[tu api key]
```

## Webhook de Evolution

URL final:

```text
https://solutiogeniz.com/api/whatsapp/webhook
```

Configuracion sugerida:

- habilitado: `true`
- `webhook_by_events`: `false`
- `base64`: `false`
- eventos:
  - `MESSAGES_UPSERT`

## Orden recomendado

1. subir estos cambios al repositorio del proyecto;
2. hacer redeploy del servicio `solutiogeniz` en Easypanel;
3. cargar las variables nuevas de Evolution;
4. guardar y esperar el nuevo deploy;
5. configurar el webhook de Evolution con la URL publica;
6. mandar un mensaje real al numero conectado;
7. revisar que aparezca en:
   - `/crm/conversaciones`
   - `/crm/leads`

## Resultado esperado

Cuando un contacto escriba por WhatsApp:

- Evolution envia el evento al webhook del sitio;
- el sitio procesa el mensaje;
- el CRM crea o actualiza el lead;
- se guarda la actividad;
- el bot responde automaticamente por WhatsApp.

## Si falla la prueba

Revisar en este orden:

1. que `solutiogeniz.com` este publicado y responda;
2. que `https://solutiogeniz.com/api/whatsapp/webhook` no devuelva error;
3. que las variables `EVOLUTION_*` esten cargadas en Easypanel;
4. que la instancia `solutiogeniz - ChatBot` siga conectada;
5. que el webhook de Evolution apunte exactamente a la URL publica final.
