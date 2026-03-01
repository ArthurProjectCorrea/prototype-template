import * as db from '@/lib/db';

const TABLE = 'positions';

// Relation definitions for this table
const RELATIONS = {
  department: { table: 'departments', foreignKey: 'departments', type: 'many' },
  users: { table: 'users', referenceKey: 'position_id', type: 'reverse' },
};

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  // Get single record by ID
  if (id) {
    const record = await db.getById(TABLE, id, {
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });
    if (!record) return db.errorResponse('Cargo não encontrado', 404);
    return db.jsonResponse(record);
  }

  // Get all records with optional filters
  const data = await db.getAll(TABLE, {
    where: Object.keys(where).length ? where : undefined,
    include: include ? include.split(',') : [],
    relations: RELATIONS,
  });

  return db.jsonResponse(data);
}

export async function POST(req) {
  const body = await req.json();

  // Validate departments field
  if (body.departments !== undefined) {
    const isValid =
      typeof body.departments === 'number' ||
      (Array.isArray(body.departments) &&
        body.departments.every((d) => typeof d === 'number'));
    if (!isValid) {
      return db.errorResponse('Lista de departamentos inválida', 400);
    }
  }

  const record = await db.create(TABLE, body);
  return db.jsonResponse(record, 201);
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  // Validate departments field if present
  if (updates.departments !== undefined) {
    const isValid =
      typeof updates.departments === 'number' ||
      (Array.isArray(updates.departments) &&
        updates.departments.every((d) => typeof d === 'number'));
    if (!isValid) {
      return db.errorResponse('Lista de departamentos inválida', 400);
    }
  }

  const record = await db.update(TABLE, id, updates);
  if (!record) return db.errorResponse('Cargo não encontrado', 404);

  return db.jsonResponse(record);
}

export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  // Check for references before deleting
  const hasReferences = await db.isReferenced('users', 'position_id', id);
  if (hasReferences) {
    return db.errorResponse(
      'Não é possível excluir cargo com usuários vinculados',
      400
    );
  }

  const deleted = await db.remove(TABLE, id);
  if (!deleted) return db.errorResponse('Cargo não encontrado', 404);

  return db.noContentResponse();
}
