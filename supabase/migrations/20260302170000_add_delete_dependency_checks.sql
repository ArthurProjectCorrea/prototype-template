-- Add triggers to prevent deletion of resources with dependencies

-- ============================================
-- TRIGGER FUNCTION: Check department dependencies
-- ============================================
CREATE OR REPLACE FUNCTION public.check_department_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.positions 
    WHERE department_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir um departamento que possui cargos vinculados';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent department deletion if it has positions
CREATE TRIGGER prevent_department_delete
BEFORE DELETE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.check_department_delete();

-- ============================================
-- TRIGGER FUNCTION: Check position dependencies
-- ============================================
CREATE OR REPLACE FUNCTION public.check_position_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profile 
    WHERE position_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir um cargo que possui usuários vinculados';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.access 
    WHERE position_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir um cargo que possui permissões vinculadas';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent position deletion if it has profiles or access rules
CREATE TRIGGER prevent_position_delete
BEFORE DELETE ON public.positions
FOR EACH ROW EXECUTE FUNCTION public.check_position_delete();

-- ============================================
-- TRIGGER FUNCTION: Check screen dependencies
-- ============================================
CREATE OR REPLACE FUNCTION public.check_screen_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.access 
    WHERE screen_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir uma tela que possui permissões vinculadas';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent screen deletion if it has access rules
CREATE TRIGGER prevent_screen_delete
BEFORE DELETE ON public.screens
FOR EACH ROW EXECUTE FUNCTION public.check_screen_delete();

-- ============================================
-- TRIGGER FUNCTION: Check permission dependencies
-- ============================================
CREATE OR REPLACE FUNCTION public.check_permission_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.access 
    WHERE permission_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Não é possível excluir uma permissão que está vinculada a cargos';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent permission deletion if it has access rules
CREATE TRIGGER prevent_permission_delete
BEFORE DELETE ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.check_permission_delete();
