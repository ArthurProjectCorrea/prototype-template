-- Create tables for the application
-- Includes: tables, triggers, functions, and RLS policies
-- Seed data is in 20260302135539_start_seed.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profile table (linked to Supabase Auth users)
CREATE TABLE public.profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  position_id BIGINT,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE public.departments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Positions table
CREATE TABLE public.positions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  department_id BIGINT REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add position_id foreign key to profile after positions table exists
ALTER TABLE public.profile 
ADD CONSTRAINT fk_profile_position 
FOREIGN KEY (position_id) 
REFERENCES public.positions(id) 
ON DELETE SET NULL;

-- Screens table
CREATE TABLE public.screens (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE public.permissions (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Access table (position -> screen -> permission)
CREATE TABLE public.access (
  id BIGSERIAL PRIMARY KEY,
  position_id BIGINT NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  screen_id BIGINT NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(position_id, screen_id, permission_id)
);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Create trigger function to automatically create profile when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (id, email, name, position_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    CASE 
      WHEN new.raw_user_meta_data->>'position_id' IS NOT NULL 
      THEN (new.raw_user_meta_data->>'position_id')::BIGINT
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table for new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SYNC FUNCTIONS
-- ============================================

-- Create function to sync name when auth.users is updated
CREATE OR REPLACE FUNCTION public.sync_profile_name()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profile
  SET name = NEW.raw_user_meta_data->>'name',
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync name when auth.users is updated
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (NEW.raw_user_meta_data->>'name' IS DISTINCT FROM OLD.raw_user_meta_data->>'name')
EXECUTE FUNCTION public.sync_profile_name();

-- Create function to sync confirmed_at from auth.users to profile
CREATE OR REPLACE FUNCTION public.sync_profile_confirmed_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profile
  SET confirmed_at = NEW.confirmed_at,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync confirmed_at when auth.users is updated
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at)
EXECUTE FUNCTION public.sync_profile_confirmed_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION FOR PERMISSION CHECK
-- ============================================

-- Function to check if user has a specific permission on a screen
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

-- ============================================
-- PROFILE POLICIES
-- ============================================

-- Allow users to view all profiles (so admin pages can list users)
CREATE POLICY "Users can view all profiles"
ON public.profile FOR SELECT
TO authenticated
USING (true);

-- Allow user to update own profile OR if they have 'edit' permission on 'users' screen
CREATE POLICY "Users can update profiles"
ON public.profile FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR public.has_permission('users', 'edit')
);

-- Allow insert if user has 'edit' permission on 'users' screen (admin creating users)
-- Note: Normal signup inserts are done via trigger (SECURITY DEFINER)
CREATE POLICY "Users with permission can insert profiles"
ON public.profile FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id 
  OR public.has_permission('users', 'edit')
);

-- Allow delete if user has 'delete' permission on 'users' screen
CREATE POLICY "Users with permission can delete profiles"
ON public.profile FOR DELETE
TO authenticated
USING (
  auth.uid() = id 
  OR public.has_permission('users', 'delete')
);

-- Departments Policies
CREATE POLICY "Authenticated users can view departments"
ON public.departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert departments"
ON public.departments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update departments"
ON public.departments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete departments"
ON public.departments FOR DELETE
TO authenticated
USING (true);

-- Positions Policies
CREATE POLICY "Authenticated users can view positions"
ON public.positions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert positions"
ON public.positions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update positions"
ON public.positions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete positions"
ON public.positions FOR DELETE
TO authenticated
USING (true);

-- Screens Policies
CREATE POLICY "Authenticated users can view screens"
ON public.screens FOR SELECT
TO authenticated
USING (true);

-- Permissions Policies
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

-- Access Policies
CREATE POLICY "Authenticated users can view access"
ON public.access FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert access"
ON public.access FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update access"
ON public.access FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete access"
ON public.access FOR DELETE
TO authenticated
USING (true);
