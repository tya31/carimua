import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="py-24 text-center">
      <p className="font-display text-8xl italic text-gradient">404</p>
      <h1 className="mt-2 text-xl font-semibold text-blush-50">Halamannya nggak ketemu 🫠</h1>
      <Link
        to="/"
        className="mt-8 inline-block rounded-full bg-wine-gradient px-6 py-3 font-semibold text-white"
      >
        Balik ke beranda
      </Link>
    </section>
  )
}

export default NotFound
