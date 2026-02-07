-- ============================================================
-- Migration: Create portal tables for client upload portal
-- Feature: PROJ-8 (Mandanten-Upload-Portal)
-- ============================================================

-- 1. Create portal_links table
-- Stores invitation links that authenticated users create for their clients
CREATE TABLE IF NOT EXISTS public.portal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create portal_submissions table
-- Stores metadata for each upload submission made through a portal link
CREATE TABLE IF NOT EXISTS public.portal_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.portal_links(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  file_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.portal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_submissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for portal_links

-- Users can read their own links
CREATE POLICY "Users can read own portal links"
  ON public.portal_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own links
CREATE POLICY "Users can insert own portal links"
  ON public.portal_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own links (activate/deactivate)
CREATE POLICY "Users can update own portal links"
  ON public.portal_links
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SEC-1 FIX: Instead of a broad anonymous SELECT policy, we use a
-- security-definer function that only allows lookup by exact token.
-- This prevents anonymous users from enumerating all portal links.
CREATE OR REPLACE FUNCTION public.verify_portal_token(lookup_token TEXT)
RETURNS TABLE(id UUID, is_active BOOLEAN, expires_at TIMESTAMPTZ, label TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pl.id, pl.is_active, pl.expires_at, pl.label
  FROM public.portal_links pl
  WHERE pl.token = lookup_token
  LIMIT 1;
$$;

-- 5. RLS Policies for portal_submissions

-- Users can read submissions for their own links (via JOIN)
CREATE POLICY "Users can read submissions for own links"
  ON public.portal_submissions
  FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.portal_links WHERE user_id = auth.uid()
    )
  );

-- Public insert allowed (submissions come from unauthenticated clients)
-- The API route validates the token before inserting
CREATE POLICY "Anyone can insert portal submissions"
  ON public.portal_submissions
  FOR INSERT
  WITH CHECK (true);

-- BUG-4 FIX: Allow anonymous delete for cleanup when all file uploads fail
-- The submit API creates a submission first, then uploads files.
-- If all uploads fail, the submission must be deleted.
CREATE POLICY "Anyone can delete portal submissions"
  ON public.portal_submissions
  FOR DELETE
  USING (auth.uid() IS NULL);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_links_user_id ON public.portal_links(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_links_token ON public.portal_links(token);
CREATE INDEX IF NOT EXISTS idx_portal_submissions_link_id ON public.portal_submissions(link_id);
CREATE INDEX IF NOT EXISTS idx_portal_submissions_created_at ON public.portal_submissions(created_at DESC);
