import * as db from '@/lib/supabase-db';
import { handleSupabaseError } from '@/lib/error-handler';

const TABLE = 'screens';

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, ...where } = params;

  try {
    if (id) {
      const record = await db.getById(TABLE, id);
      if (!record) return db.errorResponse('Tela não encontrada', 404);
      return db.jsonResponse(record);
    }

    const data = await db.getAll(TABLE, {
      where: Object.keys(where).length ? where : undefined,
    });

    return db.jsonResponse(data);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'screens.getAll');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function POST(req) {
  const body = await req.json();

  try {
    const record = await db.create(TABLE, body);
    return db.jsonResponse(record, 201);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'screens.create');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    const record = await db.update(TABLE, id, updates);
    if (!record) return db.errorResponse('Tela não encontrada', 404);
    return db.jsonResponse(record);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'screens.update');
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
    const errorMsg = handleSupabaseError(error, 'screens.delete');
    return db.errorResponse(errorMsg, 500);
  }
}
