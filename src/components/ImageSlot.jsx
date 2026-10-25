import { useState } from 'react'
import Icon from './Icon.jsx'

// Tempat foto yang KAMU isi sendiri. Taruh file di folder public/images/
// dengan nama persis seperti `name` (lihat daftar lengkap di public/images/README.md).
// Selama filenya belum ada, yang tampil kotak petunjuk berisi nama file & ukuran.
// compact: untuk slot kecil (misal avatar bulat) — cuma ikon, nama file muncul saat di-hover.
function ImageSlot({ name, size, alt = '', className = '', compact = false }) {
  const [missing, setMissing] = useState(false)

  if (missing && compact) {
    return (
      <div
        title={`public/images/${name} (${size})`}
        className={`flex items-center justify-center border border-dashed border-wine-400/50 bg-ink-800 text-blush-300 ${className}`}
      >
        <Icon name="camera" />
      </div>
    )
  }

  if (missing) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 border border-dashed border-wine-400/50 bg-ink-800/80 p-4 text-center halftone ${className}`}
      >
        <Icon name="camera" className="h-7 w-7 text-blush-300" strokeWidth={1.3} />
        <span className="rounded-full bg-ink-950/80 px-3 py-1 font-mono text-xs text-blush-100">
          public/images/{name}
        </span>
        {size && <span className="text-[11px] text-blush-300">{size}</span>}
      </div>
    )
  }

  return (
    <img
      src={`/images/${name}`}
      alt={alt}
      onError={() => setMissing(true)}
      className={`object-cover ${className}`}
    />
  )
}

export default ImageSlot
