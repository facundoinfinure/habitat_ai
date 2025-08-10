'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Proyecto = { id: string; nombre: string }

export function Header({ selectedProjectId, onSelect }: { selectedProjectId?: string; onSelect: (id: string) => void }) {
  const [projects, setProjects] = useState<Proyecto[]>([])

  useEffect(() => {
    const desarrolladoraId = process.env.NEXT_PUBLIC_DESARROLLADORA_ID
    const query = desarrolladoraId
      ? supabase.from('proyectos').select('id,nombre').eq('desarrolladora_id', desarrolladoraId)
      : supabase.from('proyectos').select('id,nombre')
    query.then(({ data }) => setProjects(data ?? []))
  }, [])

  return (
    <div className="flex items-center justify-between py-4">
      <h1 className="text-xl font-semibold">Habitat AI</h1>
      <div>
        <label className="mr-2 text-sm text-gray-600">Proyecto</label>
        <select
          className="rounded-md border bg-white px-3 py-2 text-sm"
          value={selectedProjectId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">Seleccionar…</option>
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
