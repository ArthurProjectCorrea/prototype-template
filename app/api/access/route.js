import * as db from '@/lib/supabase-db';
import { createClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/error-handler';

const TABLE = 'access';

// Relation definitions for this table
const RELATIONS = {
  position: { table: 'positions', foreignKey: 'position_id', type: 'one' },
  screen: { table: 'screens', foreignKey: 'screen_id', type: 'one' },
  permission: {
    table: 'permissions',
    foreignKey: 'permission_id',
    type: 'one',
  },
};

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, position_id, include, ...where } = params;

  try {
    // Get single record by ID
    if (id) {
      const record = await db.getById(TABLE, id, {
        include: include ? include.split(',') : [],
        relations: RELATIONS,
      });
      if (!record) return db.errorResponse('Acesso não encontrado', 404);
      return db.jsonResponse(record);
    }

    // Get all access rules for a specific position
    if (position_id) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, position_id, screen_id, permission_id, screen:screen_id(*), permission:permission_id(*)'
        )
        .eq('position_id', position_id);

      if (error) throw error;
      return db.jsonResponse(data || []);
    }

    // Get all records with optional filters
    const data = await db.getAll(TABLE, {
      where: Object.keys(where).length ? where : undefined,
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });

    return db.jsonResponse(data);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'access.getAll');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function POST(req) {
  const body = await req.json();

  const { position_id, screen_id, permission_id } = body;

  if (!position_id || !screen_id || !permission_id) {
    return db.errorResponse(
      'position_id, screen_id e permission_id são obrigatórios',
      400
    );
  }

  try {
    const record = await db.create(TABLE, body);
    return db.jsonResponse(record, 201);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'access.create');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    const record = await db.update(TABLE, id, updates);
    if (!record) return db.errorResponse('Acesso não encontrado', 404);
    return db.jsonResponse(record);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'access.update');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    await db.remove(TABLE, id);
    return db.jsonResponse({ success: true });
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'access.delete');
    return db.errorResponse(errorMsg, 500);
  }
}
