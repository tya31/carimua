import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { isDemoMode, supabase } from '../lib/supabase.js'

const inputClass =
  'mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 focus:border-rose-400 focus:outline-none'

function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/dashboard'

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'error' | 'info', text }

  if (user) return <Navigate to={redirectTo} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) {
        setMessage({
          type: 'error',
          text:
            error.message === 'Invalid login credentials'
              ? 'Email atau password salah.'
              : error.message === 'Email not confirmed'
                ? 'Email belum dikonfirmasi. Cek inbox kamu dulu.'
                : error.message,
        })
        return
      }
      navigate(redirectTo, { replace: true })
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    setBusy(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (!data.session) {
      // Konfirmasi email aktif (default Supabase): user harus klik link di email dulu.
      setMessage({
        type: 'info',
        text: 'Pendaftaran berhasil! Cek email kamu dan klik link konfirmasi, lalu login di sini.',
      })
      setMode('login')
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  if (isDemoMode) {
    return (
      <section className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-rose-100">
        <h1 className="text-2xl font-bold">Login MUA</h1>
        <p className="mt-3 text-gray-600">
          Login belum aktif karena Supabase belum dihubungkan. Isi file <code>.env</code> sesuai
          README, lalu jalankan ulang <code>npm run dev</code>.
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-rose-100">
      <h1 className="text-2xl font-bold text-gray-900">
        {mode === 'login' ? 'Login MUA' : 'Daftar sebagai MUA'}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {mode === 'login'
          ? 'Masuk untuk mengelola profil, paket, dan portofolio.'
          : 'Buat akun, lalu lengkapi profilmu di dashboard.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        {message && (
          <p
            className={`rounded-lg p-3 text-sm ${
              message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setMessage(null)
          }}
          className="font-semibold text-rose-600 hover:underline"
        >
          {mode === 'login' ? 'Daftar' : 'Login'}
        </button>
      </p>
    </section>
  )
}

export default Login
