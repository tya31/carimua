import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { homeForRole, useAuth } from '../auth/AuthContext.js'
import Icon from '../components/Icon.jsx'
import ImageSlot from '../components/ImageSlot.jsx'
import Logo from '../components/Logo.jsx'
import { isDemoMode, supabase } from '../lib/supabase.js'

const inputClass =
  'mt-1.5 w-full rounded-2xl border border-white/10 bg-ink-800 px-4 py-3 text-blush-50 placeholder:text-blush-400 focus:border-wine-400 focus:outline-none'

// Akun demo untuk recruiter / pengunjung portofolio (dibuat oleh "npm run seed").
const DEMO_ACCOUNTS = [
  { label: 'Demo Klien', email: 'klien@carimua.test' },
  { label: 'Demo MUA', email: 'rina@carimua.test' },
]
const DEMO_PASSWORD = 'carimua123'

const ROLES = [
  { value: 'client', icon: 'user', title: 'Klien', text: 'Aku mau cari & booking MUA' },
  { value: 'mua', icon: 'brush', title: 'MUA', text: 'Aku makeup artist' },
]

function translateError(message) {
  if (message === 'Invalid login credentials') return 'Email atau password salah.'
  if (message === 'Email not confirmed') return 'Email belum dikonfirmasi. Cek inbox kamu dulu.'
  if (message === 'User already registered') return 'Email ini sudah terdaftar. Silakan login.'
  return message
}

function Login() {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [newRole, setNewRole] = useState('client')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  // Kalau login Google gagal, Supabase mengembalikan ke sini dengan ?error_description=… (atau di #hash).
  const [message, setMessage] = useState(() => {
    const params = new URLSearchParams(location.search || location.hash.slice(1))
    const desc = params.get('error_description')
    return desc ? { type: 'error', text: `Login Google gagal: ${desc.replace(/\+/g, ' ')}` } : null
  }) // { type: 'error' | 'info', text }

  // Sudah login → arahkan ke halaman yang tadi dituju, atau ke rumah sesuai peran.
  if (user && !loading) {
    if (!role) return <Navigate to="/pilih-peran" replace state={location.state} />
    return <Navigate to={location.state?.from ?? homeForRole(role)} replace />
  }

  async function signIn(loginEmail, loginPassword) {
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
    setBusy(false)
    if (error) setMessage({ type: 'error', text: translateError(error.message) })
    // Kalau berhasil, AuthProvider memperbarui user → komponen ini otomatis redirect.
  }

  async function signInWithGoogle() {
    setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Setelah login di Google, kembali ke /login → diarahkan sesuai peran.
      options: { redirectTo: `${window.location.origin}/login` },
    })
    if (error) setMessage({ type: 'error', text: translateError(error.message) })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (mode === 'login') return signIn(email, password)

    setBusy(true)
    setMessage(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Disimpan ke tabel profiles oleh trigger di supabase/02_roles.sql
        data: { role: newRole, full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    setBusy(false)
    if (error) {
      setMessage({ type: 'error', text: translateError(error.message) })
    } else if (!data.session) {
      // Konfirmasi email aktif (default Supabase): user harus klik link di email dulu.
      setMessage({ type: 'info', text: 'Pendaftaran berhasil! Cek email kamu dan klik link konfirmasi, lalu login di sini.' })
      setMode('login')
    }
  }

  const title = mode === 'login' ? 'welcome back' : 'join the glam'

  return (
    <section className="mx-auto grid max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-ink-900 md:grid-cols-2">
      {/* Panel foto kiri */}
      <div className="relative hidden min-h-[620px] md:block">
        <ImageSlot name="login-side.jpg" size="1000 × 1400" alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-950 via-wine-900/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8">
          <Logo className="text-4xl" />
          <p className="mt-3 max-w-xs text-sm text-blush-200">
            keep moving forward on a stable journey — and look good doing it.
          </p>
        </div>
      </div>

      {/* Form kanan */}
      <div className="p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-wine-400">{mode === 'login' ? 'login' : 'daftar'}</p>
        <h1 className="mt-2 font-display text-5xl italic text-blush-50">{title}</h1>
        <p className="mt-2 text-sm text-blush-300">
          {location.state?.from ? 'Login dulu ya buat lanjut.' : 'Klien & MUA masuk dari sini.'}
        </p>

        {isDemoMode ? (
          <p className="glass mt-8 rounded-2xl p-4 text-sm text-blush-200">
            Login belum aktif karena Supabase belum dihubungkan. Isi file <code>.env</code> sesuai README, lalu
            jalankan ulang <code>npm run dev</code>.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-blush-50 py-3 font-semibold text-ink-950 transition hover:bg-white"
            >
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Lanjut dengan Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-blush-400">
              <span className="h-px flex-1 bg-white/10" /> atau pakai email <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setNewRole(r.value)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          newRole === r.value
                            ? 'border-wine-400 bg-wine-900/60 shadow-lg shadow-wine-700/30'
                            : 'border-white/10 hover:border-white/25'
                        }`}
                      >
                        <Icon name={r.icon} className="h-6 w-6 text-wine-300" />
                        <p className="mt-1 font-semibold text-blush-50">{r.title}</p>
                        <p className="text-xs text-blush-300">{r.text}</p>
                      </button>
                    ))}
                  </div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-blush-300">
                    Nama
                    <input
                      required
                      autoComplete="name"
                      placeholder="Nama kamu"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </>
              )}
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
                {busy ? 'Memproses…' : mode === 'login' ? 'Masuk →' : `Daftar sebagai ${newRole === 'mua' ? 'MUA' : 'Klien'} →`}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-blush-300">
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

            {/* Akun demo: untuk recruiter yang mau coba tanpa daftar */}
            <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-4">
              <p className="text-xs uppercase tracking-widest text-blush-400">cuma mau lihat-lihat?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={busy}
                    onClick={() => signIn(acc.email, DEMO_PASSWORD)}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-blush-100 transition hover:border-wine-400 disabled:opacity-60"
                  >
                    {acc.label} →
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default Login
