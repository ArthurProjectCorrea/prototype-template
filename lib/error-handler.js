/**
 * Error Handler for Supabase errors
 *
 * Provides centralized error handling for Supabase operations.
 * Known errors get user-friendly messages.
 * Unknown errors log full details to console and return generic message.
 */

// Map of known Supabase error messages to user-friendly alternatives
const KNOWN_ERRORS = {
  // Auth errors
  'User already registered': 'Este email já está registrado',
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Email não foi confirmado. Verifique seu email',
  'Email link expired': 'Link de confirmação expirou',
  'Email address already in use': 'Este email já está em uso',
  'Invalid request body': 'Dados inválidos no formulário',
  'Password is weak': 'Senha deve ter pelo menos 6 caracteres',
  'Email rate limit exceeded':
    'Muitas tentativas. Tente novamente em alguns minutos',
  'Database error': 'Erro ao acessar banco de dados',
  'User not found': 'Usuário não encontrado',
};

/**
 * Normalizes Supabase errors
 * - Known errors get user-friendly message
 * - Unknown errors log details and return generic message
 *
 * @param {Error|Object} error - The error object from Supabase
 * @param {string} context - Context for logging (e.g., 'auth.signUp', 'users.update')
 * @returns {string} User-friendly error message
 */
export function handleSupabaseError(error, context = 'Unknown') {
  if (!error) {
    return 'Erro desconhecido';
  }

  // Extract the error message
  const message = error?.message || String(error);

  // Check if it's a known error
  for (const [knownMsg, userMsg] of Object.entries(KNOWN_ERRORS)) {
    if (message.toLowerCase().includes(knownMsg.toLowerCase())) {
      return userMsg;
    }
  }

  // Unknown error - log full details and return generic message
  console.error(`[Supabase Error] Context: ${context}`, {
    message,
    code: error?.code,
    status: error?.status,
    statusText: error?.statusText,
    fullError: error,
  });

  return 'Erro ao processar sua solicitação. Tente novamente.';
}

/**
 * Validates Supabase error response
 * Returns null if no error, or normalized message if error exists
 *
 * @param {Object} response - Supabase response { data, error }
 * @param {string} context - Context for logging
 * @returns {string|null} Error message or null
 */
export function validateSupabaseResponse(response, context = 'Unknown') {
  const { error } = response;
  if (!error) return null;

  return handleSupabaseError(error, context);
}
