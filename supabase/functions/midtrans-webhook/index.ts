// Edge Function "midtrans-webhook" — dipanggil oleh SERVER Midtrans setiap status transaksi berubah.
// URL ini didaftarkan di Midtrans: Settings → Payment → Notification URL.
import { adminClient, applyMidtransStatus, fetchMidtransStatus, SERVER_KEY } from '../_shared/midtrans.ts'

async function sha512(text: string) {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok')

  const body = await req.json().catch(() => null)
  if (!body?.order_id) return new Response('bad request', { status: 400 })

  // 1. Pastikan notifikasi benar dari Midtrans (tanda tangan SHA-512).
  const expected = await sha512(`${body.order_id}${body.status_code}${body.gross_amount}${SERVER_KEY}`)
  if (expected !== body.signature_key) return new Response('invalid signature', { status: 403 })

  // 2. Jangan percaya isi body begitu saja: ambil ulang status resmi dari Midtrans.
  const status = await fetchMidtransStatus(body.order_id)
  await applyMidtransStatus(adminClient(), status)

  return new Response('ok')
})
