const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export const formatRupiah = (n) => rupiah.format(n)

// "Rp250.000 – Rp400.000", atau teks lain kalau belum ada paket.
export function formatPriceRange(min, max) {
  if (min == null) return 'Belum ada paket'
  if (min === max) return formatRupiah(min)
  return `${formatRupiah(min)} – ${formatRupiah(max)}`
}

// Ubah nomor seperti "0812-3456-7890" / "+62 812..." jadi "628123457890".
export function normalizeWhatsapp(number) {
  const digits = (number ?? '').replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

export function whatsappLink(number, muaName) {
  const text = `Halo ${muaName}, saya lihat profil Anda di CariMUA dan ingin tanya soal paket makeup.`
  return `https://wa.me/${normalizeWhatsapp(number)}?text=${encodeURIComponent(text)}`
}

// "Rina Makeup Artistry" → "rina-makeup-artistry"
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
