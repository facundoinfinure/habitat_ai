export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-sm text-gray-600">Verificá la URL o volvé al inicio.</p>
      <a className="mt-4 text-sm text-blue-600 underline" href="/">Ir al inicio</a>
    </main>
  )
}
