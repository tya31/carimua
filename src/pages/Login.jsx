import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import ImageSlot from '../components/ImageSlot.jsx'
import Logo from '../components/Logo.jsx'
import { isDemoMode, supabase } from '../lib/supabase.js'

const inputClass =
  'mt-1.5 w-full rounded-2xl border border-white/10 bg-ink-800 px-4 py-3 text-blush-50 placeholder:text-blush-400 focus:border-wine-400 focus:outline-none'

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

  const title = mode === 'login' ? 'welcome back' : 'join the glam'

  return (
    <section className="mx-auto grid max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-ink-900 md:grid-cols-2">
      {/* Panel foto kiri */}
      <div className="relative hidden min-h-[560px] md:block">
        <ImageSlot name="login-side.jpg" size="1000 × 1400" alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-950 via-wine-900/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8">
          <Logo className="text-4xl" />
          <p className="mt-3 max-w-xs text-sm text-blush-200">
            keep moving forward on a stable journey — and look good doing it ✨
          </p>
        </div>
      </div>

      {/* Form kanan */}
      <div className="p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-wine-400">
          {mode === 'login' ? 'login' : 'daftar'}
        </p>
        <h1 className="mt-2 font-display text-5xl italic text-blush-50">{title}</h1>
        <p className="mt-2 text-sm text-blush-300">
          {mode === 'login'
            ? 'Masuk untuk mengelola profil, paket, dan portofolio.'
            : 'Buat akun, lalu lengkapi profilmu di dashboard.'}
        </p>

        {isDemoMode ? (
          <p className="glass mt-8 rounded-2xl p-4 text-sm text-blush-200">
            Login belum aktif karena Supabase belum dihubungkan. Isi file <code>.env</code> sesuai README, lalu
            jalankan ulang <code>npm run dev</code>.
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block text-xs font-medium uppercase tracking-wider text-blush-300">
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="kamu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wider text-blush-300">
                Password
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </label>

              {message && (
                <p
                  className={`rounded-2xl p-3 text-sm ${
                    message.type === 'error'
                      ? 'border border-wine-400/40 bg-wine-900/50 text-wine-300'
                      : 'border border-emerald-400/30 bg-emerald-900/30 text-emerald-300'
                  }`}
                >
                  {message.text}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-wine-gradient py-3.5 font-semibold text-white shadow-lg shadow-wine-700/40 transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? 'Memproses…' : mode === 'login' ? 'Masuk →' : 'Daftar →'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-blush-300">
              {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setMessage(null)
                }}
                className="font-semibold text-wine-300 hover:underline"
              >
                {mode === 'login' ? 'Daftar' : 'Login'}
              </button>
            </p>
          </>
        )}
      </div>
    </section>
  )
}

export default Login
