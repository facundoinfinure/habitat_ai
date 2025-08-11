'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/')
    })
  }, [router])

  const signInWithGoogle = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined } })
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Ingresar</h1>
        <p className="mt-1 text-sm text-gray-600">Accedé con tu cuenta de Google</p>
        <Button className="mt-6 w-full" onClick={signInWithGoogle} disabled={loading}>
          {loading ? 'Redirigiendo…' : 'Continuar con Google'}
        </Button>
      </div>
    </main>
  )
}
