-- ============================================
-- FIX: Permitir edição de profiles por usuários com permissão
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Função para verificar se o usuário tem uma permissão específica em uma tela
CREATE OR REPLACE FUNCTION public.has_permission(screen_key TEXT, permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_position_id BIGINT;
  has_access BOOLEAN;
BEGIN
  -- Get user's position_id from profile
  SELECT position_id INTO user_position_id
  FROM public.profile
  WHERE id = auth.uid();
  
  -- If user has no position, deny access
  IF user_position_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if position has the permission for the screen
  SELECT EXISTS(
    SELECT 1 
    FROM public.access a
    JOIN public.screens s ON s.id = a.screen_id
    JOIN public.permissions p ON p.id = a.permission_id
    WHERE a.position_id = user_position_id
      AND s.key = screen_key
      AND p.key = permission_key
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profile;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profile;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profile;
DROP POLICY IF EXISTS "Users with permission can insert profiles" ON public.profile;
DROP POLICY IF EXISTS "Users with permission can delete profiles" ON public.profile;

-- ============================================
-- NEW PROFILE POLICIES
-- ============================================

-- UPDATE: Allow user to update own profile OR if they have 'edit' permission on 'users' screen
CREATE POLICY "Users can update profiles"
ON public.profile FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR public.has_permission('users', 'edit')
);

-- INSERT: Allow if user has 'edit' permission on 'users' screen
-- Note: Normal signup inserts are done via trigger (SECURITY DEFINER), so this is for admin creating users
CREATE POLICY "Users with permission can insert profiles"
ON public.profile FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id 
  OR public.has_permission('users', 'edit')
);

-- DELETE: Allow if user has 'delete' permission on 'users' screen
CREATE POLICY "Users with permission can delete profiles"
ON public.profile FOR DELETE
TO authenticated
USING (
  auth.uid() = id 
  OR public.has_permission('users', 'delete')
);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the policies were created:
-- SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.profile'::regclass;
