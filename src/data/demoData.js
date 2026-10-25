// Data dummy MUA. Dipakai di 2 tempat:
// 1. "Mode demo" website (kalau .env Supabase belum diisi).
// 2. Script "npm run seed" yang memasukkan data ini ke database Supabase.
//
// Nomor WhatsApp sengaja memakai awalan 62800… (bukan nomor asli)
// supaya tombol WhatsApp di data dummy tidak nyasar ke orang sungguhan.

export const demoCategories = ['Wedding', 'Wisuda', 'Lamaran', 'Party', 'Photoshoot', 'Hijab']

// Contoh produk yang dipakai (opsional di setiap look).
const PRODUCT_SETS = [
  ['Estée Lauder Double Wear Foundation', 'Charlotte Tilbury Pillow Talk Lipstick', 'Huda Beauty Faux Mink Lashes'],
  ['NARS Radiant Creamy Concealer', 'Laura Mercier Translucent Powder', 'Rare Beauty Soft Pinch Blush'],
  [],
]

// Tiap judul jadi 1 look berisi 2 foto. Model & produk sengaja diisi sebagian saja (opsional).
const looks = (seed, titles) =>
  titles.map((title, i) => ({
    title,
    model_name: i % 2 === 0 ? `Model ${String.fromCharCode(65 + i)}` : null,
    products: PRODUCT_SETS[i % PRODUCT_SETS.length],
    media: [1, 2].map((n) => ({
      url: `https://picsum.photos/seed/${seed}-${i + 1}-${n}/600/800`,
      type: 'image',
    })),
  }))

