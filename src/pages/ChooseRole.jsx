import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { homeForRole, useAuth } from '../auth/AuthContext.js'
import { supabase } from '../lib/supabase.js'

const ROLES = [
  {
    value: 'client',
    emoji: '💄',
    title: 'Aku Klien',
    text: 'Cari MUA, lihat portofolio, booking, dan chat langsung sama MUA-nya.',
  },
  {
    value: 'mua',
    emoji: '🎨',
    title: 'Aku MUA',
    text: 'Pajang portofolio & paket harga, terima booking, dapet link buat bio Instagram.',
  },
]

// Muncul sekali untuk akun yang belum punya peran (misalnya baru login pakai Google).
function ChooseRole() {
  const { user, role, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  if (loading) return <p className="text-blush-300">Memuat…</p>
  if (!user) return <Navigate to="/login" replace />
  if (role) return <Navigate to={homeForRole(role)} replace />

  async function choose(value) {
    setBusy(value)
    setError(null)
    const { error: updateError } = await supabase.from('profiles').update({ role: value }).eq('id', user.id)
    if (updateError) {
      setBusy(null)
      return setError(updateError.message)
    }
    refreshProfile()
    // Klien yang tadinya mau buka halaman tertentu (mis. /mua) dikembalikan ke sana.
    navigate(value === 'client' && location.state?.from ? location.state.from : homeForRole(value), { replace: true })
  }

  return (
    <section className="mx-auto max-w-3xl py-10 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-wine-400">satu langkah lagi</p>
      <h1 className="mt-2 font-display text-5xl text-blush-50 sm:text-6xl">
        kamu <span className="italic text-gradient">siapa?</span>
      </h1>
      <p className="mt-3 text-blush-300">Pilih sekali aja ya, nanti nggak bisa diganti.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={busy !== null}
            onClick={() => choose(r.value)}
            className="glass group rounded-[2rem] p-8 text-left transition hover:-translate-y-1 hover:border-wine-400/60 disabled:opacity-60"
          >
            <span className="text-4xl">{r.emoji}</span>
            <p className="mt-4 font-display text-4xl text-blush-50">{r.title}</p>
            <p className="mt-2 text-sm text-blush-300">{r.text}</p>
            <p className="mt-6 text-sm font-semibold text-wine-300 group-hover:text-wine-400">
              {busy === r.value ? 'Menyimpan…' : 'Pilih →'}
            </p>
          </button>
        ))}
      </div>
      {error && <p className="mt-6 text-sm text-wine-300">{error}</p>}
    </section>
  )
}

export default ChooseRole
