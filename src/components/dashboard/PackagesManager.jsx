import { useState } from 'react'
import { formatRupiah } from '../../lib/format.js'
import { supabase } from '../../lib/supabase.js'
import {
  cardClass,
  dangerButton,
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from './ui.js'

const emptyPackage = { name: '', description: '', price: '' }

// Form tambah / edit 1 paket.
function PackageForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
      })
      setForm(initial)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_10rem]">
      <label className={labelClass}>
        Nama paket *
        <input required value={form.name} onChange={set('name')} placeholder="Wisuda" className={inputClass} />
      </label>
      <label className={labelClass}>
        Harga (Rp) *
        <input
          required
          type="number"
          min={0}
          step={1000}
          value={form.price}
          onChange={set('price')}
          placeholder="350000"
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Deskripsi
        <textarea rows={2} value={form.description} onChange={set('description')} className={inputClass} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Menyimpan…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Batal
          </button>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  )
}

function PackagesManager({ userId, packages, onChanged }) {
  const [editingId, setEditingId] = useState(null)

  async function addPackage(values) {
    const { error } = await supabase.from('packages').insert({ ...values, mua_id: userId })
    if (error) throw error
    onChanged()
  }

  async function updatePackage(id, values) {
    const { error } = await supabase.from('packages').update(values).eq('id', id)
    if (error) throw error
    setEditingId(null)
    onChanged()
  }

  async function deletePackage(pkg) {
    if (!window.confirm(`Hapus paket "${pkg.name}"?`)) return
    const { error } = await supabase.from('packages').delete().eq('id', pkg.id)
    if (error) return window.alert(error.message)
    onChanged()
  }

  return (
    <section className={cardClass}>
      <h2 className="text-lg font-semibold text-gray-900">Paket & Harga</h2>
      <p className="mt-1 text-sm text-gray-500">
        Kisaran harga di halaman daftar dihitung otomatis dari paket termurah dan termahal.
      </p>

      <ul className="mt-4 divide-y divide-rose-100">
        {packages.length === 0 && <li className="py-3 text-sm text-gray-500">Belum ada paket.</li>}
        {packages.map((pkg) => (
          <li key={pkg.id} className="py-4">
            {editingId === pkg.id ? (
              <PackageForm
                initial={{ name: pkg.name, description: pkg.description ?? '', price: String(pkg.price) }}
                submitLabel="Simpan"
                onSubmit={(values) => updatePackage(pkg.id, values)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {pkg.name} · <span className="text-rose-600">{formatRupiah(pkg.price)}</span>
                  </p>
                  {pkg.description && <p className="mt-1 text-sm text-gray-600">{pkg.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingId(pkg.id)} className={secondaryButton}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deletePackage(pkg)} className={dangerButton}>
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl bg-rose-50/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Tambah paket baru</h3>
        <PackageForm initial={emptyPackage} submitLabel="Tambah paket" onSubmit={addPackage} />
      </div>
    </section>
  )
}

export default PackagesManager
