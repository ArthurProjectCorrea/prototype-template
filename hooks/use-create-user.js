'use client';

import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_PASSWORD = 'Senha@123';

/**
 * Hook para criar usuários no Supabase Auth
 * Automaticamente cria um perfil vinculado
 * Envia email de confirmação para o usuário
 */
export function useCreateUser() {
  const supabase = createClient();

  const createUser = async (userData) => {
    const { email, name, position_id } = userData;

    if (!email || !name) {
      return {
        success: false,
        error: 'Email e nome são obrigatórios',
      };
    }

    try {
      // Obter URL base para redirecto após confirmação de email
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // 1. Create user in Supabase Auth
      // Envia email de confirmação para o usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: DEFAULT_PASSWORD,
        options: {
          data: {
            name,
          },
          // Redireciona para login após confirmar email
          emailRedirectTo: `${baseUrl}/login`,
        },
      });

      if (authError) {
        return {
          success: false,
          error: authError.message,
        };
      }

      // 2. Update profile with additional data
      if (authData.user?.id && position_id) {
        const { error: updateError } = await supabase
          .from('profile')
          .update({ position_id })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          // Don't fail the entire operation, user was created
        }
      }

      return {
        success: true,
        user: authData.user,
        message: `Usuário criado com sucesso! Email de confirmação enviado para ${email}. Verifique sua caixa de entrada.`,
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Erro ao criar usuário',
      };
    }
  };

  return {
    createUser,
    defaultPassword: DEFAULT_PASSWORD,
  };
}
