import { Link, NavLink, Outlet } from 'react-router-dom'

const year = new Date().getFullYear()

// Kerangka yang sama di semua halaman: navbar di atas, isi halaman di tengah,
// footer di bawah. <Outlet /> adalah tempat halaman aktif ditampilkan.
function Layout() {
  const navClass = ({ isActive }) =>
    isActive ? 'text-rose-600 font-semibold' : 'text-gray-600 hover:text-rose-600'

  return (
    <div className="min-h-screen flex flex-col bg-rose-50 text-gray-800">
      <header className="bg-white border-b border-rose-100">
        <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-rose-600">
            CariMUA
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <NavLink to="/mua" className={navClass}>
              Cari MUA
            </NavLink>
            <NavLink to="/login" className={navClass}>
              Login MUA
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-rose-100 bg-white py-6 text-center text-sm text-gray-500">
        © {year} CariMUA
      </footer>
    </div>
  )
}

export default Layout
