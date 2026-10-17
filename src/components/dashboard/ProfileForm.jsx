import { useState } from 'react'
import { slugify } from '../../lib/format.js'
import { deleteImageByUrl, uploadImage, validateImage } from '../../lib/storage.js'
import { supabase } from '../../lib/supabase.js'
import { cardClass, inputClass, labelClass, primaryButton } from './ui.js'

// profile: data profil sekarang (null kalau MUA baru). categoryIds: id kategori terpilih.
// onSaved(): dipanggil setelah berhasil simpan supaya Dashboard memuat ulang data.
function ProfileForm({ userId, profile, categories, categoryIds, onSaved }) {
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    slug: profile?.slug ?? '',
    city: profile?.city ?? '',
    area: profile?.area ?? '',
    whatsapp: profile?.whatsapp ?? '',
    bio: profile?.bio ?? '',
  })
  // Slug otomatis mengikuti nama, sampai user mengubah slug sendiri.
  const [slugEdited, setSlugEdited] = useState(Boolean(profile))
  const [selected, setSelected] = useState(categoryIds)
  const [avatarFile, setAvatarFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function toggleCategory(id) {
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (avatarFile) {
      const invalid = validateImage(avatarFile)
      if (invalid) return setMessage({ type: 'error', text: invalid })
    }

    setBusy(true)
    try {
      let avatar_url = profile?.avatar_url ?? null
      if (avatarFile) {
        avatar_url = await uploadImage(userId, avatarFile)
        // Hapus avatar lama supaya Storage tidak penuh file yatim.
        if (profile?.avatar_url) await deleteImageByUrl(profile.avatar_url).catch(() => {})
      }

      const { error } = await supabase.from('mua_profiles').upsert({
        id: userId,
        name: form.name.trim(),
        slug: form.slug,
        city: form.city.trim(),
        area: form.area.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        bio: form.bio.trim() || null,
        avatar_url,
      })
      if (error) {
        throw error.code === '23505'
          ? new Error('Slug sudah dipakai MUA lain. Coba slug lain.')
          : error
      }

      // Kategori: hapus semua lalu isi ulang sesuai pilihan.
      const { error: delError } = await supabase.from('mua_categories').delete().eq('mua_id', userId)
      if (delError) throw delError
      if (selected.length) {
        const { error: insError } = await supabase
          .from('mua_categories')
          .insert(selected.map((category_id) => ({ mua_id: userId, category_id })))
        if (insError) throw insError
      }

      setAvatarFile(null)
      setMessage({ type: 'info', text: 'Profil tersimpan ✓' })
      onSaved()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <h2 className="text-lg font-semibold text-gray-900">Profil</h2>
      {!profile && (
        <p className="mt-1 text-sm text-gray-500">
          Lengkapi profilmu dulu. Setelah disimpan, kamu bisa menambah paket dan foto portofolio.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Nama MUA / Studio *
          <input
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value
              setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }))
            }}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Slug (alamat profil) *
          <input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Huruf kecil, angka, dan tanda hubung. Contoh: rina-makeup"
            value={form.slug}
            onChange={(e) => {
              setSlugEdited(true)
              setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
            }}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-gray-400">/mua/{form.slug || '…'}</span>
        </label>
        <label className={labelClass}>
          Kota *
          <input required value={form.city} onChange={set('city')} placeholder="Bandung" className={inputClass} />
        </label>
        <label className={labelClass}>
          Area
          <input value={form.area} onChange={set('area')} placeholder="Dago" className={inputClass} />
        </label>
        <label className={labelClass}>
          Nomor WhatsApp
          <input
            type="tel"
            value={form.whatsapp}
            onChange={set('whatsapp')}
            placeholder="0812xxxxxxxx"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Foto profil
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setAvatarFile(e.target.files[0] ?? null)}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-rose-50 file:px-4 file:py-1.5 file:text-rose-700"
          />
        </label>
      </div>

      <label className={`${labelClass} mt-4`}>
        Bio
        <textarea rows={4} value={form.bio} onChange={set('bio')} className={inputClass} />
      </label>

      <fieldset className="mt-4">
        <legend className={labelClass}>Kategori</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => (
            <label
              key={c.id}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                selected.includes(c.id)
                  ? 'border-rose-500 bg-rose-500 text-white'
                  : 'border-rose-200 text-gray-600 hover:bg-rose-50'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selected.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex items-center gap-4">
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Menyimpan…' : 'Simpan profil'}
        </button>
        {message && (
          <span className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}

export default ProfileForm
