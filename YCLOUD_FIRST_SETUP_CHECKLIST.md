# Primer setup de YCloud + n8n para SolutiogeniZ

## Orden recomendado

1. dejar funcionando `YCloud` con el proyecto;
2. probar mensaje real de WhatsApp;
3. confirmar que entra al CRM;
4. despues conectar `n8n`.

## Paso 1. Tener el proyecto local levantado

Verifica que el proyecto abra en:

```text
http://localhost:3000
```

Y que el webhook responda:

```text
http://localhost:3000/api/whatsapp/webhook
```

## Paso 2. Exponer tu proyecto local a internet

YCloud necesita una URL publica. Si estas trabajando local, `localhost` no sirve.

Opciones simples:

- `Cloudflare Tunnel`
- `ngrok`

La URL publica debe terminar apuntando a:

```text
https://TU-URL-PUBLICA/api/whatsapp/webhook
```

## Paso 3. Preparar variables del proyecto

En `.env.local` deja estas variables para YCloud:

```bash
YCLOUD_API_KEY=
YCLOUD_WHATSAPP_FROM=
YCLOUD_WEBHOOK_SECRET=
```

Y para evitar confusion, deja vacias estas si no las vas a usar:

```bash
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
EVOLUTION_API_BASE_URL=
EVOLUTION_API_INSTANCE_NAME=
EVOLUTION_API_KEY=
```

## Paso 4. Conseguir los datos en YCloud

Dentro de YCloud necesitas ubicar:

1. `API Key`
2. el numero de envio de WhatsApp
3. el `Webhook Secret`

Esos tres valores van a las variables del proyecto:

- `YCLOUD_API_KEY`
- `YCLOUD_WHATSAPP_FROM`
- `YCLOUD_WEBHOOK_SECRET`

## Paso 5. Crear el webhook en YCloud

En YCloud:

1. entra a `Developers`
2. entra a `Webhooks`
3. crea un endpoint nuevo
4. pega esta URL:

```text
https://TU-URL-PUBLICA/api/whatsapp/webhook
```

5. suscribe al menos este evento:

```text
whatsapp.inbound_message.received
```

Opcional para despues:

```text
whatsapp.message.updated
```

## Paso 6. Reiniciar el proyecto local

Despues de guardar `.env.local`, reinicia el proyecto para que tome las nuevas variables.

## Paso 7. Hacer la primera prueba real

Prueba simple:

1. envia un WhatsApp al numero conectado en YCloud
2. espera la respuesta automatica
3. entra al CRM
4. verifica:
   - si se creo o actualizo el lead
   - si aparecio la conversacion
   - si quedo registrada la actividad

## Paso 8. Confirmar que el proveedor activo sea YCloud

Si configuraste bien YCloud y dejaste vacios los otros proveedores, el proyecto ya deberia trabajar con YCloud como prioridad.

## Paso 9. Recién después conectar n8n

Cuando YCloud ya funcione, el siguiente paso es definir que quieres automatizar en `n8n`.

Primer flujo recomendado:

1. entra un mensaje nuevo;
2. el CRM crea o actualiza el lead;
3. `n8n` recibe el evento;
4. `n8n` asigna responsable o crea tarea.

## Paso 10. No mezclar todo de entrada

Recomendacion importante:

- primero no metas `n8n` en el medio del webhook de YCloud;
- primero valida `YCloud -> proyecto -> CRM`;
- despues sumamos `n8n`.

Eso evita que si algo falla no tengas que adivinar si fue YCloud, el proyecto o n8n.
