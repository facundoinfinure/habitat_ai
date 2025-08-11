import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Placeholder for Nosis/Veraz integration
    // If you have provider credentials, call here and return the provider score
    const score = Math.floor(650 + Math.random() * 150)
    return NextResponse.json({ score })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
