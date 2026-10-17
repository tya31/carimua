import { Link } from 'react-router-dom'
import { formatPriceRange } from '../lib/format.js'

function MuaCard({ mua }) {
  return (
    <Link
      to={`/mua/${mua.slug}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-rose-100 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-rose-100">
        {mua.avatar_url ? (
          <img
            src={mua.avatar_url}
            alt={mua.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-bold text-rose-300">
            {mua.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-gray-900">{mua.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          📍 {mua.area ? `${mua.area}, ${mua.city}` : mua.city}
        </p>
        <p className="mt-2 text-sm font-semibold text-rose-600">
          {formatPriceRange(mua.min_price, mua.max_price)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mua.category_names.map((name) => (
            <span key={name} className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs text-rose-700">
              {name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export default MuaCard
