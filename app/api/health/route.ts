import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { isAuthEnabled } from '@/lib/auth/isAuthEnabled';
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
  const missingEnv: string[] = [];

  if (!process.env.MONGODB_URI) missingEnv.push('MONGODB_URI');
  if (!process.env.BETTER_AUTH_SECRET) missingEnv.push('BETTER_AUTH_SECRET');
  if (!process.env.BETTER_AUTH_URL) missingEnv.push('BETTER_AUTH_URL');

  const authEnabled = isAuthEnabled();

  const cwd = process.cwd();
  const envFilePath = path.join(cwd, '.env');
  const envExampleFilePath = path.join(cwd, '.env.example');
  const envFiles = {
    cwd,
    env: { path: envFilePath, exists: fs.existsSync(envFilePath) },
    envExample: { path: envExampleFilePath, exists: fs.existsSync(envExampleFilePath) },
  };

  let dbOk = false;
  let dbError: string | null = null;

  if (!missingEnv.includes('MONGODB_URI')) {
    try {
      await connectToDatabase();
      dbOk = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }

  // If auth isn't configured, health is still OK (portable/offline mode).
  const ok = authEnabled ? (missingEnv.length === 0 && dbOk) : true;

  return NextResponse.json({
    ok,
    auth: { enabled: authEnabled },
    missingEnv,
    envFiles,
    db: { ok: dbOk, error: dbError },
  });
}
