import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

// Pembungkus halaman biasa (selain beranda yang full-width).
// Suspense menampilkan "Memuat…" selama halaman yang di-lazy-load sedang diunduh.
function Container() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[2.5rem] bg-white/5" />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

export default Container
