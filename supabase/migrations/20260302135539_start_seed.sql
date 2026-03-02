-- Seed data for the application
-- Tables, triggers, and functions created in 20260302133452_start_database.sql

-- ============================================
-- SEED DEPARTMENTS
-- ============================================
INSERT INTO public.departments (id, name, created_at, updated_at) VALUES
(1, 'Configuração do Sistema', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED POSITIONS
-- ============================================
INSERT INTO public.positions (id, name, department_id, created_at, updated_at) VALUES
(1, 'Usuário Administrador', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED SCREENS
-- ============================================
INSERT INTO public.screens (id, name, key, created_at, updated_at) VALUES
(1, 'Dashboard', 'dashboard', NOW(), NOW()),
(2, 'Cadastro de Usuários', 'users', NOW(), NOW()),
(3, 'Cadastro de Cargos', 'positions', NOW(), NOW()),
(4, 'Cadastro de Departamentos', 'departments', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED PERMISSIONS
-- ============================================
INSERT INTO public.permissions (id, key, name, created_at, updated_at) VALUES
(1, 'view', 'Visualizar', NOW(), NOW()),
(2, 'edit', 'Editar', NOW(), NOW()),
(3, 'delete', 'Excluir', NOW(), NOW()),
(4, 'export', 'Exportar', NOW(), NOW()),
(5, 'grant', 'Conceder', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED ACCESS RULES
-- Admin position (id=1) permissions
-- ============================================

-- Dashboard: view
INSERT INTO public.access (position_id, screen_id, permission_id) VALUES
(1, 1, 1)
ON CONFLICT (position_id, screen_id, permission_id) DO NOTHING;

-- Users: view, edit, delete
INSERT INTO public.access (position_id, screen_id, permission_id) VALUES
(1, 2, 1),
(1, 2, 2),
(1, 2, 3)
ON CONFLICT (position_id, screen_id, permission_id) DO NOTHING;

-- Positions: view, edit, delete, grant
INSERT INTO public.access (position_id, screen_id, permission_id) VALUES
(1, 3, 1),
(1, 3, 2),
(1, 3, 3),
(1, 3, 5)
ON CONFLICT (position_id, screen_id, permission_id) DO NOTHING;

-- Departments: view, edit, delete
INSERT INTO public.access (position_id, screen_id, permission_id) VALUES
(1, 4, 1),
(1, 4, 2),
(1, 4, 3)
ON CONFLICT (position_id, screen_id, permission_id) DO NOTHING;

-- Departments: view, edit, delete
INSERT INTO public.access (position_id, screen_id, permission_id) VALUES
(1, 4, 1),
(1, 4, 2),
(1, 4, 3)
ON CONFLICT (position_id, screen_id, permission_id) DO NOTHING;
