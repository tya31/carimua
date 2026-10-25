// Pilihan rentang harga. Nilainya disimpan di URL sebagai minPrice & maxPrice.
const PRICE_RANGES = [
  { label: '< Rp500rb', minPrice: '', maxPrice: '500000' },
  { label: 'Rp500rb – 1jt', minPrice: '500000', maxPrice: '1000000' },
  { label: 'Rp1jt – 3jt', minPrice: '1000000', maxPrice: '3000000' },
  { label: '> Rp3jt', minPrice: '3000000', maxPrice: '' },
]

const selectClass =
  'mt-1.5 w-full appearance-none rounded-2xl border border-white/10 bg-ink-800 px-4 py-2.5 text-sm text-blush-50 focus:border-wine-400 focus:outline-none disabled:opacity-40'

const chipClass = (active) =>
  `rounded-full border px-4 py-1.5 text-sm transition ${
    active
      ? 'border-wine-400 bg-wine-gradient text-white shadow-lg shadow-wine-700/30'
      : 'border-white/10 text-blush-200 hover:border-wine-400/60 hover:text-white'
  }`

// filters: objek nilai filter sekarang; onChange(patch) untuk mengubah sebagian filter.
function MuaFilters({ filters, onChange, locations, categories }) {
  const areas = locations.find((l) => l.city === filters.city)?.areas ?? []
  const priceIndex = PRICE_RANGES.findIndex(
    (r) => r.minPrice === filters.minPrice && r.maxPrice === filters.maxPrice,
  )
  const hasFilter = Object.values(filters).some(Boolean)

  return (
    <div className="glass space-y-5 rounded-[2rem] p-5 sm:p-6">
      {/* Kategori sebagai chip */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange({ category: '' })} className={chipClass(!filters.category)}>
          Semua ✦
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange({ category: String(c.id) })}
            className={chipClass(filters.category === String(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium uppercase tracking-wider text-blush-300">
          Kota
          <select
            className={selectClass}
            value={filters.city}
            onChange={(e) => onChange({ city: e.target.value, area: '' })}
          >
            <option value="">Semua kota</option>
            {locations.map((l) => (
              <option key={l.city} value={l.city}>
                {l.city}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium uppercase tracking-wider text-blush-300">
          Area
          <select
            className={selectClass}
            value={filters.area}
            disabled={!filters.city}
            onChange={(e) => onChange({ area: e.target.value })}
          >
            <option value="">{filters.city ? 'Semua area' : 'Pilih kota dulu'}</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium uppercase tracking-wider text-blush-300">
          Budget
          <select
            className={selectClass}
            value={priceIndex}
            onChange={(e) => {
              const range = PRICE_RANGES[e.target.value] ?? { minPrice: '', maxPrice: '' }
              onChange({ minPrice: range.minPrice, maxPrice: range.maxPrice })
            }}
          >
            <option value={-1}>Semua harga</option>
            {PRICE_RANGES.map((r, i) => (
              <option key={r.label} value={i}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            disabled={!hasFilter}
            onClick={() => onChange({ city: '', area: '', category: '', minPrice: '', maxPrice: '' })}
            className="w-full rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-blush-200 transition hover:border-wine-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Reset filter
          </button>
        </div>
      </div>
    </div>
  )
}

export default MuaFilters
