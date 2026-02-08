-- ============================================================
-- Migration: Add outgoing files for sending documents to clients
-- Feature: PROJ-15 (Dokumente an Mandanten senden)
-- ============================================================

-- 1. Add client_email column to portal_links
ALTER TABLE public.portal_links
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);

-- 2. Create portal_outgoing_files table
-- Stores files that are provided to clients for download
CREATE TABLE IF NOT EXISTS public.portal_outgoing_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.portal_links(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  blob_url VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  note TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.portal_outgoing_files ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for portal_outgoing_files

-- Authenticated users can manage their own outgoing files (via link ownership)
CREATE POLICY "Users can manage their outgoing files"
ON public.portal_outgoing_files
FOR ALL
USING (
  link_id IN (SELECT id FROM public.portal_links WHERE user_id = auth.uid())
)
WITH CHECK (
  link_id IN (SELECT id FROM public.portal_links WHERE user_id = auth.uid())
);

-- Anonymous users can read outgoing files for active, non-expired links
-- (Token validation happens in the API, this policy ensures files are only
-- accessible when the parent link is still valid)
CREATE POLICY "Anyone can read outgoing files for active links"
ON public.portal_outgoing_files
FOR SELECT
USING (
  link_id IN (
    SELECT id FROM public.portal_links
    WHERE is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  )
  AND (expires_at IS NULL OR expires_at > NOW())
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_outgoing_files_link_id
ON public.portal_outgoing_files(link_id);

CREATE INDEX IF NOT EXISTS idx_outgoing_files_expires_at
ON public.portal_outgoing_files(expires_at);

CREATE INDEX IF NOT EXISTS idx_portal_links_client_email
ON public.portal_links(client_email)
WHERE client_email IS NOT NULL;

-- 6. Update verify_portal_token function to include client_email
-- This allows the portal page to know if there's a client email configured
CREATE OR REPLACE FUNCTION public.verify_portal_token(lookup_token TEXT)
RETURNS TABLE(
  id UUID,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  label TEXT,
  is_locked BOOLEAN,
  has_password BOOLEAN,
  description TEXT,
  client_email VARCHAR
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pl.id,
    pl.is_active,
    pl.expires_at,
    pl.label,
    COALESCE(pl.is_locked, false) as is_locked,
    (pl.password_hash IS NOT NULL) as has_password,
    pl.description,
    pl.client_email
  FROM public.portal_links pl
  WHERE pl.token = lookup_token
  LIMIT 1;
$$;

-- 7. Create function to get outgoing files for a link (used by portal page)
-- This is a security-definer function to safely fetch files without exposing
-- the full portal_links table to anonymous users
CREATE OR REPLACE FUNCTION public.get_outgoing_files_by_token(lookup_token TEXT)
RETURNS TABLE(
  id UUID,
  filename VARCHAR,
  file_size BIGINT,
  note TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pof.id,
    pof.filename,
    pof.file_size,
    pof.note,
    pof.expires_at,
    pof.created_at
  FROM public.portal_outgoing_files pof
  INNER JOIN public.portal_links pl ON pl.id = pof.link_id
  WHERE pl.token = lookup_token
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > NOW())
    AND (pof.expires_at IS NULL OR pof.expires_at > NOW())
  ORDER BY pof.created_at DESC;
$$;
