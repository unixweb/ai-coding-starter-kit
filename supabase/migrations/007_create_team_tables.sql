-- ============================================================
-- Migration: Create team management tables
-- Feature: PROJ-18 (Team-Benutzer-Verwaltung)
-- ============================================================

-- 1. Add is_owner column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT false;

-- Set existing users as owners (sie haben sich selbst registriert)
UPDATE public.profiles SET is_owner = true WHERE is_owner = false;

-- 2. Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- 3. Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, member_id)
);

-- 4. Enable Row Level Security
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for team_invitations

-- Owners can read their own invitations
CREATE POLICY "Owners can read own invitations"
  ON public.team_invitations
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can create invitations
CREATE POLICY "Owners can insert invitations"
  ON public.team_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own invitations (resend)
CREATE POLICY "Owners can update own invitations"
  ON public.team_invitations
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their own invitations
CREATE POLICY "Owners can delete own invitations"
  ON public.team_invitations
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Security-definer function for public token verification
-- This allows unauthenticated users to verify a token without exposing all invitations
CREATE OR REPLACE FUNCTION public.verify_team_invitation(lookup_token TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  owner_name TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ti.id,
    ti.email,
    ti.first_name,
    ti.last_name,
    p.name as owner_name,
    ti.status,
    ti.expires_at
  FROM public.team_invitations ti
  JOIN public.profiles p ON p.id = ti.owner_id
  WHERE ti.token = lookup_token
  LIMIT 1;
$$;

-- Security-definer function to accept invitation (creates user, profile, team_member)
-- This runs with elevated privileges to insert into protected tables
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  lookup_token TEXT,
  p_first_name TEXT,
  p_last_name TEXT
)
RETURNS TABLE(
  invitation_id UUID,
  owner_id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Find and lock the invitation
  SELECT ti.id, ti.owner_id, ti.email, ti.status, ti.expires_at
  INTO v_invitation
  FROM public.team_invitations ti
  WHERE ti.token = lookup_token
  FOR UPDATE;

  -- Validate invitation
  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Einladung nicht gefunden';
  END IF;

  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Einladung wurde bereits verwendet';
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE public.team_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RAISE EXCEPTION 'Einladung ist abgelaufen';
  END IF;

  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;

  -- Return data needed for user creation
  RETURN QUERY SELECT v_invitation.id, v_invitation.owner_id, v_invitation.email;
END;
$$;

-- Security-definer function to complete team member setup after user creation
CREATE OR REPLACE FUNCTION public.complete_team_member_setup(
  p_owner_id UUID,
  p_member_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert team_members entry
  INSERT INTO public.team_members (owner_id, member_id)
  VALUES (p_owner_id, p_member_id)
  ON CONFLICT (owner_id, member_id) DO NOTHING;
END;
$$;

-- 6. RLS Policies for team_members

-- Owners can read their team members
CREATE POLICY "Owners can read own team members"
  ON public.team_members
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Members can read their own membership
CREATE POLICY "Members can read own membership"
  ON public.team_members
  FOR SELECT
  USING (auth.uid() = member_id);

-- Owners can add team members
CREATE POLICY "Owners can insert team members"
  ON public.team_members
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can remove team members
CREATE POLICY "Owners can delete team members"
  ON public.team_members
  FOR DELETE
  USING (auth.uid() = owner_id);

-- 7. Update RLS Policy for portal_links: Members can see their owner's portals
-- DROP existing policy first, then create new one that includes team access
DROP POLICY IF EXISTS "Users can read own portal links" ON public.portal_links;

CREATE POLICY "Users and team members can read portal links"
  ON public.portal_links
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    user_id IN (
      SELECT owner_id FROM public.team_members WHERE member_id = auth.uid()
    )
  );

-- Members can update portal links (activate/deactivate) but not delete
DROP POLICY IF EXISTS "Users can update own portal links" ON public.portal_links;

CREATE POLICY "Users and team members can update portal links"
  ON public.portal_links
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    user_id IN (
      SELECT owner_id FROM public.team_members WHERE member_id = auth.uid()
    )
  );

-- Only owners can delete portal links (INSERT policy remains owner-only)
-- The existing INSERT policy "Users can insert own portal links" already restricts to user_id = auth.uid()
-- DELETE policy: Only the actual owner can delete (not team members)
DROP POLICY IF EXISTS "Users can delete own portal links" ON public.portal_links;

CREATE POLICY "Only owners can delete portal links"
  ON public.portal_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Update RLS Policy for portal_submissions: Members can see submissions
DROP POLICY IF EXISTS "Users can read submissions for own links" ON public.portal_submissions;

CREATE POLICY "Users and team members can read submissions"
  ON public.portal_submissions
  FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.portal_links
      WHERE user_id = auth.uid()
         OR user_id IN (
           SELECT owner_id FROM public.team_members WHERE member_id = auth.uid()
         )
    )
  );

-- 9. RLS for profiles: Allow owners to read their team members' profiles
DROP POLICY IF EXISTS "Owners can read team member profiles" ON public.profiles;

CREATE POLICY "Owners can read team member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    id IN (
      SELECT member_id FROM public.team_members WHERE owner_id = auth.uid()
    )
  );

-- Update the existing policy to include this case
-- First, drop the old policy if it exists
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Recreate it with team member access
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    id IN (
      SELECT member_id FROM public.team_members WHERE owner_id = auth.uid()
    )
  );

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_owner_id ON public.team_invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON public.team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member_id ON public.team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_owner ON public.profiles(is_owner);

-- 11. Update handle_new_user trigger to set is_owner based on invitation
-- For invited users, is_owner should be false (set via API after user creation)
-- For self-registered users, is_owner should be true
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_owner BOOLEAN;
BEGIN
  -- Check if this user was invited (has team_invitation with their email)
  -- If so, they should NOT be an owner
  SELECT NOT EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE email = NEW.email AND status = 'accepted'
  ) INTO v_is_owner;

  INSERT INTO public.profiles (id, name, email, is_owner)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    v_is_owner
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
