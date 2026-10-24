// Logo teks: "cari" huruf tegak + "mua" miring bergaya serif.
function Logo({ className = '' }) {
  return (
    <span className={`font-display text-2xl leading-none tracking-tight ${className}`}>
      cari<span className="italic text-wine-400">mua</span>
      <span className="text-wine-400">✦</span>
    </span>
  )
}

export default Logo
