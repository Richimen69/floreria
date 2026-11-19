import { sql } from 'drizzle-orm'
import { connection } from 'next/server'
import { db } from '@/db'

export async function GET() {
  await connection()
  try {
    await db.execute(sql`SELECT 1`)
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}