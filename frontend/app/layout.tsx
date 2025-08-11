import './globals.css'
import type { Metadata } from 'next'
import { Sidebar } from '../components/Sidebar'
import { AuthGate } from '../components/AuthGate'
import { SignOut } from '../components/SignOut'

export const metadata: Metadata = {
  title: 'Habitat AI',
  description: 'Dashboard for real estate developers'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthGate>
          <div className="mx-auto flex min-h-screen max-w-7xl">
            <Sidebar />
            <div className="flex-1 p-6">
              <div className="flex items-center justify-end">
                <SignOut />
              </div>
              {children}
            </div>
          </div>
        </AuthGate>
      </body>
    </html>
  )
}
