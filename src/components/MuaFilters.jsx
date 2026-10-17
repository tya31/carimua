// Pilihan rentang harga. Nilainya disimpan di URL sebagai minPrice & maxPrice.
const PRICE_RANGES = [
  { label: 'Di bawah Rp500rb', minPrice: '', maxPrice: '500000' },
  { label: 'Rp500rb – Rp1jt', minPrice: '500000', maxPrice: '1000000' },
  { label: 'Rp1jt – Rp3jt', minPrice: '1000000', maxPrice: '3000000' },
  { label: 'Di atas Rp3jt', minPrice: '3000000', maxPrice: '' },
]

const selectClass =
  'w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:outline-none'

// filters: objek nilai filter sekarang; onChange(patch) untuk mengubah sebagian filter.
function MuaFilters({ filters, onChange, locations, categories }) {
  const areas = locations.find((l) => l.city === filters.city)?.areas ?? []
  const priceIndex = PRICE_RANGES.findIndex(
    (r) => r.minPrice === filters.minPrice && r.maxPrice === filters.maxPrice,
  )
  const hasFilter = Object.values(filters).some(Boolean)

  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-rose-100 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-xs font-medium text-gray-500">
        Kota
        <select
          className={`${selectClass} mt-1`}
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

      <label className="text-xs font-medium text-gray-500">
        Area
        <select
          className={`${selectClass} mt-1 disabled:bg-gray-50 disabled:text-gray-400`}
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

      <label className="text-xs font-medium text-gray-500">
        Kategori
        <select
          className={`${selectClass} mt-1`}
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-gray-500">
        Budget
        <select
          className={`${selectClass} mt-1`}
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
          onClick={() =>
            onChange({ city: '', area: '', category: '', minPrice: '', maxPrice: '' })
          }
          className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset filter
        </button>
      </div>
    </div>
  )
}

export default MuaFilters
