import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Page() {
  // Placeholder fetch for proyectos; in MVP we may use a hardcoded desarrolladora_id
  const { data: proyectos } = await supabase.from('proyectos').select('*').limit(10)

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">Habitat AI Dashboard</h1>
      <p className="text-sm text-gray-600 mt-2">Proyectos conectados: {proyectos?.length ?? 0}</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Total Leads</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Qualified</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">High Potential</div>
          <div className="text-2xl font-bold">—</div>
        </div>
      </div>
    </main>
  )
}
