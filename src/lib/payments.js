// Pembayaran DP lewat Midtrans Snap (pop-up pembayaran resmi Midtrans).
import { supabase } from './supabase.js'

const CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
const SNAP_JS = 'https://app.sandbox.midtrans.com/snap/snap.js' // sandbox

export const paymentsEnabled = Boolean(CLIENT_KEY)

export const PAYMENT_STATUS = {
  pending: { label: 'Menunggu pembayaran', className: 'text-amber-200' },
  paid: { label: 'Lunas', className: 'text-emerald-300' },
  expired: { label: 'Kedaluwarsa', className: 'text-blush-400' },
  failed: { label: 'Gagal', className: 'text-wine-300' },
}

// "bank_transfer" → "Bank Transfer"
export const formatPaymentType = (type) =>
  type ? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—'

let snapPromise = null
function loadSnap() {
  snapPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SNAP_JS
    script.dataset.clientKey = CLIENT_KEY
    script.onload = () => resolve(window.snap)
    script.onerror = () => {
      snapPromise = null
      reject(new Error('Gagal memuat Midtrans. Cek koneksi internet.'))
    }
    document.head.appendChild(script)
  })
  return snapPromise
}

async function callPayments(body) {
  const { data, error } = await supabase.functions.invoke('payments', { body })
  if (error) {
    // Ambil pesan error dari function kalau ada.
    const detail = await error.context?.json?.().catch(() => null)
    throw new Error(detail?.error ?? error.message)
  }
  return data
}

// Cek ulang status pembayaran booking ke Midtrans (lewat server).
export const syncPayment = (bookingId) => callPayments({ action: 'sync', booking_id: bookingId })

// Buka pop-up Snap untuk bayar DP. Selesai (sukses/pending/tutup) → status disinkronkan.
export async function payDp(bookingId) {
  const [snap, { token }] = await Promise.all([loadSnap(), callPayments({ action: 'create', booking_id: bookingId })])
  await new Promise((resolve) => {
    snap.pay(token, { onSuccess: resolve, onPending: resolve, onError: resolve, onClose: resolve })
  })
  return syncPayment(bookingId)
}
