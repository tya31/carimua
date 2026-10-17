import { Link } from 'react-router-dom'

function Home() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900">
        Temukan MUA terbaik di kotamu
      </h1>
      <p className="mt-4 text-gray-600">
        Lihat portofolio, bandingkan harga paket, lalu hubungi langsung via WhatsApp.
      </p>
      <Link
        to="/mua"
        className="mt-8 inline-block rounded-full bg-rose-600 px-8 py-3 font-semibold text-white hover:bg-rose-700"
      >
        Cari MUA
      </Link>
    </section>
  )
}

export default Home
