// Halaman Kebijakan Privasi & Syarat Layanan (dibutuhkan Google untuk login Google).
// Isinya sengaja sederhana dan jujur: ini project portofolio, bukan layanan komersial.
const CONTENT = {
  privacy: {
    eyebrow: 'privacy policy',
    title: 'Kebijakan Privasi',
    sections: [
      {
        heading: 'Tentang CariMUA',
        body: 'CariMUA adalah project portofolio yang mempertemukan klien dengan makeup artist (MUA). Website ini tidak dijalankan sebagai layanan komersial.',
      },
      {
        heading: 'Data yang kami simpan',
        body: 'Saat kamu mendaftar atau login (dengan email atau Google), kami menyimpan alamat email, nama, foto profil dari akun Google (jika ada), dan peran akun (Klien / MUA). MUA juga dapat mengisi profil publik: nama, kota, area, nomor WhatsApp, bio, paket harga, dan foto portofolio.',
      },
      {
        heading: 'Untuk apa data dipakai',
        body: 'Data hanya dipakai untuk menjalankan fitur website: login, menampilkan profil MUA, dan menghubungkan klien dengan MUA. Kami tidak menjual atau membagikan data ke pihak lain untuk iklan.',
      },
      {
        heading: 'Penyimpanan',
        body: 'Data disimpan di Supabase (database & penyimpanan file) dan website di-hosting di Vercel. Profil MUA bersifat publik; data akun lainnya hanya bisa diakses sesuai aturan keamanan database (Row Level Security).',
      },
      {
        heading: 'Menghapus data',
        body: 'Kamu bisa meminta akun dan datamu dihapus kapan saja dengan menghubungi pengelola website melalui email yang tercantum di halaman login Google aplikasi ini.',
      },
    ],
  },
  terms: {
    eyebrow: 'terms of service',
    title: 'Syarat Layanan',
    sections: [
      {
        heading: 'Penggunaan',
        body: 'CariMUA adalah project portofolio. Fitur dapat berubah sewaktu-waktu dan website disediakan "apa adanya" tanpa jaminan.',
      },
      {
        heading: 'Akun',
        body: 'Kamu bertanggung jawab atas keamanan akunmu. Peran akun (Klien / MUA) dipilih sekali saat pendaftaran.',
      },
      {
        heading: 'Konten MUA',
        body: 'MUA bertanggung jawab atas keaslian foto portofolio, harga, dan informasi yang ditampilkan di profilnya, serta wajib memiliki izin atas foto yang diunggah.',
      },
      {
        heading: 'Transaksi',
        body: 'Kesepakatan jasa terjadi langsung antara klien dan MUA. Fitur pembayaran di website ini (jika ada) menggunakan mode uji coba (sandbox) dan tidak memproses uang sungguhan.',
      },
    ],
  },
}

function Legal({ kind }) {
  const page = CONTENT[kind]
  return (
    <article className="mx-auto max-w-3xl py-6">
      <p className="text-xs uppercase tracking-[0.3em] text-wine-400">{page.eyebrow}</p>
      <h1 className="mt-2 font-display text-5xl text-blush-50 sm:text-6xl">{page.title}</h1>
      <p className="mt-2 text-sm text-blush-400">Terakhir diperbarui: Oktober 2026</p>
      <div className="mt-10 space-y-8">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold text-blush-50">{s.heading}</h2>
            <p className="mt-2 leading-relaxed text-blush-200">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}

export default Legal
