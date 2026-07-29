-- Limpieza operativa del CRM
-- Conserva usuarios y estructura
-- Elimina la data comercial cargada para dejar el CRM listo para uso real

BEGIN;

TRUNCATE TABLE
  crm_messages,
  crm_conversation_events,
  crm_tasks,
  crm_activities,
  crm_conversations,
  crm_leads
RESTART IDENTITY CASCADE;

COMMIT;
