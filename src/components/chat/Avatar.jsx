// Foto profil bulat; kalau tidak ada foto, tampilkan huruf pertama nama.
function Avatar({ src, name, size = 'h-10 w-10' }) {
  return src ? (
    <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-full bg-wine-800 font-display text-lg text-blush-50`}>
      {(name ?? '?').charAt(0).toUpperCase()}
    </div>
  )
}

export default Avatar
