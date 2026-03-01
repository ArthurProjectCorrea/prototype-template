'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUser } from '@/lib/auth';

/**
 * Hook para verificar permissões do usuário logado
 * Carrega permissões do cargo uma vez e fornece métodos para verificar
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
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  // Carrega permissões do cargo do usuário
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const user = getUser();
        if (!user?.position_id) {
          setPermissions([]);
          setLoading(false);
          setReady(true);
          return;
        }

        const res = await fetch('/api/positions');
        const positions = await res.json();
        const position = positions.find((p) => p.id === user.position_id);
        setPermissions(position?.permissions || []);
      } catch (err) {
        console.error('Error loading permissions:', err);
        setPermissions([]);
      } finally {
        setLoading(false);
        setReady(true);
      }
    };

    loadPermissions();
  }, []);

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
