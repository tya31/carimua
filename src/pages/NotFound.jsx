import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <Link to="/" className="mt-4 inline-block text-rose-600 hover:underline">
        Kembali ke beranda
      </Link>
    </section>
  )
}

export default NotFound
