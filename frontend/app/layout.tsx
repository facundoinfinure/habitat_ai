import './globals.css'
import type { Metadata } from 'next'
import { Sidebar } from '../components/Sidebar'

export const metadata: Metadata = {
  title: 'Habitat AI',
  description: 'Dashboard for real estate developers'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="mx-auto flex min-h-screen max-w-7xl">
          <Sidebar />
          <div className="flex-1 p-6">{children}</div>
        </div>
      </body>
    </html>
  )
}
