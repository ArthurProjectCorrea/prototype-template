import * as db from '@/lib/db';

const TABLE = 'departments';

// Relation definitions for this table
const RELATIONS = {
  positions: {
    table: 'positions',
    referenceKey: 'departments',
    type: 'reverse',
  },
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
    if (!record) return db.errorResponse('Departamento não encontrado', 404);
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
  const record = await db.create(TABLE, body);
  return db.jsonResponse(record, 201);
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  const record = await db.update(TABLE, id, updates);
  if (!record) return db.errorResponse('Departamento não encontrado', 404);

  return db.jsonResponse(record);
}

export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  // Check for references before deleting
  const hasReferences = await db.isReferenced('positions', 'departments', id);
  if (hasReferences) {
    return db.errorResponse(
      'Não é possível excluir departamento com cargos vinculados',
      400
    );
  }

  const deleted = await db.remove(TABLE, id);
  if (!deleted) return db.errorResponse('Departamento não encontrado', 404);

  return db.noContentResponse();
}
