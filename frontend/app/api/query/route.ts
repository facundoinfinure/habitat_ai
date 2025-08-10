import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

type RAGQuery = {
  proyecto_id: string
  pregunta: string
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

async function getEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  })
  return res.data[0]?.embedding || []
}

function buildPrompt(contextDocs: string[], question: string): string {
  const context = contextDocs.map((d, i) => `[DOC ${i + 1}]\n${d}`).join('\n\n')
  const system =
    'Eres Habitat AI, un asistente experto en proyectos inmobiliarios. Responde de forma breve y precisa basándote SOLO en el contexto. Si no hay información suficiente, dilo y sugiere hablar con un asesor.'
  return `${system}\n\nCONTEXT:\n${context}\n\nPREGUNTA:\n${question}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RAGQuery
    if (!body?.pregunta || !body?.proyecto_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const queryVec = await getEmbedding(body.pregunta)

    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase.rpc('match_vectores_rag', {
      proyecto: body.proyecto_id,
      query_embedding: queryVec,
      match_count: 5
    })
    if (error) throw error

    const sourceDocs = (data || []).map((r: any) => r.texto_original as string)

    const prompt = buildPrompt(sourceDocs, body.pregunta)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Respondes en español.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 400
    })

    const respuesta = completion.choices[0]?.message?.content || ''

    return NextResponse.json({ respuesta, source_documents: sourceDocs })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
