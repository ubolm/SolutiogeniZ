# SolutiogeniZ CRM - Panorama actual y siguientes pasos

Fecha: 2026-07-29

## Estado actual

Hoy ya esta funcionando esta base:

- web publica desplegada
- CRM desplegado
- login con roles base (`admin` y `vendedor`)
- YCloud conectado
- webhook funcionando
- ingreso de mensajes de WhatsApp al sistema
- guardado de leads, conversaciones, actividades y tareas
- respuesta automatica del bot
- Postgres disponible y conectado como almacenamiento principal

## Lo que todavia falta para darlo por cerrado

### 1. Modo humano vs bot

Este es el punto mas importante para operacion real.

Hay que definir por conversacion:

- si responde el bot
- si responde una persona del equipo
- cuando el bot se pausa
- quien tomo la conversacion
- cuando vuelve a quedar liberada

Regla recomendada:

- si una persona del equipo envia un mensaje o toma la conversacion desde el CRM, el bot se pausa
- mientras el bot esta pausado, no debe responder automaticamente
- el admin puede reactivar el bot si quiere

### 2. Persistencia completa de mensajes

Hoy el CRM ya guarda la conversacion resumida, pero para una operacion comercial seria conviene guardar cada mensaje.

Minimo a registrar:

- id del mensaje del proveedor
- direccion (`inbound` / `outbound`)
- quien envio (`contact`, `bot`, `user`)
- texto
- estado del mensaje
- fechas de envio / entrega / lectura
- payload tecnico

### 3. Asignacion comercial

Hay que agregar:

- responsable del lead
- responsable de la conversacion
- posibilidad de tomar / liberar conversacion
- contador de no leidos
- prioridad operativa

### 4. Accesos y seguridad

Todavia falta reforzar:

- sesiones persistidas en base
- auditoria de cambios sensibles
- trazabilidad de acciones por usuario
- desactivar usuarios sin perder historial

### 5. n8n como automatizacion

n8n no deberia ser el canal principal de entrada.

Arquitectura recomendada:

- `YCloud -> CRM`
- `CRM -> n8n`

Casos de uso para n8n:

- crear tareas automaticas
- avisar a vendedor
- mandar alertas si una conversacion no tuvo respuesta
- clasificar leads
- enviar informacion a otras herramientas

### 6. Contenido editable

Mas adelante conviene sacar de codigo:

- textos del bot
- servicios
- prompts
- mensajes de bienvenida
- reglas comerciales basicas

Eso despues puede quedar en tablas de configuracion.

## Base de datos propuesta

El proyecto ya tenia tablas iniciales:

- `crm_leads`
- `crm_conversations`
- `crm_activities`
- `crm_tasks`
- `crm_users`

Para la siguiente etapa ya deje preparado este script:

- [db/2026-07-29-crm-operations-foundation.sql](C:/Users/Lucas/Documents/Consultora%20IA%20-%20SolutiongeniZ/db/2026-07-29-crm-operations-foundation.sql)

Ese script agrega la base estructural para:

- mensajes completos (`crm_messages`)
- eventos de conversacion (`crm_conversation_events`)
- sesiones (`crm_auth_sessions`)
- auditoria (`crm_audit_log`)
- asignacion de conversaciones
- pausa del bot
- referencias del proveedor

## Orden recomendado de implementacion

### Fase 1

- aplicar schema nuevo en Postgres
- empezar a guardar mensajes individuales
- agregar columnas de control de bot y responsable

### Fase 2

- implementar modo humano
- si una persona toma la conversacion, el bot se pausa
- permitir reactivar bot desde admin

### Fase 3

- conectar eventos utiles a n8n
- crear tareas / alertas automaticas

### Fase 4

- sesiones persistidas
- auditoria
- seguridad final

### Fase 5

- sacar contenido hardcodeado
- pasar configuraciones editables a base

## Siguiente paso concreto

El siguiente paso tecnico correcto es:

1. aplicar el script SQL nuevo
2. adaptar el backend para guardar `crm_messages`
3. agregar `is_bot_enabled` y `assigned_user_id` en la bandeja de conversaciones

Ese paso nos deja la base lista para que despues una vendedora pueda tomar una conversacion y el bot no se meta.
