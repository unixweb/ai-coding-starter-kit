-- PROJ-10: Passwortschutz fuer Mandanten-Upload-Portal
-- Diese Migration fuegt Passwort-Support zu portal_links hinzu.
-- Ausfuehrung: Direkt im Supabase SQL Editor.

-- 1. Neue Spalten
ALTER TABLE portal_links ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE portal_links ADD COLUMN IF NOT EXISTS password_salt TEXT;
ALTER TABLE portal_links ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE portal_links ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

-- 2. Security-Definer-Funktion: verify_portal_password
--    Gibt Passwort-Hash und Status-Infos fuer einen Token zurueck.
--    Aufrufbar von anon (fuer oeffentlichen Passwort-Check).
CREATE OR REPLACE FUNCTION verify_portal_password(lookup_token TEXT)
RETURNS TABLE(
  id UUID,
  password_hash TEXT,
  password_salt TEXT,
  failed_attempts INTEGER,
  is_locked BOOLEAN,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, password_hash, password_salt, failed_attempts, is_locked, is_active, expires_at
  FROM portal_links
  WHERE token = lookup_token;
$$;

GRANT EXECUTE ON FUNCTION verify_portal_password(TEXT) TO anon, authenticated;

-- 3. Security-Definer-Funktion: increment_failed_attempts
--    Atomarer Inkrement von failed_attempts. Sperrt bei >= 5 Versuchen.
CREATE OR REPLACE FUNCTION increment_failed_attempts(link_uuid UUID)
RETURNS TABLE(failed_attempts INTEGER, is_locked BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE portal_links
  SET failed_attempts = portal_links.failed_attempts + 1,
      is_locked = CASE WHEN portal_links.failed_attempts + 1 >= 5 THEN true ELSE portal_links.is_locked END
  WHERE id = link_uuid
  RETURNING portal_links.failed_attempts, portal_links.is_locked;
$$;

GRANT EXECUTE ON FUNCTION increment_failed_attempts(UUID) TO anon, authenticated;

-- 4. Bestehende verify_portal_token erweitern: is_locked + has_password
CREATE OR REPLACE FUNCTION verify_portal_token(lookup_token TEXT)
RETURNS TABLE(
  id UUID,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  label TEXT,
  is_locked BOOLEAN,
  has_password BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, is_active, expires_at, label, is_locked,
         (password_hash IS NOT NULL) AS has_password
  FROM portal_links
  WHERE token = lookup_token;
$$;
