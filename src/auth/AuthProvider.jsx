import { useEffect, useState } from 'react'
import { isDemoMode, supabase } from '../lib/supabase.js'
import { AuthContext } from './AuthContext.js'

// Menyimpan status login (session) dan membagikannya ke seluruh aplikasi.
// Supabase menyimpan session di localStorage, jadi user tetap login setelah refresh.
function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(!isDemoMode)

  useEffect(() => {
    if (isDemoMode) return

    // onAuthStateChange langsung memanggil callback sekali dengan session saat ini
    // (event INITIAL_SESSION), lalu setiap kali user login / logout.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
