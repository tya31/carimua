import { createContext, useContext } from 'react'

// { session, user, profile, role, loading, refreshProfile } — diisi oleh <AuthProvider>.
export const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  refreshProfile: () => {},
})

export const useAuth = () => useContext(AuthContext)

// Halaman "rumah" untuk tiap peran setelah login.
export const homeForRole = (role) => (role === 'mua' ? '/dashboard' : role === 'client' ? '/akun' : '/pilih-peran')
