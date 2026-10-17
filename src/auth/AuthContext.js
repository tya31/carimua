import { createContext, useContext } from 'react'

// { session, user, loading } — diisi oleh <AuthProvider>.
export const AuthContext = createContext({ session: null, user: null, loading: true })

export const useAuth = () => useContext(AuthContext)
