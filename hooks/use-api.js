/**
 * API Communication Hook
 *
 * Provides consistent API communication patterns for all pages.
 * Centralizes fetch logic, error handling, and state management.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook para comunicação com API
 *
 * @param {string} endpoint - Endpoint da API (ex: '/api/users')
 * @param {Object} options - Opções de configuração
 * @param {boolean} options.showToasts - Mostrar toasts de sucesso/erro (default: true)
 * @param {Object} options.messages - Mensagens customizadas para toasts
 * @returns {Object} Métodos e estados da API
 */
export function useApi(endpoint, options = {}) {
  const { showToasts = true, messages = {} } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultMessages = {
    createSuccess: 'Registro criado com sucesso',
    updateSuccess: 'Registro atualizado com sucesso',
    deleteSuccess: 'Registro excluído com sucesso',
    createError: 'Erro ao criar registro',
    updateError: 'Erro ao atualizar registro',
    deleteError: 'Erro ao excluir registro',
    fetchError: 'Erro ao carregar dados',
    ...messages,
  };

  /**
   * Busca todos os registros
   * @param {Object} params - Query parameters opcionais
   * @returns {Promise<Array>} Lista de registros
   */
  const getAll = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(await res.text());
        }

        return await res.json();
      } catch (err) {
        setError(err.message);
        if (showToasts) toast.error(defaultMessages.fetchError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, showToasts, defaultMessages.fetchError]
  );

  /**
   * Busca um registro por ID
   * @param {number} id - ID do registro
   * @param {Object} params - Query parameters adicionais (ex: include)
   * @returns {Promise<Object>} Registro encontrado
   */
  const getById = useCallback(
    async (id, params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({ id, ...params }).toString();
        const res = await fetch(`${endpoint}?${queryParams}`);

        if (!res.ok) {
          throw new Error(await res.text());
        }

        return await res.json();
      } catch (err) {
        setError(err.message);
        if (showToasts) toast.error(defaultMessages.fetchError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, showToasts, defaultMessages.fetchError]
  );

  /**
   * Cria um novo registro
   * @param {Object} data - Dados do registro
   * @returns {Promise<Object>} Registro criado
   */
  const create = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const text = await res.text();
          let errorMessage = defaultMessages.createError;
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await res.json();
        if (showToasts) toast.success(defaultMessages.createSuccess);
        return result;
      } catch (err) {
        setError(err.message);
        if (showToasts) toast.error(err.message || defaultMessages.createError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, showToasts, defaultMessages]
  );

  /**
   * Atualiza um registro existente
   * @param {Object} data - Dados do registro (deve incluir id)
   * @returns {Promise<Object>} Registro atualizado
   */
  const update = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const text = await res.text();
          let errorMessage = defaultMessages.updateError;
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await res.json();
        if (showToasts) toast.success(defaultMessages.updateSuccess);
        return result;
      } catch (err) {
        setError(err.message);
        if (showToasts) toast.error(err.message || defaultMessages.updateError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, showToasts, defaultMessages]
  );

  /**
   * Remove um registro
   * @param {number} id - ID do registro
   * @returns {Promise<void>}
   */
  const remove = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${endpoint}?id=${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const text = await res.text();
          let errorMessage = defaultMessages.deleteError;
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
          throw new Error(errorMessage);
        }

        if (showToasts) toast.success(defaultMessages.deleteSuccess);
      } catch (err) {
        setError(err.message);
        if (showToasts) toast.error(err.message || defaultMessages.deleteError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, showToasts, defaultMessages]
  );

  /**
   * Salva um registro (cria ou atualiza baseado na presença de id)
   * @param {Object} data - Dados do registro
   * @returns {Promise<Object>} Registro salvo
   */
  const save = useCallback(
    async (data) => {
      return data.id ? update(data) : create(data);
    },
    [create, update]
  );

  return {
    // States
    loading,
    error,

    // Methods
    getAll,
    getById,
    create,
    update,
    remove,
    save,
  };
}

/**
 * Hook simplificado para fetch de dados
 *
 * @param {string} endpoint - Endpoint da API
 * @returns {Function} Função de fetch
 */
export function useFetch(endpoint) {
  return useCallback(
    async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    [endpoint]
  );
}
