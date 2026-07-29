-- SolutiogeniZ CRM
-- Fase operativa para WhatsApp + equipo comercial + trazabilidad
-- Fecha: 2026-07-29
--
-- Este script es aditivo. Parte de las tablas ya existentes:
-- - crm_leads
-- - crm_conversations
-- - crm_activities
-- - crm_tasks
-- - crm_users

BEGIN;

ALTER TABLE crm_users
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

UPDATE crm_users
SET display_name = username
WHERE COALESCE(NULLIF(display_name, ''), '') = '';

ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS source_ref TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assigned_user_id TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage2 TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage3 TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS intake_channel TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_inbound_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_outbound_message_at TIMESTAMPTZ;

UPDATE crm_leads
SET
  assigned_user_id = NULLIF(assigned_user_id, assigned_user_id)
WHERE FALSE;

CREATE INDEX IF NOT EXISTS crm_leads_assigned_user_idx
  ON crm_leads (assigned_user_id);

CREATE INDEX IF NOT EXISTS crm_leads_last_inbound_idx
  ON crm_leads (last_inbound_message_at DESC);

ALTER TABLE crm_conversations
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'ycloud',
  ADD COLUMN IF NOT EXISTS provider_ref TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assigned_user_id TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_bot_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS bot_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bot_paused_by_user_id TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS human_taken_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS human_taken_by_user_id TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_inbound_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_outbound_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS crm_conversations_assigned_user_idx
  ON crm_conversations (assigned_user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS crm_conversations_provider_ref_idx
  ON crm_conversations (provider, provider_ref);

CREATE INDEX IF NOT EXISTS crm_conversations_bot_idx
  ON crm_conversations (is_bot_enabled, handoff_requested);

CREATE TABLE IF NOT EXISTS crm_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_message_id TEXT NOT NULL DEFAULT '',
  provider_status TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('contact', 'bot', 'user', 'system')),
  sender_user_id TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
  contact_phone TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'text',
  body TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crm_messages_conversation_idx
  ON crm_messages (conversation_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS crm_messages_lead_idx
  ON crm_messages (lead_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS crm_messages_provider_message_idx
  ON crm_messages (provider, provider_message_id);

CREATE INDEX IF NOT EXISTS crm_messages_direction_idx
  ON crm_messages (direction, sent_at DESC);

CREATE TABLE IF NOT EXISTS crm_conversation_events (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('bot', 'user', 'system')),
  actor_user_id TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crm_conversation_events_conversation_idx
  ON crm_conversation_events (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crm_auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES crm_users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS crm_auth_sessions_user_idx
  ON crm_auth_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS crm_auth_sessions_active_idx
  ON crm_auth_sessions (expires_at, revoked_at);

CREATE TABLE IF NOT EXISTS crm_audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_user_id TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  before_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crm_audit_log_entity_idx
  ON crm_audit_log (entity_type, entity_id, created_at DESC);

COMMIT;
