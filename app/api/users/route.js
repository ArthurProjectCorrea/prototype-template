import * as db from '@/lib/db';

const TABLE = 'users';

// Relation definitions for this table
const RELATIONS = {
  position: { table: 'positions', foreignKey: 'position_id', type: 'one' },
};

function generateRandomPassword(len = 8) {
  return Math.random().toString(36).slice(-len);
}

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  // Get single record by ID
  if (id) {
    const record = await db.getById(TABLE, id, {
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });
    if (!record) return db.errorResponse('Usuário não encontrado', 404);
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

  // Generate password if not provided
  if (!body.password) {
    body.password = generateRandomPassword(8);
  }

  const record = await db.create(TABLE, body);
  return db.jsonResponse(record, 201);
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  const record = await db.update(TABLE, id, updates);
  if (!record) return db.errorResponse('Usuário não encontrado', 404);

  return db.jsonResponse(record);
}

export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  const deleted = await db.remove(TABLE, id);
  if (!deleted) return db.errorResponse('Usuário não encontrado', 404);

  return db.noContentResponse();
}
