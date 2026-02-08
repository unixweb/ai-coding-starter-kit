-- ============================================================
-- Migration: Add file status tracking for portal uploads
-- Feature: PROJ-17 (Dashboard Uploads Redesign)
-- ============================================================

-- 1. Create file_status ENUM type
CREATE TYPE file_status AS ENUM ('new', 'in_progress', 'done', 'archived');

-- 2. Create portal_file_status table
-- Stores the work status for each file uploaded via portal links
CREATE TABLE IF NOT EXISTS public.portal_file_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.portal_links(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.portal_submissions(id) ON DELETE CASCADE,
  file_url VARCHAR(1000) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  status file_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(file_url)
);

-- 3. Enable Row Level Security
ALTER TABLE public.portal_file_status ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for portal_file_status

-- Users can read file status for their own links
CREATE POLICY "Users can read own file status"
  ON public.portal_file_status
  FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.portal_links WHERE user_id = auth.uid()
    )
  );

-- Users can insert file status for their own links
CREATE POLICY "Users can insert own file status"
  ON public.portal_file_status
  FOR INSERT
  WITH CHECK (
    link_id IN (
      SELECT id FROM public.portal_links WHERE user_id = auth.uid()
    )
  );

-- Users can update file status for their own links
CREATE POLICY "Users can update own file status"
  ON public.portal_file_status
  FOR UPDATE
  USING (
    link_id IN (
      SELECT id FROM public.portal_links WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    link_id IN (
      SELECT id FROM public.portal_links WHERE user_id = auth.uid()
    )
  );

-- Users can delete file status for their own links
CREATE POLICY "Users can delete own file status"
  ON public.portal_file_status
  FOR DELETE
  USING (
    link_id IN (
      SELECT id FROM public.portal_links WHERE user_id = auth.uid()
    )
  );

-- 5. Indexes for filter and query performance
CREATE INDEX IF NOT EXISTS idx_file_status_link_id ON public.portal_file_status(link_id);
CREATE INDEX IF NOT EXISTS idx_file_status_submission_id ON public.portal_file_status(submission_id);
CREATE INDEX IF NOT EXISTS idx_file_status_status ON public.portal_file_status(status);
CREATE INDEX IF NOT EXISTS idx_file_status_created_at ON public.portal_file_status(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_status_filename ON public.portal_file_status(filename);

-- 6. Trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_file_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_status_updated
  BEFORE UPDATE ON public.portal_file_status
  FOR EACH ROW
  EXECUTE FUNCTION update_file_status_timestamp();
