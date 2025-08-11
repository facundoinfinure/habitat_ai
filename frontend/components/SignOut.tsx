"use client"

import { Button } from './ui/button'
import { supabase } from '../lib/supabaseClient'

export function SignOut() {
  const onClick = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  return (
    <Button variant="secondary" onClick={onClick}>
      Cerrar sesión
    </Button>
  )
}
