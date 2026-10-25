// Edge Function "payments" — dipanggil dari browser oleh klien yang login.
//   { action: 'create', booking_id } → buat transaksi Snap Midtrans untuk DP 5%, balikin token.
//   { action: 'sync',   booking_id } → cek ulang status transaksi ke Midtrans (cadangan kalau webhook telat).
import { adminClient, applyMidtransStatus, authHeader, corsHeaders, fetchMidtransStatus, json, SERVER_KEY, SNAP_URL } from '../_shared/midtrans.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!SERVER_KEY) return json({ error: 'MIDTRANS_SERVER_KEY belum diisi di Supabase secrets.' }, 500)

  const admin = adminClient()

  // Siapa yang memanggil? (token login Supabase dari header Authorization)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) return json({ error: 'Harus login.' }, 401)
  const user = userData.user

  const { action, booking_id } = await req.json().catch(() => ({}))
  const { data: booking } = await admin.from('bookings').select('*').eq('id', booking_id).maybeSingle()
  if (!booking || booking.client_id !== user.id) return json({ error: 'Booking tidak ditemukan.' }, 404)

  if (action === 'sync') {
    const { data: pending } = await admin
      .from('payments')
      .select('order_id')
      .eq('booking_id', booking.id)
      .eq('status', 'pending')
    for (const p of pending ?? []) {
      await applyMidtransStatus(admin, await fetchMidtransStatus(p.order_id))
    }
    const { data: fresh } = await admin.from('bookings').select('status').eq('id', booking.id).single()
    return json({ booking_status: fresh?.status })
  }

  if (action !== 'create') return json({ error: 'Aksi tidak dikenal.' }, 400)
  if (booking.status !== 'pending_payment') return json({ error: 'Booking ini tidak sedang menunggu DP.' }, 400)

  // Pakai ulang transaksi yang masih berlaku (token Snap berlaku 24 jam), supaya
  // membuka-tutup pop-up bayar tidak membuat banyak transaksi baru.
  const reuseAfter = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await admin
    .from('payments')
    .select('order_id, snap_token')
    .eq('booking_id', booking.id)
    .eq('status', 'pending')
    .gte('created_at', reuseAfter)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing?.snap_token) return json({ token: existing.snap_token, order_id: existing.order_id, reused: true })

  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  const orderId = `DP-${booking.id.slice(0, 8)}-${Date.now()}`

  const snapRes = await fetch(SNAP_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: booking.dp_amount },
      item_details: [
        {
          id: booking.id.slice(0, 8),
          price: booking.dp_amount,
          quantity: 1,
          name: `DP 5% ${booking.package_name}`.slice(0, 50),
        },
      ],
      customer_details: { first_name: profile?.full_name ?? 'Klien', email: user.email },
      expiry: { unit: 'hours', duration: 24 },
    }),
  })
  const snap = await snapRes.json()
  if (!snapRes.ok || !snap.token) {
    console.error('Snap error', snap)
    return json({ error: snap.error_messages?.join(', ') ?? 'Gagal membuat transaksi Midtrans.' }, 502)
  }

  const { error: insertError } = await admin.from('payments').insert({
    booking_id: booking.id,
    order_id: orderId,
    amount: booking.dp_amount,
    snap_token: snap.token,
  })
  if (insertError) return json({ error: insertError.message }, 500)

  return json({ token: snap.token, redirect_url: snap.redirect_url, order_id: orderId })
})
