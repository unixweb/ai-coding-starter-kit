-- PROJ-13: Portal-Detail-Seite Redesign
-- Neue Spalte: description fuer Portal-Beschreibung

ALTER TABLE portal_links ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
