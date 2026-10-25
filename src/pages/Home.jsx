import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageSlot from '../components/ImageSlot.jsx'
import MuaCard from '../components/MuaCard.jsx'
import { listMuas } from '../lib/api.js'

const SERVICES = [
  { name: 'Wedding', file: 'service-wedding.jpg', note: 'Akad, resepsi, adat & modern' },
  { name: 'Wisuda', file: 'service-wisuda.jpg', note: 'Flawless seharian, tahan foto' },
  { name: 'Party', file: 'service-party.jpg', note: 'Glam buat kondangan & pesta' },
  { name: 'Photoshoot', file: 'service-photoshoot.jpg', note: 'Editorial, konten, pre-wed' },
]

const MARQUEE = ['Wedding', 'Wisuda', 'Lamaran', 'Party', 'Photoshoot', 'Hijab', 'Soft glam', 'Bold look']

const STEPS = [
  { no: '01', title: 'Cari & cek look', text: 'Filter kota, kategori, dan budget. Lihat look asli, model, sampai produk yang dipakai.' },
  { no: '02', title: 'Booking & DP 5%', text: 'Pilih paket, tanggal, dan lokasi. Ongkos transport dihitung otomatis dari jarak.' },
  { no: '03', title: 'Chat & tinggal glow', text: 'Ngobrol langsung sama MUA-nya. H-2 kamu diingetin, biar nggak lupa.' },
]

function Home() {
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    listMuas()
      .then((muas) => setFeatured(muas.slice(0, 4)))
      .catch((error) => console.error(error))
  }, [])

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-blush-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-wine-400" />
            MUA se-Indonesia, satu tempat
          </span>
          <h1 className="mt-6 font-display text-6xl leading-[0.95] text-blush-50 sm:text-7xl lg:text-8xl">
            glow up <br />
            <span className="italic text-gradient">tanpa ribet.</span>
          </h1>
          <p className="mt-6 max-w-md text-blush-200">
            Temuin makeup artist yang vibes-nya pas sama kamu. Lihat portofolio asli, bandingin harga,
            terus langsung chat MUA-nya.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/mua"
              className="rounded-full bg-wine-gradient px-7 py-3.5 font-semibold text-white shadow-xl shadow-wine-700/40 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Cari MUA sekarang →
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-7 py-3.5 font-semibold text-blush-100 transition hover:border-wine-400 hover:text-white"
            >
              Aku MUA ✦
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blush-300">
            <span>✓ Ongkos transport otomatis</span>
            <span>✓ DP cuma 5%</span>
            <span>✓ Pengingat H-2</span>
          </div>
        </div>

        {/* Foto hero + kartu-kartu melayang */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="halftone absolute -left-6 -top-6 h-40 w-40 rounded-3xl opacity-70" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl shadow-wine-900/60">
            <ImageSlot name="hero.jpg" size="1200 × 1500" alt="Model dengan makeup glam" className="aspect-[4/5] w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
          </div>

          <div className="glass absolute -left-4 top-10 w-44 animate-float rounded-2xl p-3 shadow-xl sm:-left-12">
            <p className="text-[11px] uppercase tracking-widest text-blush-300">experience</p>
            <p className="mt-1 font-display text-3xl text-blush-50">7+ yrs</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-wine-gradient" />
            </div>
          </div>

          <div className="absolute -right-2 bottom-24 flex animate-float flex-col items-end gap-2 [animation-delay:1.5s] sm:-right-10">
            <span className="rounded-2xl rounded-br-sm bg-wine-gradient px-4 py-2 text-sm text-white shadow-lg">
              confidence in me?
            </span>
            <span className="glass rounded-2xl rounded-br-sm px-4 py-2 text-sm text-blush-50">
              for you, 10/10
            </span>
          </div>

          <div className="glass absolute -bottom-5 left-6 flex items-center gap-3 rounded-full py-2 pl-2 pr-5 shadow-xl">
            <ImageSlot name="hero-avatar.jpg" size="400 × 400" alt="" compact className="h-10 w-10 shrink-0 rounded-full" />
            <div className="text-xs">
              <p className="font-semibold text-blush-50">Booked for Saturday</p>
              <p className="text-blush-300">Wedding · Full day</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MARQUEE KATEGORI ---------- */}
      <div className="relative -rotate-1 border-y border-wine-500/30 bg-wine-900/60 py-4">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-3xl italic text-blush-100">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="flex items-center gap-10">
              {item} <span className="not-italic text-wine-400">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---------- LAYANAN ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-wine-400">what we do</p>
            <h2 className="mt-2 font-display text-5xl text-blush-50 sm:text-6xl">
              makeup <span className="italic">services</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm text-blush-300">Dari akad sampai konten TikTok, ada MUA yang spesialis di situ.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <Link
              key={s.name}
              to="/mua"
              className="group relative overflow-hidden rounded-3xl border border-white/10"
            >
              <ImageSlot name={s.file} size="600 × 800" alt={s.name} className="aspect-[3/4] w-full transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-display text-3xl text-blush-50">{s.name}</p>
                <p className="text-xs text-blush-300">{s.note}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- MUA PILIHAN ---------- */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-5xl text-blush-50 sm:text-6xl">
              fresh <span className="italic text-gradient">faces</span>
            </h2>
            <Link to="/mua" className="text-sm text-blush-200 underline-offset-4 hover:text-white hover:underline">
              Lihat semua MUA →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((mua) => (
              <MuaCard key={mua.id} mua={mua} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- CARA KERJA ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-wine-800 via-wine-900 to-ink-900 p-8 sm:p-14">
          <div className="halftone absolute -right-10 -top-10 h-64 w-64 rounded-full opacity-40" />
          <p className="text-xs uppercase tracking-[0.3em] text-wine-300">how it works</p>
          <h2 className="mt-2 font-display text-5xl text-blush-50 sm:text-6xl">
            3 langkah, <span className="italic">done.</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.no} className="glass rounded-3xl p-6">
                <p className="font-display text-5xl italic text-wine-300">{step.no}</p>
                <p className="mt-4 text-lg font-semibold text-blush-50">{step.title}</p>
                <p className="mt-2 text-sm text-blush-200">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- AJAKAN UNTUK MUA ---------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-24 md:grid-cols-2">
        <div className="relative">
          <ImageSlot name="cta-mua.jpg" size="1000 × 1250" alt="MUA sedang merias" className="aspect-[4/5] w-full rounded-[2.5rem] border border-white/10" />
          <div className="glass absolute -bottom-6 right-6 rounded-2xl px-5 py-3 text-sm">
            <p className="text-blush-300">link bio kamu</p>
            <p className="font-mono text-blush-50">{window.location.host}/mua/<span className="text-wine-300">namakamu</span></p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-wine-400">for makeup artists</p>
          <h2 className="mt-2 font-display text-5xl leading-tight text-blush-50 sm:text-6xl">
            kamu MUA? <br />
            <span className="italic text-gradient">show your art.</span>
          </h2>
          <p className="mt-6 max-w-md text-blush-200">
            Pajang look & video, atur paket dan tarif transport, terima booking + DP, chat sama klien, dan dapet link rapi
            (plus QR) buat bio Instagram.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-block rounded-full bg-blush-50 px-7 py-3.5 font-semibold text-ink-950 transition hover:-translate-y-0.5 hover:bg-white"
          >
            Gabung jadi MUA →
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
