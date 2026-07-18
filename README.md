# SolutiogeniZ

Sitio web oficial de SolutiogeniZ, una consultora enfocada en automatizaciones, integraciones, aplicaciones empresariales simples e Inteligencia Artificial aplicada cuando aporta valor real al proceso.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.

## Instalación

```bash
npm install
```

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## Variables de entorno

Crear un archivo `.env.local` basado en `.env.example`.

```bash
CONTACT_TO_EMAIL=
N8N_LEAD_WEBHOOK_URL=
NEXT_PUBLIC_BOOKING_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=
POSTGRES_URL=
POSTGRES_SSL=false
```

- `CONTACT_TO_EMAIL`: correo que recibirá las consultas del formulario de contacto.
- `N8N_LEAD_WEBHOOK_URL`: URL privada del webhook de n8n para recibir diagnósticos progresivos. No se expone en el cliente.
- `NEXT_PUBLIC_BOOKING_URL`: enlace externo para agendar reuniones. Si queda vacío, los CTAs llevan al formulario.
- `NEXT_PUBLIC_SITE_URL`: URL pública del sitio para metadata, sitemap y robots.
- `RESEND_API_KEY`: clave opcional para enviar correos con Resend.

## Cómo ejecutar el proyecto

```bash
npm run dev
```

Luego abrir `http://localhost:3000`.

## Diagnóstico progresivo

La sección “Diagnóstico inicial” permite que una empresa describa qué proceso quiere mejorar en seis pasos breves. El envío pasa por `app/api/diagnostic/route.ts`, valida los datos en servidor, aplica honeypot, controla envíos demasiado rápidos y limita intentos básicos por IP.

Cuando `N8N_LEAD_WEBHOOK_URL` está configurada, la API envía el diagnóstico a n8n. Si no lo está, la interfaz muestra un mensaje claro y no confirma un envío que no ocurrió.

## Formulario de contacto

La ruta `app/api/contact/route.ts` valida y recibe el formulario principal. Si `CONTACT_TO_EMAIL` y `RESEND_API_KEY` están configuradas, envía el correo mediante Resend.

Si no están configuradas, la API devuelve un mensaje claro y el formulario no confirma un envío que no ocurrió.

El formulario incluye:

- Validación de cliente y servidor.
- Honeypot anti-spam.
- Control básico de envío demasiado rápido.
- Consentimiento de privacidad.
- Estados de carga, error y confirmación.

## Analítica de conversión

La utilidad `trackConversionEvent` dispara eventos internos del navegador y, si existe `dataLayer`, también los publica allí. No envía nombres, correos, teléfonos, mensajes ni otros datos personales.

Eventos preparados:

- Inicio del diagnóstico.
- Avance de pasos del diagnóstico.
- Diagnóstico completado.
- Clic para agendar una reunión.

## Cómo reemplazar el logo

El wordmark temporal está en `components/brand/Wordmark.tsx`. Reemplazar el bloque visual por el logo definitivo cuando exista el archivo de marca.

Guardar assets definitivos en `public/brand`.

## Cómo configurar el enlace para agendar reuniones

Definir `NEXT_PUBLIC_BOOKING_URL` en `.env.local` con la URL real de Calendly, Cal.com u otra herramienta de reservas.

Si la variable no existe, el botón "Agendar una reunión" desplaza al formulario de contacto.

## Cómo desplegar el sitio

1. Configurar variables de entorno en la plataforma elegida.
2. Ejecutar `npm run build`.
3. Desplegar como aplicación Next.js.

Opciones habituales: Vercel, Netlify con soporte Next.js, Cloudflare Pages con adaptador correspondiente o servidor Node propio.

## Despliegue en Easypanel

- Fuente: repositorio Git.
- Rama: `main`.
- Ruta de compilaciÃ³n: `/`.
- Tipo de compilaciÃ³n: `Dockerfile`.
- Archivo: `Dockerfile`.
- Puerto interno del servicio: `3000`.

Variables recomendadas en producciÃ³n:

```bash
CONTACT_TO_EMAIL=
N8N_LEAD_WEBHOOK_URL=
NEXT_PUBLIC_BOOKING_URL=
NEXT_PUBLIC_SITE_URL=
RESEND_API_KEY=
POSTGRES_URL=
POSTGRES_SSL=false
```

## CRM y Postgres

El CRM ya soporta Postgres como backend principal.

- Si `POSTGRES_URL` o `DATABASE_URL` existen, el CRM usa la base.
- Si no existen, sigue usando el archivo local como respaldo.
- Las tablas del CRM se crean automaticamente en el primer arranque.

Guia corta: `POSTGRES_CRM_SETUP.md`

## Pendientes

- Logo definitivo.
- URL real de reservas.
- Textos legales finales de privacidad y términos.
- Configuración real del webhook de n8n.
