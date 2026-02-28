import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'database', 'screens.json');

async function readScreens() {
  const txt = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(txt);
}

export async function GET(req) {
  const list = await readScreens();
  return new Response(JSON.stringify(list), {
    headers: { 'Content-Type': 'application/json' },
  });
}
