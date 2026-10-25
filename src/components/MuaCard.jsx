import { Link } from 'react-router-dom'
import { formatPriceRange } from '../lib/format.js'
import Icon from './Icon.jsx'

function MuaCard({ mua }) {
  return (
    <Link
      to={`/mua/${mua.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-ink-800 transition duration-300 hover:-translate-y-1 hover:border-wine-400/60 hover:shadow-2xl hover:shadow-wine-700/30"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {mua.avatar_url ? (
          <img
            src={mua.avatar_url}
            alt={mua.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="halftone flex h-full items-center justify-center bg-wine-900 font-display text-7xl text-blush-100">
            {mua.name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

        <span className="glass absolute right-3 top-3 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] text-blush-50">
          <Icon name="pin" className="h-3 w-3" /> {mua.city}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h2 className="font-display text-3xl leading-tight text-blush-50">{mua.name}</h2>
          {mua.area && <p className="text-xs text-blush-300">{mua.area}</p>}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm font-semibold text-wine-300">{formatPriceRange(mua.min_price, mua.max_price)}</p>
        <div className="flex flex-wrap gap-1.5">
          {mua.category_names.map((name) => (
            <span key={name} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-blush-200">
              {name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export default MuaCard
