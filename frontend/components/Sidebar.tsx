import Link from 'next/link'

export function Sidebar() {
  return (
    <aside className="hidden w-60 flex-shrink-0 border-r bg-white p-4 md:block">
      <div className="text-xs font-semibold text-gray-500">Navegación</div>
      <nav className="mt-3 grid gap-2 text-sm">
        <Link className="rounded-md px-2 py-1 hover:bg-gray-50" href="/">Dashboard</Link>
        <Link className="rounded-md px-2 py-1 hover:bg-gray-50" href="/leads">Leads</Link>
        <Link className="rounded-md px-2 py-1 hover:bg-gray-50" href="/config">Configuración</Link>
      </nav>
    </aside>
  )
}