export const demoMuas = [
  {
    email: 'rina@carimua.test',
    name: 'Rina Makeup Artistry',
    slug: 'rina-makeup',
    bio: 'MUA spesialis wedding adat Sunda & modern. Berpengalaman 7 tahun dengan lebih dari 300 klien pengantin. Menggunakan produk high-end dan tahan lama sampai acara selesai.',
    city: 'Bandung',
    area: 'Dago',
    whatsapp: '6280000000001',
    avatar_url: 'https://i.pravatar.cc/300?img=47',
    categories: ['Wedding', 'Lamaran', 'Hijab'],
    packages: [
      { name: 'Lamaran', description: 'Makeup + hairdo/hijab do untuk acara lamaran.', price: 850000 },
      { name: 'Akad Nikah', description: 'Makeup akad + touch up 1x, termasuk bulu mata.', price: 2500000 },
      { name: 'Wedding Full Day', description: 'Akad + resepsi, 2x ganti look, touch up sepanjang acara.', price: 5500000 },
    ],
    looks: looks('rina', ['Akad adat Sunda', 'Resepsi modern', 'Look lamaran soft', 'Hijab bridal']),
  },
  {
    email: 'sasa@carimua.test',
    name: 'Sasa Beauty',
    slug: 'sasa-beauty',
    bio: 'Natural flawless makeup untuk wisuda, party, dan photoshoot. Home service area Jakarta Selatan dan sekitarnya.',
    city: 'Jakarta',
    area: 'Jakarta Selatan',
    whatsapp: '6280000000002',
    avatar_url: 'https://i.pravatar.cc/300?img=45',
    categories: ['Wisuda', 'Party', 'Photoshoot'],
    packages: [
      { name: 'Wisuda', description: 'Makeup + simple hairdo, datang ke rumah.', price: 450000 },
      { name: 'Party / Kondangan', description: 'Glam makeup + bulu mata.', price: 550000 },
      { name: 'Photoshoot', description: 'Makeup untuk sesi foto hingga 4 jam, 1x ganti look.', price: 900000 },
    ],
    looks: looks('sasa', ['Wisuda natural', 'Glam party', 'Editorial photoshoot']),
  },
  {
    email: 'dewi@carimua.test',
    name: 'Dewi Bridal Studio',
    slug: 'dewi-bridal',
    bio: 'Studio bridal di Surabaya. Paket lengkap makeup pengantin, ibu, dan keluarga. Spesialis adat Jawa.',
    city: 'Surabaya',
    area: 'Surabaya Barat',
    whatsapp: '6280000000003',
    avatar_url: 'https://i.pravatar.cc/300?img=44',
    categories: ['Wedding', 'Lamaran'],
    packages: [
      { name: 'Lamaran', description: 'Makeup calon pengantin wanita.', price: 1000000 },
      { name: 'Pengantin Adat Jawa', description: 'Paes ageng / solo putri, termasuk sanggul.', price: 4500000 },
      { name: 'Paket Keluarga', description: 'Makeup untuk 2 ibu + 4 keluarga.', price: 3000000 },
    ],
    looks: looks('dewi', ['Paes ageng', 'Solo putri', 'Makeup ibu pengantin', 'Siraman']),
  },
  {
    email: 'ayu@carimua.test',
    name: 'Ayu Hijab Makeup',
    slug: 'ayu-hijab',
    bio: 'Spesialis makeup dan hijab styling yang rapi dan nyaman seharian. Melayani wisuda, lamaran, dan wedding.',
    city: 'Yogyakarta',
    area: 'Sleman',
    whatsapp: '6280000000004',
    avatar_url: 'https://i.pravatar.cc/300?img=32',
    categories: ['Hijab', 'Wisuda', 'Wedding'],
    packages: [
      { name: 'Wisuda + Hijab Do', description: 'Makeup flawless + hijab styling.', price: 350000 },
      { name: 'Lamaran Hijab', description: 'Makeup + hijab styling + aksesoris.', price: 750000 },
      { name: 'Wedding Hijab', description: 'Akad & resepsi, 2 look hijab.', price: 3500000 },
    ],
    looks: looks('ayu', ['Hijab wisuda', 'Hijab bridal', 'Hijab lamaran']),
  },
  {
    email: 'kadek@carimua.test',
    name: 'Kadek Glam Bali',
    slug: 'kadek-glam',
    bio: 'MUA untuk destination wedding dan photoshoot pre-wedding di Bali. Bisa travel ke seluruh Bali.',
    city: 'Denpasar',
    area: 'Seminyak',
    whatsapp: '6280000000005',
    avatar_url: 'https://i.pravatar.cc/300?img=41',
    categories: ['Wedding', 'Photoshoot', 'Party'],
    packages: [
      { name: 'Pre-wedding Shoot', description: 'Makeup + hairdo, standby 6 jam, 2 look.', price: 2000000 },
      { name: 'Destination Wedding', description: 'Bridal makeup + touch up sampai after party.', price: 6500000 },
    ],
    looks: looks('kadek', ['Pre-wedding pantai', 'Sunset bridal', 'Party glam', 'Beach wedding']),
  },
  {
    email: 'nadia@carimua.test',
    name: 'Nadia MUA',
    slug: 'nadia-mua',
    bio: 'Makeup soft glam dengan harga bersahabat untuk mahasiswa. Home service area Depok dan Jakarta Selatan.',
    city: 'Jakarta',
    area: 'Jakarta Timur',
    whatsapp: '6280000000006',
    avatar_url: 'https://i.pravatar.cc/300?img=26',
    categories: ['Wisuda', 'Party'],
    packages: [
      { name: 'Wisuda Hemat', description: 'Makeup natural tanpa hairdo.', price: 250000 },
      { name: 'Wisuda + Hairdo', description: 'Makeup + hairdo/hijab do.', price: 350000 },
      { name: 'Party', description: 'Soft glam + bulu mata.', price: 400000 },
    ],
    looks: looks('nadia', ['Soft glam wisuda', 'Party look']),
  },
  {
    email: 'tiara@carimua.test',
    name: 'Tiara Makeup Medan',
    slug: 'tiara-makeup',
    bio: 'MUA Medan untuk wedding adat Batak, Melayu, dan internasional. Tim berpengalaman untuk acara besar.',
    city: 'Medan',
    area: 'Medan Kota',
    whatsapp: '6280000000007',
    avatar_url: 'https://i.pravatar.cc/300?img=29',
    categories: ['Wedding', 'Lamaran', 'Party'],
    packages: [
      { name: 'Lamaran / Martupol', description: 'Makeup + hairdo.', price: 1200000 },
      { name: 'Wedding Adat', description: 'Makeup pengantin adat + touch up.', price: 4000000 },
      { name: 'Party', description: 'Makeup glam untuk tamu / keluarga.', price: 500000 },
    ],
    looks: looks('tiara', ['Adat Batak', 'Adat Melayu', 'International bride']),
  },
  {
    email: 'laras@carimua.test',
    name: 'Laras Studio',
    slug: 'laras-studio',
    bio: 'Studio makeup & foto di Bandung. Cocok untuk photoshoot produk, wisuda, dan konten sosial media.',
    city: 'Bandung',
    area: 'Buah Batu',
    whatsapp: '6280000000008',
    avatar_url: 'https://i.pravatar.cc/300?img=20',
    categories: ['Photoshoot', 'Wisuda'],
    packages: [
      { name: 'Wisuda Studio', description: 'Makeup di studio + 5 foto edit.', price: 400000 },
      { name: 'Content Creator', description: 'Makeup untuk shooting konten, 3 jam.', price: 700000 },
    ],
    looks: looks('laras', ['Konten beauty', 'Wisuda studio', 'Editorial']),
  },
]

// Titik berangkat (perkiraan pusat area) & tarif transport tiap MUA dummy.
export const demoTransport = {
  'rina-makeup': { base_lat: -6.8850, base_lng: 107.6130, base_address: 'Dago, Bandung', transport_rate_per_km: 4000, free_km: 5 },
  'sasa-beauty': { base_lat: -6.2615, base_lng: 106.8106, base_address: 'Jakarta Selatan', transport_rate_per_km: 5000, free_km: 3 },
  'dewi-bridal': { base_lat: -7.2640, base_lng: 112.6800, base_address: 'Surabaya Barat', transport_rate_per_km: 4000, free_km: 5 },
  'ayu-hijab': { base_lat: -7.7160, base_lng: 110.3550, base_address: 'Sleman, Yogyakarta', transport_rate_per_km: 3000, free_km: 5 },
  'kadek-glam': { base_lat: -8.6910, base_lng: 115.1680, base_address: 'Seminyak, Bali', transport_rate_per_km: 6000, free_km: 0 },
  'nadia-mua': { base_lat: -6.2250, base_lng: 106.9000, base_address: 'Jakarta Timur', transport_rate_per_km: 3000, free_km: 5 },
  'tiara-makeup': { base_lat: -3.5952, base_lng: 98.6722, base_address: 'Medan Kota', transport_rate_per_km: 3500, free_km: 5 },
  'laras-studio': { base_lat: -6.9460, base_lng: 107.6330, base_address: 'Buah Batu, Bandung', transport_rate_per_km: 3000, free_km: 3 },
}