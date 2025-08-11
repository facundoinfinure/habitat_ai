export default function ConfigPage() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ]
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Configuración</h1>
      <p className="text-sm text-gray-600">Variables de entorno requeridas en Vercel:</p>
      <ul className="list-inside list-disc text-sm">
        {required.map((k) => (
          <li key={k}>
            <code>{k}</code>
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-600">Endpoint RAG unificado: <code>/api/query</code></p>
      <p className="text-sm text-gray-600">Ingesta de documentos (batch): <code>/api/embed</code></p>
    </div>
  )
}
