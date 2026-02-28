import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'database', 'positions.json');

async function readPositions() {
  const txt = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(txt);
}

async function writePositions(positions) {
  positions.sort((a, b) => (a.id || 0) - (b.id || 0));
  await fs.writeFile(filePath, JSON.stringify(positions, null, 2));
}

export async function GET(req) {
  const positions = await readPositions();
  return new Response(JSON.stringify(positions), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  const newPos = await req.json();
  // departments may be a number or an array of numbers
  if (
    !(
      typeof newPos.departments === 'number' ||
      (Array.isArray(newPos.departments) &&
        newPos.departments.every((d) => typeof d === 'number'))
    )
  ) {
    return new Response('Invalid departments list', { status: 400 });
  }
  const positions = await readPositions();
  const nextId = positions.length
    ? Math.max(...positions.map((p) => p.id)) + 1
    : 1;
  const now = new Date().toISOString();
  const posWithId = {
    id: nextId,
    ...newPos,
    created_at: now,
    updated_at: now,
  };
  positions.push(posWithId);
  await writePositions(positions);
  return new Response(JSON.stringify(posWithId), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(req) {
  const updated = await req.json();
  if (
    updated.departments !== undefined &&
    !(
      typeof updated.departments === 'number' ||
      (Array.isArray(updated.departments) &&
        updated.departments.every((d) => typeof d === 'number'))
    )
  ) {
    return new Response('Invalid departments list', { status: 400 });
  }
  const positions = await readPositions();
  const idx = positions.findIndex((p) => p.id === updated.id);
  if (idx === -1) {
    return new Response('Not found', { status: 404 });
  }
  const now = new Date().toISOString();
  positions[idx] = { ...positions[idx], ...updated, updated_at: now };
  await writePositions(positions);
  return new Response(JSON.stringify(positions[idx]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id'));
  // ensure no users reference this position
  const usersPath = path.join(process.cwd(), 'database', 'users.json');
  const usersTxt = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(usersTxt);
  const inUse = users.some((u) => u.position_id === id);
  if (inUse) {
    return new Response(
      'Não é possível excluir cargo com usuários vinculados',
      { status: 400 }
    );
  }
  const positions = await readPositions();
  const filtered = positions.filter((p) => p.id !== id);
  await writePositions(filtered);
  return new Response(null, { status: 204 });
}
