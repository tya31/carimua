import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { homeForRole, useAuth } from '../auth/AuthContext.js'
import { isDemoMode, supabase } from '../lib/supabase.js'
import { useUnreadCount } from './chat/useUnreadCount.js'
import Logo from './Logo.jsx'
import NotificationBell from './NotificationBell.jsx'

const year = new Date().getFullYear()

// Kerangka semua halaman: navbar kaca melayang, isi halaman, footer.
function Layout() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const unread = useUnreadCount(role ? user?.id : null)

  async function handleLogout() {
    // Pindah ke beranda dulu, supaya halaman yang wajib login tidak keburu melempar ke /login.
    setOpen(false)
    navigate('/')
    await supabase.auth.signOut()
  }

  const navClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm transition ${
      isActive ? 'bg-white/10 text-white' : 'text-blush-200 hover:text-white'
    }`

  const links = (
    <>
      <NavLink to="/mua" className={navClass} onClick={() => setOpen(false)}>
        Cari MUA
      </NavLink>
      {user ? (
        <>
          {role && (
            <NavLink to="/chat" className={navClass} onClick={() => setOpen(false)}>
              Chat
              {unread > 0 && (
                <span className="ml-1.5 rounded-full bg-wine-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          )}
          {role && (
            <NavLink to={homeForRole(role)} className={navClass} onClick={() => setOpen(false)}>
              {role === 'mua' ? 'Dashboard' : 'Akun saya'}
            </NavLink>
          )}
          <button type="button" onClick={handleLogout} className="rounded-full px-4 py-2 text-sm text-blush-200 hover:text-white">
            Keluar
          </button>
        </>
      ) : (
        <Link
          to="/login"
          onClick={() => setOpen(false)}
          className="rounded-full bg-wine-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-wine-700/40 transition hover:brightness-110"
        >
          Masuk
        </Link>
      )}
    </>
  )

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {/* Cahaya merah samar di latar belakang */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-wine-700/25 blur-[120px]" />

      {isDemoMode && (
        <div className="relative z-10 bg-amber-400/90 px-4 py-2 text-center text-xs font-medium text-ink-950">
          Mode demo: menampilkan data dummy. Isi file <code>.env</code> untuk menghubungkan Supabase.
        </div>
      )}

      <header className="sticky top-0 z-40 px-4 pt-4">
        <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full py-2 pl-6 pr-2">
          <Link to="/" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-1 sm:flex">{links}</div>
            {user && role && <NotificationBell userId={user.id} />}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="rounded-full px-4 py-2 text-sm text-blush-100 sm:hidden"
              aria-expanded={open}
              aria-label="Menu"
            >
              {open ? '✕' : '☰'}
            </button>
          </div>
        </nav>
        {open && (
          <div className="glass mx-auto mt-2 flex max-w-6xl flex-col items-stretch gap-1 rounded-3xl p-3 sm:hidden">
            {links}
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1">
        <Outlet />
      </main>

      <footer className="relative z-10 mt-24 border-t border-white/5 px-4 pb-10 pt-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-5xl leading-none text-blush-50 sm:text-7xl">
              find your <span className="italic text-gradient">glam.</span>
            </p>
            <p className="mt-4 max-w-sm text-sm text-blush-300">
              Platform buat nemuin makeup artist yang vibes-nya cocok sama kamu.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-blush-200 sm:items-end">
            <Link to="/mua" className="hover:text-white">Cari MUA</Link>
            <Link to="/login" className="hover:text-white">Gabung jadi MUA</Link>
            <Link to="/privasi" className="hover:text-white">Kebijakan Privasi</Link>
            <Link to="/syarat" className="hover:text-white">Syarat Layanan</Link>
            <span className="mt-4 text-xs text-blush-400">© {year} CariMUA</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
