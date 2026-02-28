import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'database', 'users.json');

async function readUsers() {
  const txt = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(txt);
}

async function writeUsers(users) {
  // maintain order by id ascending
  users.sort((a, b) => (a.id || 0) - (b.id || 0));
  await fs.writeFile(filePath, JSON.stringify(users, null, 2));
}

export async function GET(req) {
  const users = await readUsers();
  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function generateRandomPassword(len = 8) {
  // simple alphanumeric password
  return Math.random().toString(36).slice(-len);
}

export async function POST(req) {
  const incoming = await req.json();
  // if caller didn't supply a password, create one now
  const newUser = {
    ...incoming,
  };
  if (!newUser.password) {
    newUser.password = generateRandomPassword(8);
  }

  const users = await readUsers();
  const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const now = new Date().toISOString();
  const userWithId = {
    id: nextId,
    ...newUser,
    created_at: now,
    updated_at: now,
  };
  users.push(userWithId);
  await writeUsers(users);
  return new Response(JSON.stringify(userWithId), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(req) {
  const updated = await req.json();
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === updated.id);
  if (idx === -1) {
    return new Response('Not found', { status: 404 });
  }
  const now = new Date().toISOString();
  users[idx] = { ...users[idx], ...updated, updated_at: now };
  await writeUsers(users);
  return new Response(JSON.stringify(users[idx]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id'));
  const users = await readUsers();
  const filtered = users.filter((u) => u.id !== id);
  await writeUsers(filtered);
  return new Response(null, { status: 204 });
}
