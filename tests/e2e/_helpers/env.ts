import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'dotenv'

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return

  const parsed = parse(fs.readFileSync(filePath, 'utf8'))
  for (const [key, value] of Object.entries(parsed)) {
    const current = process.env[key]
    if (current == null || String(current).trim() === '') {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'))
loadEnvFile(path.resolve(process.cwd(), '../nexus/.env.local'))

if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
export const BASE_HOST = new URL(BASE_URL).hostname
export const AUTH_TOKEN = process.env.CLERK_SESSION_TOKEN ?? null
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? null
export const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY ?? null
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null
