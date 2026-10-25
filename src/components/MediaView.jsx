// Menampilkan satu file portofolio: foto (<img>) atau video (<video>).
// preview=true → video tanpa kontrol, otomatis diputar tanpa suara (untuk kartu/thumbnail).
function MediaView({ media, alt = '', className = '', preview = false }) {
  if (media.type === 'video') {
    return preview ? (
      <video src={media.url} className={`object-cover ${className}`} muted loop playsInline autoPlay preload="metadata" />
    ) : (
      <video src={media.url} className={className} controls playsInline preload="metadata" />
    )
  }
  return <img src={media.url} alt={alt} loading="lazy" className={`object-cover ${className}`} />
}

export default MediaView
