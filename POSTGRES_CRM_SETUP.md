# CRM con Postgres

El CRM ya puede trabajar con Postgres. Si `POSTGRES_URL` o `DATABASE_URL` no
estan configuradas, sigue usando el archivo local como respaldo.

## Variables necesarias

```bash
POSTGRES_URL=
POSTGRES_SSL=false
```

- `POSTGRES_URL`: cadena de conexion completa a Postgres.
- `POSTGRES_SSL`: usar `true` solo si tu proveedor exige SSL.

## Como funciona la migracion

1. Cuando la app detecta Postgres, crea las tablas del CRM automaticamente.
2. Si la base esta vacia y existe data previa en el archivo local, intenta
   copiarla una sola vez a Postgres.
3. Desde ese momento, el CRM lee y escribe en la base.

## Tablas creadas

- `crm_leads`
- `crm_conversations`
- `crm_activities`
- `crm_tasks`

## En Easypanel

1. Crear un servicio Postgres.
2. Copiar la cadena de conexion completa.
3. Agregar `POSTGRES_URL` al servicio `web`.
4. Si tu Postgres usa SSL, agregar `POSTGRES_SSL=true`.
5. Redeployar la app.

## Verificacion rapida

Despues del deploy:

1. Entrar al CRM.
2. Crear o editar un lead.
3. Enviar un mensaje desde el chatbot o por WhatsApp.
4. Confirmar que los datos siguen ahi despues de reiniciar el contenedor.
