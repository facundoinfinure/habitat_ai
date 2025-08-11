import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import crypto from 'crypto'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function getSupabaseServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key)
}

function verifyTwilioSignature(req: Request, form: FormData) {
  const token = process.env.TWILIO_AUTH_TOKEN
  const headerSig = req.headers.get('x-twilio-signature') || ''
  if (!token) throw new Error('Missing Twilio auth token')

  // Build the signature base string: URL + concat of sorted params key+value
  const url = new URL(req.url)
  const baseUrl = `${url.origin}${url.pathname}`
  const params: Record<string, string> = {}
  for (const [k, v] of form.entries()) {
    params[k] = String(v)
  }
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], baseUrl)

  const expected = crypto.createHmac('sha1', token).update(Buffer.from(data, 'utf-8')).digest('base64')
  return crypto.timingSafeEqual(Buffer.from(headerSig), Buffer.from(expected))
}

async function sendWhatsApp(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_NUMBER
  if (!sid || !token || !from) throw new Error('Missing Twilio env vars')
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ From: from, To: to, Body: body })
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('Twilio error', text)
  }
}

async function getProjectByToNumber(to: string) {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from('proyectos')
    .select('id, nombre')
    .eq('whatsapp_phone_number', to)
    .maybeSingle()
  if (error) throw error
  return data
}

async function upsertLead(phone: string, proyectoId: string) {
  const supabase = getSupabaseServiceClient()
  const { data } = await supabase.from('leads').select('*').eq('phone_number', phone).eq('proyecto_id', proyectoId).maybeSingle()
  if (data) return data
  const { data: inserted, error } = await supabase
    .from('leads')
    .insert({ phone_number: phone, proyecto_id: proyectoId, status: 'New', historial_interaccion: [] })
    .select('*')
    .single()
  if (error) throw error
  return inserted
}

function determineNextStep(lead: any) {
  if (!lead.purchase_motive) return 1
  if (!lead.budget_estimate) return 2
  if (!lead.timeline_estimate) return 3
  if (lead.financing_needed === null || lead.financing_needed === undefined) return 4
  if (!lead.scoring_financiero) return 5
  return 6
}

function isAffirmative(text: string) {
  const t = text.trim().toLowerCase()
  return ['si', 'sí', 'sì', 'yes', 'ok', 'dale', 'claro'].some((w) => t.includes(w))
}

async function performScoringServerSide(): Promise<number> {
  // If NOSIS/VERAZ envs exist, call internal scoring endpoint (which will call provider)
  const res = await fetch(`${process.env.PUBLIC_BASE_URL || ''}/api/scoring`, {
    method: 'POST'
  }).catch(() => undefined)
  if (res && res.ok) {
    const json = await res.json()
    if (typeof json?.score === 'number') return json.score
  }
  // Fallback
  return Math.floor(650 + Math.random() * 150)
}

async function deliverToCRM(payload: any) {
  await fetch(`${process.env.PUBLIC_BASE_URL || ''}/api/crm/tokko`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => undefined)
}

async function answerWithRAG(proyectoId: string, pregunta: string): Promise<string> {
  const supabase = getSupabaseServiceClient()
  const emb = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: pregunta })
  const vec = emb.data[0]?.embedding || []
  const { data, error } = await supabase.rpc('match_vectores_rag', {
    proyecto: proyectoId,
    query_embedding: vec,
    match_count: 5
  })
  if (error) throw error
  const docs: string[] = (data || []).map((r: any) => r.texto_original)
  const system =
    'Eres Habitat AI, un asistente experto en proyectos inmobiliarios. Responde breve y preciso usando SOLO el contexto. Si no está, dilo.'
  const prompt = `${system}\n\nCONTEXT:\n${docs.map((d, i) => `[DOC ${i + 1}]\n${d}`).join('\n\n')}\n\nPREGUNTA:\n${pregunta}`
  const chat = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Respondes en español.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 300
  })
  return chat.choices[0]?.message?.content || ''
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    // Verify Twilio signature
    try {
      const ok = verifyTwilioSignature(req, form)
      if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    } catch (e) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 403 })
    }

    const from = String(form.get('From') || '')
    const to = String(form.get('To') || '')
    const body = String(form.get('Body') || '').trim()

    if (!from || !to) return NextResponse.json({ ok: true }, { status: 200 })

    const project = await getProjectByToNumber(to)
    if (!project) {
      await sendWhatsApp(from, 'No encuentro el proyecto asociado a este número. Por favor, contactá a un asesor.')
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const lead = await upsertLead(from, project.id)
    const supabase = getSupabaseServiceClient()

    if (body.includes('?')) {
      const rag = await answerWithRAG(project.id, body)
      if (rag) await sendWhatsApp(from, rag)
    }

    const step = determineNextStep(lead)

    if (step === 1) {
      await sendWhatsApp(
        from,
        `¡Hola! Soy Habitat AI de ${project.nombre}. ¿La propiedad es para vivir o como inversión?`
      )
    } else if (step === 2) {
      await supabase
        .from('leads')
        .update({ purchase_motive: body, last_interaction_at: new Date().toISOString() })
        .eq('id', lead.id)
      await sendWhatsApp(from, 'Gracias. ¿Cuál es tu presupuesto estimado para esta compra?')
    } else if (step === 3) {
      await supabase
        .from('leads')
        .update({ budget_estimate: body, last_interaction_at: new Date().toISOString() })
        .eq('id', lead.id)
      await sendWhatsApp(
        from,
        '¡Genial! ¿Cuál es tu plazo ideal para mudarte? Por ejemplo: 3-6 meses, 6-12 meses o más de 1 año.'
      )
    } else if (step === 4) {
      await supabase
        .from('leads')
        .update({ timeline_estimate: body, last_interaction_at: new Date().toISOString() })
        .eq('id', lead.id)
      await sendWhatsApp(from, '¿Vas a usar un crédito hipotecario para esta compra? (sí/no)')
    } else if (step === 5) {
      const financingNeeded = isAffirmative(body)
      await supabase
        .from('leads')
        .update({ financing_needed: financingNeeded, last_interaction_at: new Date().toISOString() })
        .eq('id', lead.id)
      await sendWhatsApp(
        from,
        'Podemos ayudarte a pre-aprobarte un préstamo. ¿Nos das tu consentimiento para un chequeo rápido? (sí/no)'
      )
    } else if (step === 6) {
      if (isAffirmative(body)) {
        const score = await performScoringServerSide()
        await supabase
          .from('leads')
          .update({ scoring_financiero: score, status: 'Qualified', last_interaction_at: new Date().toISOString() })
          .eq('id', lead.id)
        await deliverToCRM({ lead_id: lead.id, proyecto_id: project.id })
        await sendWhatsApp(
          from,
          '¡Excelente! Ya tenemos todo para conectarte con un asesor. ¿Cuál es el mejor horario para llamarte?'
        )
      } else {
        await sendWhatsApp(from, 'Entendido. Si más adelante querés avanzar con la pre-aprobación, avisame.')
      }
    } else {
      const { data: updatedLead } = await getSupabaseServiceClient()
        .from('leads')
        .update({ historial_interaccion: ((lead.historial_interaccion || []) as any[]).concat([{ ts: new Date().toISOString(), agent_call_time: body }]), last_interaction_at: new Date().toISOString() })
        .eq('id', lead.id)
        .select('*')
        .single()
      await sendWhatsApp(from, '¡Gracias! Un asesor te contactará en ese horario.')
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
