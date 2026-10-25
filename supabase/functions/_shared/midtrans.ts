// Kode bersama untuk Edge Function pembayaran & webhook Midtrans.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

// Sandbox. Untuk uang sungguhan nanti ganti ke app.midtrans.com & api.midtrans.com.
export const SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions'
export const API_URL = 'https://api.sandbox.midtrans.com/v2'

export const SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
export const authHeader = () => 'Basic ' + btoa(`${SERVER_KEY}:`)

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// Klien Supabase dengan service role: melewati RLS (hanya dipakai di server).
export const adminClient = (): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

// Ambil status transaksi langsung dari Midtrans (sumber kebenaran).
export async function fetchMidtransStatus(orderId: string) {
  const res = await fetch(`${API_URL}/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: 'application/json', Authorization: authHeader() },
  })
  return await res.json()
}

// Status Midtrans → status kita.
function mapStatus(s: { transaction_status?: string; fraud_status?: string }) {
  switch (s.transaction_status) {
    case 'settlement':
      return 'paid'
    case 'capture':
      return s.fraud_status === 'accept' ? 'paid' : 'pending'
    case 'expire':
      return 'expired'
    case 'cancel':
    case 'deny':
    case 'failure':
      return 'failed'
    default:
      return 'pending'
  }
}

// Simpan status terbaru ke tabel payments; kalau lunas → booking jadi "confirmed".
export async function applyMidtransStatus(admin: SupabaseClient, status: Record<string, string>) {
  // 404 = klien belum memilih metode bayar di Snap → biarkan "pending".
  if (!status.order_id || status.status_code === '404') return null

  const { data: payment } = await admin.from('payments').select('*').eq('order_id', status.order_id).maybeSingle()
  if (!payment) return null

  // Jumlah harus sama persis dengan yang kita minta.
  if (Number(status.gross_amount) !== payment.amount) {
    console.error('gross_amount tidak cocok', status.order_id, status.gross_amount, payment.amount)
    return null
  }

  const next = mapStatus(status)
  // Jangan turunkan status yang sudah lunas.
  const finalStatus = payment.status === 'paid' ? 'paid' : next
  // Midtrans mengirim waktu WIB tanpa zona waktu ("2026-10-25 12:04:31") → tambahkan +07:00.
  const settledAt = status.settlement_time ? `${status.settlement_time.replace(' ', 'T')}+07:00` : null

  await admin
    .from('payments')
    .update({
      status: finalStatus,
      payment_type: status.payment_type ?? payment.payment_type,
      midtrans_status: status.transaction_status ?? payment.midtrans_status,
      paid_at: finalStatus === 'paid' ? (payment.paid_at ?? settledAt ?? new Date().toISOString()) : null,
      raw: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  if (finalStatus === 'paid') {
    await admin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', payment.booking_id)
      .eq('status', 'pending_payment')
    // Percobaan bayar lain untuk booking yang sama sudah tidak berlaku.
    await admin
      .from('payments')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('booking_id', payment.booking_id)
      .eq('status', 'pending')
  }
  return finalStatus
}
