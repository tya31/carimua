import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.js'

// Pembungkus halaman yang hanya boleh dibuka MUA yang sudah login.
// Kalau belum login, diarahkan ke /login lalu dikembalikan ke sini setelah berhasil masuk.
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-blush-300">Memuat…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default RequireAuth
