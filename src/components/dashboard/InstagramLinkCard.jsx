import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { cardClass, primaryButton, secondaryButton } from './ui.js'

// Kartu "link bio Instagram": link profil publik + QR code yang bisa diunduh.
function InstagramLinkCard({ slug }) {
  const link = `${window.location.origin}/mua/${slug}`
  const [qr, setQr] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(link, { width: 600, margin: 2, color: { dark: '#070304', light: '#fdf4f2' } })
      .then(setQr)
      .catch((err) => console.error(err))
  }, [link])

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className={`${cardClass} relative overflow-hidden`}>
      <div className="halftone absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-30" />
      <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-wine-300">link in bio</p>
          <h2 className="mt-1 font-display text-4xl text-blush-50">Link buat bio Instagram</h2>
          <p className="mt-2 text-sm text-blush-300">
            Tempel link ini di bio Instagram-mu (Edit profile → Links). Klien yang klik langsung masuk ke portofoliomu.
          </p>
          <p className="mt-4 break-all rounded-2xl bg-ink-800 px-4 py-3 font-mono text-sm text-blush-50">{link}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={copy} className={primaryButton}>
              {copied ? 'Tersalin ✓' : 'Salin link'}
            </button>
            {qr && (
              <a href={qr} download={`carimua-${slug}-qr.png`} className={secondaryButton + ' py-2.5'}>
                Unduh QR code
              </a>
            )}
          </div>
        </div>
        {qr && (
          <img
            src={qr}
            alt="QR code profil"
            className="mx-auto h-40 w-40 rounded-3xl border border-white/10 sm:h-44 sm:w-44"
          />
        )}
      </div>
    </section>
  )
}

export default InstagramLinkCard
