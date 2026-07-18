# Deployment Notes

Este archivo resume lo que se hizo para dejar funcionando `Aula64` y `SolutiogeniZ` en la misma VPS usando Easypanel.

## Estado actual

- VPS: Ubuntu 24.04.4 LTS
- IP publica: `149.50.153.5`
- Easypanel: instalado y operativo
- Aula64: migrado a Easypanel y funcionando con HTTPS
- SolutiogeniZ: desplegado en Easypanel y funcionando con dominio propio
- n8n: pendiente

## Servicios activos en Easypanel

### Proyecto: `aula64`

- Servicio: `web`
- Fuente: Git
- Repositorio: `https://github.com/ubolm/aula64-react.git`
- Rama: `main`
- Build: `Dockerfile`
- Puerto interno del servicio: `80`

### Proyecto: `solutiogeniz`

- Servicio: `web`
- Fuente: Git
- Repositorio: `https://github.com/ubolm/SolutiogeniZ.git`
- Rama: `main`
- Build: `Dockerfile`
- Puerto interno del servicio: `3000`

## DNS en DonWeb

### Aula64

El sitio ya estaba apuntando a la VPS y se mantuvo funcionando durante la migracion.

### SolutiogeniZ

Quedaron estos registros:

- `A  solutiogeniz.com -> 149.50.153.5`
- `A  www.solutiogeniz.com -> 149.50.153.5`

Importante:

- Se elimino un `CNAME` duplicado de `www.solutiogeniz.com`
- No conviene tener al mismo tiempo `A` y `CNAME` para el mismo host

## Dominios en Easypanel

### Aula64

- Dominio principal recomendado: `https://www.aula64.com.ar`
- Dominio secundario: `https://aula64.com.ar`
- Redireccion recomendada: `aula64.com.ar -> https://www.aula64.com.ar`

### SolutiogeniZ

- Dominio principal: `https://solutiogeniz.com`
- Dominio secundario: `https://www.solutiogeniz.com`
- Redireccion configurada: `https://www.solutiogeniz.com/(.*) -> https://solutiogeniz.com/$1`

## Variables de entorno de SolutiogeniZ

Configuradas en Easypanel:

```env
CONTACT_TO_EMAIL=uboldi.lucasmicael@gmail.com
N8N_LEAD_WEBHOOK_URL=
NEXT_PUBLIC_BOOKING_URL=
NEXT_PUBLIC_SITE_URL=https://solutiogeniz.com
RESEND_API_KEY=
```

Notas:

- `CONTACT_TO_EMAIL` ya apunta al correo real de recepcion
- `N8N_LEAD_WEBHOOK_URL` queda pendiente hasta definir el webhook final
- `NEXT_PUBLIC_BOOKING_URL` queda pendiente hasta definir la herramienta de agenda
- `RESEND_API_KEY` queda pendiente hasta habilitar envio real de correos

## Ajustes tecnicos hechos en SolutiogeniZ

Se preparó el proyecto para desplegar bien en Easypanel:

- `next.config.mjs`
  - se agrego `output: 'standalone'`
- `Dockerfile`
  - despliegue con Node 20 Alpine
  - build de Next
  - runtime con `server.js`
- `.dockerignore`
  - excluye `.next`, `node_modules`, `.env.local`, logs y archivos temporales

## Problemas encontrados y resolucion

### 1. Easypanel no abria en `:3000`

Problema:

- Easypanel estaba levantado en la VPS, pero el panel no cargaba desde afuera

Causa:

- Firewall de DonWeb no tenia abierto el puerto `3000`

Resolucion:

- Se agrego regla TCP IPv4 para `3000`

### 2. Aula64 quedaba en `404 Not Found`

Problema:

- El dominio llegaba a Easypanel, pero no estaba asociado al servicio

Resolucion:

- Se agregaron `aula64.com.ar` y `www.aula64.com.ar` al servicio `web`

### 3. SolutiogeniZ mostraba `Service is not reachable`

