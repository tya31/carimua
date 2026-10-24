import { Outlet } from 'react-router-dom'

// Pembungkus halaman biasa (selain beranda yang full-width).
function Container() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10">
      <Outlet />
    </div>
  )
}

export default Container
