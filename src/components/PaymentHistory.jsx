import { formatRupiah } from '../lib/format.js'
import { formatPaymentType, PAYMENT_STATUS } from '../lib/payments.js'

// Tabel riwayat transaksi DP. bookings: daftar booking yang sudah memuat payments(*).
function PaymentHistory({ bookings }) {
  const rows = bookings
    .flatMap((b) => (b.payments ?? []).map((p) => ({ ...p, booking: b })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <section className="rounded-[2rem] border border-white/10 bg-ink-900/80 p-6 sm:p-8">
      <h2 className="font-display text-4xl text-blush-50">Riwayat transaksi</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-blush-300">Belum ada transaksi.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-blush-400">
              <tr>
                <th className="pb-3 pr-4 font-medium">Waktu</th>
                <th className="pb-3 pr-4 font-medium">Order ID</th>
                <th className="pb-3 pr-4 font-medium">Booking</th>
                <th className="pb-3 pr-4 font-medium">Metode</th>
                <th className="pb-3 pr-4 font-medium">Jumlah</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-4 text-blush-300">
                    {new Date(p.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-blush-200">{p.order_id}</td>
                  <td className="py-3 pr-4 text-blush-100">{p.booking.package_name}</td>
                  <td className="py-3 pr-4 text-blush-200">{formatPaymentType(p.payment_type)}</td>
                  <td className="py-3 pr-4 text-blush-50">{formatRupiah(p.amount)}</td>
                  <td className={`py-3 font-semibold ${PAYMENT_STATUS[p.status].className}`}>{PAYMENT_STATUS[p.status].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default PaymentHistory
