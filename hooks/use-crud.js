/**
 * CRUD Page Hook
 *
 * Provides a complete state management solution for CRUD pages.
 * Handles data fetching, filtering, pagination, and CRUD operations.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApi } from './use-api';

/**
 * Hook para gerenciamento completo de páginas CRUD
 *
 * @param {Object} config - Configuração do CRUD
 * @param {string} config.endpoint - Endpoint principal da API
 * @param {number} config.pageSize - Itens por página (default: 10)
 * @param {Object} config.messages - Mensagens customizadas
 * @param {Array<Object>} config.relations - Tabelas relacionadas para carregar
 * @param {Function} config.filterFn - Função de filtro customizada
 * @param {Function} config.transformData - Função para transformar dados após fetch
 * @returns {Object} Estados e métodos do CRUD
 *
 * @example
 * const crud = useCrud({
 *   endpoint: '/api/users',
 *   pageSize: 10,
 *   relations: [
 *     { key: 'positions', endpoint: '/api/positions' },
 *   ],
 * });
 */
export function useCrud(config) {
  const {
    endpoint,
    pageSize = 10,
    messages = {},
    relations = [],
    filterFn,
    transformData,
  } = config;

  // Main data state
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Related data state
  const [relatedData, setRelatedData] = useState({});

  // API hook
  const api = useApi(endpoint, { messages, showToasts: true });

  // Ref to track if initial load has happened
  const hasLoadedRef = useRef(false);

  // Load main data
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      let result = await res.json();
      if (transformData) {
        result = transformData(result);
      }
      setData(result);
      return result;
    } catch (err) {
      console.error('Error loading data:', err);
      return [];
    }
  }, [endpoint, transformData]);

  // Load related data
  const loadRelations = useCallback(async () => {
    const loaded = {};

    await Promise.all(
      relations.map(async (rel) => {
        try {
          const res = await fetch(rel.endpoint);
          loaded[rel.key] = await res.json();
        } catch (err) {
          console.error(`Error loading ${rel.key}:`, err);
          loaded[rel.key] = [];
        }
      })
    );

    setRelatedData(loaded);
    return loaded;
  }, [relations]);

  // Initial load
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const init = async () => {
      setInitialLoading(true);
      await Promise.all([loadData(), loadRelations()]);
      setInitialLoading(false);
    };
    init();
  }, [loadData, loadRelations]);

  // Default filter function
  const defaultFilterFn = useCallback((item, filters) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === '') return true;

      const itemValue = item[key];

      // String comparison (case-insensitive)
      if (typeof itemValue === 'string' && typeof value === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase());
      }

      // Numeric comparison
      if (typeof itemValue === 'number') {
        return String(itemValue) === String(value);
      }

      // Array comparison
      if (Array.isArray(itemValue)) {
        return itemValue.includes(Number(value)) || itemValue.includes(value);
      }

      return String(itemValue) === String(value);
    });
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    const fn = filterFn || defaultFilterFn;
    return data.filter((item) => fn(item, filters));
  }, [data, filters, filterFn, defaultFilterFn]);

  // Paginated data
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / pageSize) || 1;
  }, [filteredData.length, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // CRUD handlers
  const handleSave = useCallback(
    async (item) => {
      setLoading(true);
      try {
        const result = await api.save(item);

        if (item.id) {
          // Update existing
          setData((prev) => prev.map((x) => (x.id === result.id ? result : x)));
        } else {
          // Create new
          setData((prev) => [...prev, result]);
        }

        return result;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const handleDelete = useCallback(
    async (item) => {
      setLoading(true);
      try {
        await api.remove(item.id);
        setData((prev) => prev.filter((x) => x.id !== item.id));
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  // Create lookup maps for related data
  const lookupMaps = useMemo(() => {
    const maps = {};

    relations.forEach((rel) => {
      const data = relatedData[rel.key] || [];
      const labelKey = rel.labelKey || 'name';
      maps[rel.key] = Object.fromEntries(
        data.map((item) => [item.id, item[labelKey]])
      );
    });

    return maps;
  }, [relations, relatedData]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    // Data states
    data,
    filteredData,
    pagedData,
    relatedData,
    lookupMaps,

    // Filter states
    filters,
    setFilters,
    clearFilters: () => setFilters({}),

    // Pagination states
    page,
    setPage,
    pageSize,
    totalPages,
    pagination: {
      page,
      totalPages,
      onPageChange: setPage,
    },

    // Loading states
    loading,
    initialLoading,
    error: api.error,

    // CRUD handlers
    handleSave,
    handleDelete,
    refresh,

    // API direct access
    api,
  };
}

/**
 * Helper para criar configuração de filtro
 *
 * @param {Object} config - Configuração do filtro
 * @returns {Object} Objeto de filtro formatado
 */
export function createFilter(config) {
  return {
    key: config.key,
    label: config.label,
    component: config.component,
    componentProps: config.props || {},
  };
}

/**
 * Helper para criar configuração de coluna
 *
 * @param {Object} config - Configuração da coluna
 * @returns {Object} Objeto de coluna formatado
 */
export function createColumn(config) {
  return {
    key: config.key,
    label: config.label,
    type: config.type,
    render: config.render,
  };
}
