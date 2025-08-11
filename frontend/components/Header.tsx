'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Proyecto = { id: string; nombre: string; desarrolladora_id?: string }

type Dev = { id: string; nombre: string }

export function Header({ selectedProjectId, onSelect }: { selectedProjectId?: string; onSelect: (id: string) => void }) {
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [devs, setDevs] = useState<Dev[]>([])
  const [devId, setDevId] = useState<string>('')

  useEffect(() => {
    fetch('/api/desarrolladoras')
      .then((r) => r.json())
      .then((j) => setDevs(j.items || []))
      .catch(() => setDevs([]))
  }, [])

  useEffect(() => {
    const desarrolladoraId = devId || process.env.NEXT_PUBLIC_DESARROLLADORA_ID
    const query = desarrolladoraId
      ? supabase.from('proyectos').select('id,nombre,desarrolladora_id').eq('desarrolladora_id', desarrolladoraId)
      : supabase.from('proyectos').select('id,nombre,desarrolladora_id')
    query.then(({ data }) => setProjects(data ?? []))
  }, [devId])

  useEffect(() => {
    const key = 'habitat.selectedProjectId'
    const initial = typeof window !== 'undefined' ? window.localStorage.getItem(key) : ''
    if (!selectedProjectId && initial) onSelect(initial)
    if (selectedProjectId) window.localStorage.setItem(key, selectedProjectId)
  }, [selectedProjectId, onSelect])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <h1 className="text-xl font-semibold">Habitat AI</h1>
      <div className="flex items-center gap-2">
        <select className="rounded-md border bg-white px-3 py-2 text-sm" value={devId} onChange={(e) => setDevId(e.target.value)}>
          <option value="">Todas las desarrolladoras</option>
          {devs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border bg-white px-3 py-2 text-sm"
          value={selectedProjectId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">Seleccionar proyecto…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
