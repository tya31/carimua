// Edge Function "send-reminders" — dipanggil pg_cron setiap hari jam 08:00 WIB.
// Mencari booking TERKONFIRMASI yang acaranya 2 hari lagi (H-2), lalu untuk klien & MUA-nya:
//   1. membuat notifikasi di web (lonceng), sekali saja per booking,
//   2. mengirim email lewat Resend (kalau RESEND_API_KEY sudah diisi).
// Aman dipanggil berkali-kali: notifikasi & email yang sudah terkirim tidak diulang.
import { createClient } from 'npm:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
// Tanpa domain sendiri, Resend hanya mengizinkan pengirim onboarding@resend.dev
// dan hanya ke email pemilik akun Resend. Ganti EMAIL_FROM setelah punya domain terverifikasi.
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'CariMUA <onboarding@resend.dev>'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://carimua-nine.vercel.app'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

// Tanggal hari ini di WIB + n hari, format YYYY-MM-DD.
function jakartaDatePlus(days: number) {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000) // UTC → WIB
  now.setUTCDate(now.getUTCDate() + days)
  return now.toISOString().slice(0, 10)
}

const tanggalIndo = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  )

function emailHtml(title: string, lines: string[], link: string) {
  return `<!doctype html><html><body style="margin:0;background:#070304;font-family:Arial,sans-serif;color:#f7e5e0">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <p style="font-size:22px;margin:0 0 24px;color:#fdf4f2">cari<i style="color:#e2485a">mua</i>✦</p>
    <div style="background:linear-gradient(135deg,#5c0e18,#2a060b);border-radius:24px;padding:28px">
      <h1 style="font-size:22px;margin:0 0 16px;color:#fdf4f2">${title}</h1>
      ${lines.map((l) => `<p style="margin:0 0 8px;line-height:1.5;color:#ecc9c1">${l}</p>`).join('')}
      <a href="${link}" style="display:inline-block;margin-top:16px;background:#fdf4f2;color:#070304;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Lihat jadwal</a>
    </div>
    <p style="font-size:12px;color:#b98077;margin-top:24px">Email otomatis dari CariMUA (project portofolio).</p>
  </div></body></html>`
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

Deno.serve(async () => {
  const target = jakartaDatePlus(2)
  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, client_id, mua_id, package_name, event_date, event_time, address, mua_profiles(name), profiles(full_name)')
    .eq('status', 'confirmed')
    .eq('event_date', target)
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const summary = { target_date: target, bookings: bookings.length, notified: 0, emailed: 0, email_errors: 0 }

  for (const b of bookings) {
    const mua = (b.mua_profiles as { name: string } | null)?.name ?? 'MUA'
    const client = (b.profiles as { full_name: string | null } | null)?.full_name ?? 'Klien'
    const when = `${tanggalIndo(b.event_date)}, jam ${b.event_time.slice(0, 5).replace(':', '.')}`

    const recipients = [
      {
        user_id: b.client_id,
        title: `2 hari lagi kamu glow up bareng ${mua}`,
        body: `${b.package_name} · ${when}. Lokasi: ${b.address}`,
        link: '/akun',
      },
      {
        user_id: b.mua_id,
        title: `Pengingat: jadwal dengan ${client} 2 hari lagi`,
        body: `${b.package_name} · ${when}. Lokasi: ${b.address}`,
        link: '/dashboard',
      },
    ]

    for (const r of recipients) {
      await admin
        .from('notifications')
        .upsert(
          { user_id: r.user_id, booking_id: b.id, type: 'reminder_h2', title: r.title, body: r.body, link: r.link },
          { onConflict: 'user_id,type,booking_id', ignoreDuplicates: true },
        )
      const { data: notif } = await admin
        .from('notifications')
        .select('id, emailed_at')
        .eq('user_id', r.user_id)
        .eq('type', 'reminder_h2')
        .eq('booking_id', b.id)
        .single()
      summary.notified++

      if (!RESEND_API_KEY || !notif || notif.emailed_at) continue
      const { data: userData } = await admin.auth.admin.getUserById(r.user_id)
      const email = userData.user?.email
      if (!email) continue
      try {
        await sendEmail(email, r.title, emailHtml(r.title, [r.body], `${SITE_URL}${r.link}`))
        await admin.from('notifications').update({ emailed_at: new Date().toISOString(), email_error: null }).eq('id', notif.id)
        summary.emailed++
      } catch (err) {
        await admin.from('notifications').update({ email_error: String(err).slice(0, 500) }).eq('id', notif.id)
        summary.email_errors++
      }
    }
  }

  return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json' } })
})
