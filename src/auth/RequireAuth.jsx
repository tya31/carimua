import { Navigate, useLocation } from 'react-router-dom'
import { isDemoMode } from '../lib/supabase.js'
import { homeForRole, useAuth } from './AuthContext.js'

// Pembungkus halaman yang wajib login.
// - Belum login        → ke /login (lalu dikembalikan ke sini setelah berhasil masuk).
// - Belum pilih peran  → ke /pilih-peran.
// - role diisi & peran user beda → ke halaman rumah perannya sendiri.
// Di mode demo (tanpa Supabase) semua halaman dibiarkan terbuka.
function RequireAuth({ children, role }) {
  const { user, role: userRole, loading } = useAuth()
  const location = useLocation()

  if (isDemoMode) return children
  if (loading) return <p className="text-blush-300">Memuat…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (!userRole) return <Navigate to="/pilih-peran" replace state={{ from: location.pathname + location.search }} />
  if (role && userRole !== role) return <Navigate to={homeForRole(userRole)} replace />
  return children
}

export default RequireAuth
