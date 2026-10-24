import { useCallback, useEffect, useState } from 'react'
import { isDemoMode, supabase } from '../lib/supabase.js'
import { AuthContext } from './AuthContext.js'

// Menyimpan status login (session) + profil akun (berisi PERAN: 'client' / 'mua')
// dan membagikannya ke seluruh aplikasi.
// Supabase menyimpan session di localStorage, jadi user tetap login setelah refresh.
function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(!isDemoMode)
  // profile disimpan bersama userId-nya, supaya ketahuan kalau masih milik user sebelumnya.
  const [profileState, setProfileState] = useState({ userId: null, profile: null })
  const [version, setVersion] = useState(0)

  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (isDemoMode) return

    // onAuthStateChange langsung memanggil callback sekali dengan session saat ini
    // (event INITIAL_SESSION), lalu setiap kali user login / logout.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setSessionLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Ambil baris "profiles" setiap user berganti (atau saat refreshProfile dipanggil).
  useEffect(() => {
    if (!userId) return
    let ignore = false
    supabase
      .from('profiles')
      .select('id, role, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error(error)
        if (!ignore) setProfileState({ userId, profile: data ?? null })
      })
    return () => {
      ignore = true
    }
  }, [userId, version])

  const refreshProfile = useCallback(() => setVersion((v) => v + 1), [])

  const profile = profileState.userId === userId ? profileState.profile : null
  const loading = sessionLoading || (userId !== null && profileState.userId !== userId)

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, role: profile?.role ?? null, loading, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
