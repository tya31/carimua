import { useEffect, useState } from 'react'
import MediaView from './MediaView.jsx'

// Pop-up detail 1 look: semua foto/video + model + produk yang dipakai.
function LookModal({ look, onClose }) {
  const [index, setIndex] = useState(0)
  const media = look.media[index]

  // Tutup dengan tombol Esc, geser dengan panah kiri/kanan.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, look.media.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [look.media.length, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-950/90 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-ink-900 md:grid-cols-[1.2fr_1fr]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-ink-950">
          <MediaView media={media} alt={look.title} className="aspect-[3/4] w-full object-contain" />
          {look.media.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {look.media.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`File ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-wine-400' : 'w-2 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-4xl leading-tight text-blush-50">{look.title}</h3>
            <button type="button" onClick={onClose} className="text-xl text-blush-300 hover:text-white" aria-label="Tutup">
              ✕
            </button>
          </div>
          {look.model_name && (
            <p className="text-sm text-blush-300">
              Model: <span className="text-blush-50">{look.model_name}</span>
            </p>
          )}
          {look.description && <p className="text-sm leading-relaxed text-blush-200">{look.description}</p>}
          {look.products.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-wine-300">products used</p>
              <ul className="mt-3 space-y-2">
                {look.products.map((p) => (
                  <li key={p} className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-blush-100">
                    <span className="text-wine-400">✦</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {look.media.length > 1 && (
            <div className="mt-auto grid grid-cols-4 gap-2">
              {look.media.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`overflow-hidden rounded-xl border-2 ${i === index ? 'border-wine-400' : 'border-transparent'}`}
                >
                  <MediaView media={m} preview className="aspect-square w-full" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LookModal
