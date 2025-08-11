import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

type EmbedRequest = {
  proyecto_id: string
  texts: string[]
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function getSupabaseServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EmbedRequest
    if (!body?.proyecto_id || !Array.isArray(body.texts) || body.texts.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const texts = body.texts.slice(0, 200) // safety limit

    // OpenAI embeddings API supports batching
    const res = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: texts
    })

    const rows = res.data.map((d, i) => ({
      proyecto_id: body.proyecto_id,
      texto_original: texts[i],
      embedding: d.embedding
    }))

    const supabase = getSupabaseServiceClient()
    const { error } = await supabase.from('vectores_rag').insert(rows)
    if (error) throw error

    return NextResponse.json({ inserted: rows.length })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
