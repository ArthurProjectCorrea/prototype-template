/**
 * Funções de autenticação para login/logout
 * Gerencia localStorage e cookies
 */

const USER_KEY = 'user';

/**
 * Salva dados do usuário no localStorage e cookie
 */
export function setUser(user) {
  const str = JSON.stringify(user);
  localStorage.setItem(USER_KEY, str);
  document.cookie = `${USER_KEY}=${encodeURIComponent(str)}; path=/`;
}

/**
 * Remove dados do usuário do localStorage e cookie
 */
export function clearUser() {
  localStorage.removeItem(USER_KEY);
  document.cookie = `${USER_KEY}=; Max-Age=0; path=/`;
}

/**
 * Retorna dados do usuário do localStorage
 */
export function getUser() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Verifica se existe usuário autenticado
 */
export function isAuthenticated() {
  return getUser() !== null;
}

/**
 * Realiza login do usuário
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function login(email, password) {
  try {
    // Busca usuário
    const res = await fetch('/api/users?include=position');
    if (!res.ok) throw new Error('Erro ao buscar usuários');

    const users = await res.json();
    const emailTrimmed = email.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === emailTrimmed && u.password === password.trim()
    );

    if (!user) {
      return { success: false, error: 'E-mail ou senha inválidos' };
    }

    // Salva usuário com dados relacionados
    setUser(user);

    return { success: true, user };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: 'Erro durante login' };
  }
}

/**
 * Realiza logout do usuário
 */
export function logout() {
  clearUser();
  window.location.href = '/login';
}
