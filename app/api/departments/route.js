import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'database', 'departments.json');

async function readDepartments() {
  const txt = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(txt);
}

async function writeDepartments(depts) {
  depts.sort((a, b) => (a.id || 0) - (b.id || 0));
  await fs.writeFile(filePath, JSON.stringify(depts, null, 2));
}

export async function GET(req) {
  const depts = await readDepartments();
  return new Response(JSON.stringify(depts), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  const newDept = await req.json();
  const depts = await readDepartments();
  const nextId = depts.length ? Math.max(...depts.map((d) => d.id)) + 1 : 1;
  const now = new Date().toISOString();
  const deptWithId = {
    id: nextId,
    ...newDept,
    created_at: now,
    updated_at: now,
  };
  depts.push(deptWithId);
  await writeDepartments(depts);
  return new Response(JSON.stringify(deptWithId), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(req) {
  const updated = await req.json();
  const depts = await readDepartments();
  const idx = depts.findIndex((d) => d.id === updated.id);
  if (idx === -1) {
    return new Response('Not found', { status: 404 });
  }
  const now = new Date().toISOString();
  depts[idx] = { ...depts[idx], ...updated, updated_at: now };
  await writeDepartments(depts);
  return new Response(JSON.stringify(depts[idx]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id'));
  // prevent deletion if any position references this department
  const positionsPath = path.join(process.cwd(), 'database', 'positions.json');
  const posTxt = await fs.readFile(positionsPath, 'utf-8');
  const positions = JSON.parse(posTxt);
  const used = positions.some((p) => {
    const deps = Array.isArray(p.departments) ? p.departments : [p.departments];
    return deps.includes(id);
  });
  if (used) {
    return new Response(
      'Não é possível excluir departamento com posições vinculadas',
      { status: 400 }
    );
  }
  const depts = await readDepartments();
  const filtered = depts.filter((d) => d.id !== id);
  await writeDepartments(filtered);
  return new Response(null, { status: 204 });
}
