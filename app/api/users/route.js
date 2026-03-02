import * as db from '@/lib/supabase-db';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/error-handler';

const TABLE = 'profile';
const DEFAULT_PASSWORD = 'Senha@123';

// Relation definitions for this table
const RELATIONS = {
  position: { table: 'positions', foreignKey: 'position_id', type: 'one' },
};

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  try {
    console.log('[Users GET] ========== START ==========');
    console.log('[Users GET] Params:', { id, include, where });

    // Get single record by ID
    if (id) {
      console.log('[Users GET] Buscando usuário por ID:', id);
      const record = await db.getById(TABLE, id, {
        include: include ? include.split(',') : [],
        relations: RELATIONS,
      });
      console.log('[Users GET] Resultado DB:', record);
      if (!record) return db.errorResponse('Usuário não encontrado', 404);

      console.log('[Users GET] Confirmação de email:', record.confirmed_at);
      console.log('[Users GET] Retornando usuário completo');
      return db.jsonResponse(record);
    }

    // Get all records with optional filters
    console.log('[Users GET] Buscando todos os usuários de profile');
    const data = await db.getAll(TABLE, {
      where: Object.keys(where).length ? where : undefined,
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });

    console.log('[Users GET] Usuários em profile:', data?.length || 0);
    console.log(
      '[Users GET] Usuários encontrados:',
      data?.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        confirmed_at: u.confirmed_at,
      })) || []
    );

    console.log('[Users GET] ========== SUCCESS ==========');
    return db.jsonResponse(data);
  } catch (error) {
    console.error('[Users GET] ERRO:', error.message);
    const errorMsg = handleSupabaseError(error, 'users.getAll');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function POST(req) {
  const body = await req.json();
  const supabase = await createClient();

  const { email, name, position_id } = body;

  console.log('[Users POST] ========== START ==========');
  console.log('[Users POST] Payload recebido:', { email, name, position_id });

  if (!email || !name) {
    return db.errorResponse('Email e nome são obrigatórios', 400);
  }

  try {
    // 1. Create user in Supabase Auth
    console.log('[Users POST] Criando usuário no auth');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: DEFAULT_PASSWORD,
      options: {
        data: {
          name,
          position_id: position_id || null,
        },
      },
    });

    if (authError) {
      const errorMsg = handleSupabaseError(authError, 'users.signUp');
      return db.errorResponse(errorMsg, 400);
    }

    console.log('[Users POST] Usuário criado em auth:', authData.user?.id);

    // A trigger handle_new_user() já cria o profile com position_id
    console.log(
      '[Users POST] Profile criado pela trigger com position_id:',
      position_id
    );

    console.log('[Users POST] ========== SUCCESS ==========');
    return db.jsonResponse(
      {
        id: authData.user?.id,
        email: authData.user?.email,
        name,
        position_id,
      },
      201
    );
  } catch (error) {
    console.error('[Users POST] ERRO:', error.message);
    const errorMsg = handleSupabaseError(error, 'users.create');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { id, email, ...updates } = body;

  console.log('[Users PUT] ========== START ==========');
  console.log('[Users PUT] ID:', id);
  console.log('[Users PUT] Payload:', { email, updates });

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    // Se email está sendo atualizado, atualizar no auth.users (precisa admin client)
    if (email) {
      console.log('[Users PUT] Email está sendo atualizado para:', email);
      const adminClient = createAdminClient();

      // Atualizar o email do usuário no auth
      const { error: authError } = await adminClient.auth.admin.updateUserById(
        id,
        {
          email,
        }
      );

      if (authError) {
        console.error(
          '[Users PUT] Erro ao atualizar email no auth:',
          authError.message
        );
        const errorMsg = handleSupabaseError(
          authError,
          'users.updateAuthEmail'
        );
        return db.errorResponse(errorMsg, 400);
      }
      console.log('[Users PUT] Email atualizado no auth.users');
    }

    // Atualizar no profile
    console.log('[Users PUT] Atualizando profile com dados:', {
      email,
      ...updates,
    });
    const record = await db.update(TABLE, id, { email, ...updates });
    if (!record) return db.errorResponse('Usuário não encontrado', 404);

    console.log('[Users PUT] Profile atualizado:', record);
    console.log('[Users PUT] ========== SUCCESS ==========');
    return db.jsonResponse(record);
  } catch (error) {
    console.error('[Users PUT] ERRO:', error.message);
    const errorMsg = handleSupabaseError(error, 'users.update');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function DELETE(req) {
  const params = db.parseQueryParams(req);
  const { id } = params;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    const adminClient = createAdminClient();

    console.log('[Users DELETE] ========== START ==========');
    console.log('[Users DELETE] Deletando usuário:', id);

    // Delete from Supabase Auth first (this will cascade to profile via trigger)
    console.log('[Users DELETE] Deletando de auth.users');
    const { error: authError } = await adminClient.auth.admin.deleteUser(id);
    if (authError) {
      console.error(
        '[Users DELETE] Erro ao deletar auth user:',
        authError.message
      );
      throw authError;
    }
    console.log('[Users DELETE] Deletado de auth.users com sucesso');

    console.log('[Users DELETE] ========== SUCCESS ==========');
    return db.jsonResponse({ success: true });
  } catch (error) {
    console.error('[Users DELETE] ERRO:', error.message);
    const errorMsg = handleSupabaseError(error, 'users.delete');
    return db.errorResponse(errorMsg, 500);
  }
}
