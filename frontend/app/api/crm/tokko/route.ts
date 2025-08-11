import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lead_id, proyecto_id } = body || {}
    if (!lead_id || !proyecto_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = getSupabaseServiceClient()
    const { data: proyecto, error: pErr } = await supabase
      .from('proyectos')
      .select('id, desarrolladora_id')
      .eq('id', proyecto_id)
      .maybeSingle()
    if (pErr) throw pErr

    const { data: dev, error: dErr } = await supabase
      .from('desarrolladoras')
      .select('id, crm_platform, crm_api_key')
      .eq('id', proyecto?.desarrolladora_id)
      .maybeSingle()
    if (dErr) throw dErr

    // Minimal example: if Tokko is configured, pretend to send payload
    if (dev?.crm_platform?.toLowerCase() === 'tokko' && dev?.crm_api_key) {
      // Placeholder POST call — replace with real Tokko API endpoint
      await fetch('https://api.tokkocrm.example.com/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dev.crm_api_key}`
        },
        body: JSON.stringify({ lead_id, proyecto_id })
      }).catch(() => undefined)
    }

    return NextResponse.json({ delivered: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
