'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Header } from '../components/Header'
import { MetricsCards } from '../components/MetricsCards'
import { LeadsTable } from '../components/LeadsTable'

function useLeadsRealtime(projectId: string) {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!projectId) {
      setLeads([])
      return
    }
    setLoading(true)
    supabase
      .from('leads')
      .select('id,phone_number,status,scoring_financiero,tags,last_interaction_at')
      .eq('proyecto_id', projectId)
      .order('last_interaction_at', { ascending: false })
      .then(({ data }) => setLeads(data ?? []))
      .finally(() => setLoading(false))

    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `proyecto_id=eq.${projectId}` }, (payload) => {
        setLeads((prev) => {
          const copy = [...prev]
          const row: any = payload.new || payload.old
          const idx = copy.findIndex((l) => l.id === row.id)
          if (payload.eventType === 'INSERT') {
            if (idx === -1) copy.unshift(row)
          } else if (payload.eventType === 'UPDATE') {
            if (idx >= 0) copy[idx] = { ...copy[idx], ...row }
          } else if (payload.eventType === 'DELETE') {
            if (idx >= 0) copy.splice(idx, 1)
          }
          return copy
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return { leads, loading }
}

export default function Page() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const { leads, loading } = useLeadsRealtime(selectedProjectId)

  const metrics = useMemo(() => {
    const total = leads.length
    const qualified = leads.filter((l) => l.status?.toLowerCase() === 'qualified').length
    const highPotential = leads.filter((l) => (l.scoring_financiero ?? 0) >= 700).length
    const scores = leads.map((l) => l.scoring_financiero).filter((n) => typeof n === 'number') as number[]
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return { total, qualified, highPotential, avgScore }
  }, [leads])

  return (
    <main className="space-y-6">
      <Header selectedProjectId={selectedProjectId} onSelect={setSelectedProjectId} />
      <MetricsCards {...metrics} />
      {loading ? (
        <div className="text-sm text-gray-600">Cargando leads…</div>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </main>
  )
}
