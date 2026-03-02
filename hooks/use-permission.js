'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook para verificar permissões do usuário logado
 * Carrega permissões do cargo via tabela access do Supabase
 *
 * @example
 * const { hasPermission, canView, canEdit, canDelete, canExport } = usePermission();
 *
 * // Verifica permissão específica
 * if (hasPermission('users', 'edit')) { ... }
 *
 * // Atalhos
 * if (canView('users')) { ... }
 * if (canEdit('users')) { ... }
 */
export function usePermission() {
  const { user, ready: authReady } = useAuth();
  const supabase = createClient();

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  // Carrega permissões do cargo do usuário via tabela access
  useEffect(() => {
    const loadPermissions = async () => {
      if (!authReady) return;

      try {
        setLoading(true);

        // Se não há user ou position_id, sem permissões
        if (!user?.id) {
          setPermissions([]);
          setReady(true);
          return;
        }

        // Buscar profile do usuário para pegar position_id
        const { data: profile } = await supabase
          .from('profile')
          .select('position_id')
          .eq('id', user.id)
          .single();

        if (!profile?.position_id) {
          setPermissions([]);
          setReady(true);
          return;
        }

        // Buscar permissões (access) para este cargo
        const { data: accessRules } = await supabase
          .from('access')
          .select('screen:screen_id(key), permission:permission_id(key)')
          .eq('position_id', profile.position_id);

        if (accessRules) {
          // Transformar em formato compatível com o restante da aplicação
          const formattedPermissions = accessRules.map((rule) => ({
            screen_key: rule.screen?.key,
            permission_key: rule.permission?.key,
          }));
          setPermissions(formattedPermissions);
        }
      } catch (err) {
        console.error('Error loading permissions:', err);
        setPermissions([]);
      } finally {
        setLoading(false);
        setReady(true);
      }
    };

    loadPermissions();
  }, [authReady, user?.id, supabase]);

  /**
   * Verifica se o usuário tem uma permissão específica para uma tela
   * @param {string} screenKey - Key da tela (ex: 'users', 'positions')
   * @param {string} permissionKey - Key da permissão (ex: 'view', 'edit', 'delete', 'export')
   * @returns {boolean}
   */
  const hasPermission = useCallback(
    (screenKey, permissionKey) => {
      if (!screenKey || !permissionKey) return false;
      return permissions.some(
        (p) => p.screen_key === screenKey && p.permission_key === permissionKey
      );
    },
    [permissions]
  );

  // Atalhos para permissões comuns
  const canView = useCallback(
    (screenKey) => hasPermission(screenKey, 'view'),
    [hasPermission]
  );
  const canEdit = useCallback(
    (screenKey) => hasPermission(screenKey, 'edit'),
    [hasPermission]
  );
  const canDelete = useCallback(
    (screenKey) => hasPermission(screenKey, 'delete'),
    [hasPermission]
  );
  const canExport = useCallback(
    (screenKey) => hasPermission(screenKey, 'export'),
    [hasPermission]
  );

  /**
   * Retorna todas as permissões para uma tela específica
   * @param {string} screenKey
   * @returns {string[]} Array de permission_keys
   */
  const getPermissionsFor = useCallback(
    (screenKey) => {
      return permissions
        .filter((p) => p.screen_key === screenKey)
        .map((p) => p.permission_key);
    },
    [permissions]
  );

  return {
    permissions,
    loading,
    ready,
    hasPermission,
    canView,
    canEdit,
    canDelete,
    canExport,
    getPermissionsFor,
  };
}
