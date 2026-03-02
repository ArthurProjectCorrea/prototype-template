import * as db from '@/lib/supabase-db';
import { createClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/error-handler';

const TABLE = 'positions';

// Relation definitions for this table
const RELATIONS = {
  department: {
    table: 'departments',
    foreignKey: 'department_id',
    type: 'one',
  },
  profile: { table: 'profile', referenceKey: 'position_id', type: 'reverse' },
  access: { table: 'access', referenceKey: 'position_id', type: 'reverse' },
};

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  try {
    if (id) {
      const record = await db.getById(TABLE, id, {
        include: include ? include.split(',') : [],
        relations: RELATIONS,
      });
      if (!record) return db.errorResponse('Cargo não encontrado', 404);

      // If access is included, fetch permissions for this position
      if (include?.includes('access')) {
        const supabase = await createClient();
        const { data: access } = await supabase
          .from('access')
          .select(
            'id, screen_id, permission_id, screen:screen_id(*), permission:permission_id(*)'
          )
          .eq('position_id', id);

        record.access = access || [];
      }

      return db.jsonResponse(record);
    }

    const data = await db.getAll(TABLE, {
      where: Object.keys(where).length ? where : undefined,
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });

    return db.jsonResponse(data);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'positions.getAll');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function POST(req) {
  const body = await req.json();
  const supabase = await createClient();

  const { name, department_id, access: accessRules } = body;

  if (!name) {
    return db.errorResponse('Nome do cargo é obrigatório', 400);
  }

  try {
    // 1. Create position
    const position = await db.create(TABLE, {
      name,
      department_id,
    });

    // 2. Create access rules if provided
    if (accessRules && Array.isArray(accessRules) && position.id) {
      const accessData = accessRules.map((rule) => ({
        position_id: position.id,
        screen_id: rule.screen_id,
        permission_id: rule.permission_id,
      }));

      await db.createMany('access', accessData);
    }

    return db.jsonResponse(position, 201);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'positions.create');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function PUT(req) {
  const body = await req.json();
  const {
    id,
    access: accessRules,
    permissions: permissionRules,
    ...updates
  } = body;
  const supabase = await createClient();

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    // 1. Update position (only if there are actual field updates)
    let record;
    if (Object.keys(updates).length > 0) {
      record = await db.update(TABLE, id, updates);
      if (!record) return db.errorResponse('Cargo não encontrado', 404);
    } else {
      // Just fetch the current record
      record = await db.getById(TABLE, id);
      if (!record) return db.errorResponse('Cargo não encontrado', 404);
    }

    // 2. Update access rules if provided (direct IDs)
    if (accessRules && Array.isArray(accessRules)) {
      // Delete existing access rules
      await supabase.from('access').delete().eq('position_id', id);

      // Create new access rules
      const accessData = accessRules.map((rule) => ({
        position_id: id,
        screen_id: rule.screen_id,
        permission_id: rule.permission_id,
      }));

      if (accessData.length > 0) {
        await db.createMany('access', accessData);
      }
    }

    // 3. Update permissions if provided (with keys instead of IDs)
    if (permissionRules && Array.isArray(permissionRules)) {
      // Fetch screens and permissions to map keys to IDs
      const { data: screensData } = await supabase
        .from('screens')
        .select('id, key');
      const { data: permsData } = await supabase
        .from('permissions')
        .select('id, key');

      const screenMap = Object.fromEntries(
        screensData.map((s) => [s.key, s.id])
      );
      const permMap = Object.fromEntries(permsData.map((p) => [p.key, p.id]));

      // Delete existing access rules
      await supabase.from('access').delete().eq('position_id', id);

      // Create new access rules from permission keys
      const accessData = permissionRules
        .filter(
          (rule) => screenMap[rule.screen_key] && permMap[rule.permission_key]
        )
        .map((rule) => ({
          position_id: id,
          screen_id: screenMap[rule.screen_key],
          permission_id: permMap[rule.permission_key],
        }));

      if (accessData.length > 0) {
        await db.createMany('access', accessData);
      }
    }

    return db.jsonResponse(record);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'positions.update');
    return db.errorResponse(errorMsg, 500);
  }
}

export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);
  const supabase = await createClient();

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    // Check for references
    const { data: profiles } = await supabase
      .from('profile')
      .select('id')
      .eq('position_id', id)
      .limit(1);

    if (profiles && profiles.length > 0) {
      return db.errorResponse(
        'Não é possível excluir cargo com usuários vinculados',
        400
      );
    }

    // Delete access rules first
    await supabase.from('access').delete().eq('position_id', id);

    // Delete position
    await db.remove(TABLE, id);

    return db.jsonResponse({ success: true });
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'positions.delete');
    return db.errorResponse(errorMsg, 500);
  }
}