Problema:

- El dominio apuntaba al servicio por puerto `80`

Causa:

- SolutiogeniZ corre como app Next en puerto `3000`

Resolucion:

- Se editaron los dominios para que apunten a `http://solutiogeniz_web:3000/`

### 4. SolutiogeniZ mostraba certificado no valido

Problema:

- El navegador mostraba certificado autofirmado de Easypanel

Diagnostico:

- `curl -Iv https://solutiogeniz.com` devolvia `self-signed certificate`
- El visor del navegador mostraba certificado emitido por `Easypanel`

Resolucion:

- Se corrigio el DNS en DonWeb
- Se dejaron los dominios bien cargados en Easypanel
- Se reintentaron guardados e implementaciones
- Con el dominio apuntando bien y el servicio en el puerto correcto, el sitio termino estabilizando

## Comandos utiles de diagnostico

### Estado del stack viejo de Aula64

```bash
cd ~/aula64-react
docker compose config
docker compose up -d
docker compose down
docker ps -a
```

### Verificar resolucion DNS

```bash
dig +short aula64.com.ar
dig +short www.aula64.com.ar
dig +short solutiogeniz.com
dig +short www.solutiogeniz.com
```

### Verificar respuesta HTTP/HTTPS

```bash
curl -I http://aula64.com.ar
curl -I https://www.aula64.com.ar
curl -I https://solutiogeniz.com
curl -I https://www.solutiogeniz.com
```

### Verificar certificado

```bash
curl -Iv https://solutiogeniz.com
curl -Iv https://www.solutiogeniz.com
```

## Git y repositorios

### Aula64

- Ya existia repo remoto y se reutilizo

### SolutiogeniZ

- Repo creado: `https://github.com/ubolm/SolutiogeniZ`
- Se reinicializo Git local porque habia una carpeta `.git` vacia
- Se hizo commit inicial y push a `main`

## Pendientes operativos

- Definir `N8N_LEAD_WEBHOOK_URL`
- Definir `RESEND_API_KEY`
- Definir `NEXT_PUBLIC_BOOKING_URL`
- Confirmar si `www.solutiogeniz.com` debe quedar solo como redireccion
- Sumar `n8n` como tercer proyecto en Easypanel
- Documentar acceso y backups del panel

## Evolution API para SolutiogeniZ

Datos confirmados el sabado 18 de julio de 2026:

- Evolution manager: `https://evolution.solutiogeniz.com/manage`
- Evolution base URL para la app: `https://evolution.solutiogeniz.com`
- Instancia conectada: `solutiogeniz - ChatBot`
- Numero vinculado: `5491178225683`

Variables que conviene cargar en Easypanel para el proyecto `solutiogeniz`:

```env
EVOLUTION_API_BASE_URL=https://evolution.solutiogeniz.com
EVOLUTION_API_INSTANCE_NAME=solutiogeniz - ChatBot
EVOLUTION_API_KEY=[tu api key]
NEXT_PUBLIC_SITE_URL=https://solutiogeniz.com
```

Webhook publico esperado:

```text
https://solutiogeniz.com/api/whatsapp/webhook
```

Configuracion sugerida en Evolution:

- habilitado: `true`
- `webhook_by_events = false`
- eventos: `MESSAGES_UPSERT`

Prueba funcional esperada:

1. enviar un mensaje real al WhatsApp conectado en Evolution;
2. verificar que el webhook llegue a `https://solutiogeniz.com/api/whatsapp/webhook`;
3. confirmar que se crea o actualiza el lead en `/crm/leads`;
4. confirmar que aparece actividad en `/crm/conversaciones`;
5. verificar que la respuesta automatica vuelve al WhatsApp del contacto.

## Recomendacion de cierre

Guardar en un lugar seguro:

- acceso a Easypanel
- acceso a DonWeb
- nombres de repositorios GitHub
- IP publica de la VPS
- dominio principal de cada proyecto
