'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { LeadsTable } from '../../components/LeadsTable'

export default function LeadsPage() {
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState('')
  const [leads, setLeads] = useState<any[]>([])

  useEffect(() => {
    if (!projectId) return setLeads([])
    const q = supabase
      .from('leads')
      .select('id,phone_number,status,scoring_financiero,tags,last_interaction_at')
      .eq('proyecto_id', projectId)
      .order('last_interaction_at', { ascending: false })
    q.then(({ data }) => setLeads(data ?? []))
  }, [projectId])

  const filtered = useMemo(() => {
    return leads.filter((l) => (status ? l.status?.toLowerCase() === status : true))
  }, [leads, status])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Leads</h1>
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="rounded-md border bg-white px-3 py-2 text-sm"
          placeholder="Proyecto ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
        <select className="rounded-md border bg-white px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="post-sale">Post-Sale</option>
        </select>
      </div>
      <LeadsTable leads={filtered} />
    </div>
  )
}
