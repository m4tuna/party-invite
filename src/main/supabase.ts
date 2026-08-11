import ws from 'ws'
import { createClient } from '@supabase/supabase-js'

// Polyfill WebSocket for Electron main process (Node < 22 has no native WebSocket)
if (typeof WebSocket === 'undefined') {
  (global as any).WebSocket = ws
}

const SUPABASE_URL = 'https://rfvcpnnbqihfwatrxhib.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_9ZwitUQo0Y-unPRePt9aCQ_Mn5UCh6i'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/*
-- Run in Supabase SQL editor once:
-- CREATE TABLE party_invite_parties (
--   id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   host_user_id text NOT NULL,
--   name         text NOT NULL,
--   date         timestamptz,
--   location     text,
--   description  text,
--   created_at   timestamptz DEFAULT now()
-- );
-- CREATE TABLE party_invite_guests (
--   id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   party_id        uuid NOT NULL REFERENCES party_invite_parties(id) ON DELETE CASCADE,
--   name            text NOT NULL,
--   email           text,
--   phone           text,
--   guest_token     uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
--   rsvp_status     text NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending','attending','declined')),
--   rsvp_at         timestamptz,
--   invite_sent_at  timestamptz,
--   created_at      timestamptz DEFAULT now()
-- );
-- ALTER PUBLICATION supabase_realtime ADD TABLE party_invite_guests;

Note: host_user_id is text (not uuid ref to auth.users) because we use Auth0 tokens, not Supabase Auth.
The host_user_id will be the Auth0 `sub` claim from the ID token.
No RLS needed for V1 — the host uses anon key + their own sub to filter.
*/
