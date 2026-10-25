import { useState } from 'react'
import { deleteImageByUrl, MEDIA_ACCEPT, mediaTypeOf, uploadImage, validateMedia } from '../../lib/storage.js'
import { supabase } from '../../lib/supabase.js'
import MediaView from '../MediaView.jsx'
import { cardClass, dangerButton, inputClass, labelClass, MIN_LOOKS, primaryButton, secondaryButton } from './ui.js'

const fileInputClass =
  'mt-1.5 block w-full text-sm text-blush-200 file:mr-3 file:rounded-full file:border-0 file:bg-wine-800 file:px-4 file:py-2 file:text-blush-50'

// "produk A\nproduk B" → ['produk A', 'produk B']
const parseProducts = (text) =>
  text
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)

// Upload beberapa file lalu catat ke tabel portfolio_photos untuk look tertentu.
async function uploadMediaToLook(userId, lookId, files) {
  for (const file of files) {
    const url = await uploadImage(userId, file)
    const { error } = await supabase
      .from('portfolio_photos')
      .insert({ mua_id: userId, look_id: lookId, image_url: url, media_type: mediaTypeOf(file) })
    if (error) throw error
  }
}

// Form isi/ubah data look (judul, model, produk, deskripsi). files=true → sekalian pilih foto/video.
function LookForm({ initial, withFiles, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [files, setFiles] = useState([])
  const [inputKey, setInputKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const invalid = files.map(validateMedia).find(Boolean)
    if (invalid) return setError(invalid)

    setBusy(true)
    try {
      await onSubmit(
        {
          title: form.title.trim(),
          model_name: form.model_name.trim() || null,
          products: parseProducts(form.products),
          description: form.description.trim() || null,
        },
        files,
      )
      setForm(initial)
      setFiles([])
      setInputKey((k) => k + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>
        Nama look *
        <input required value={form.title} onChange={set('title')} placeholder="Akad adat Sunda" className={inputClass} />
      </label>
      <label className={labelClass}>
        Nama model (opsional)
        <input value={form.model_name} onChange={set('model_name')} placeholder="Kosongkan kalau tidak mau dicantumkan" className={inputClass} />
      </label>
      <label className={labelClass}>
        Produk yang dipakai (opsional, 1 per baris)
        <textarea
          rows={3}
          value={form.products}
          onChange={set('products')}
          placeholder={'Estée Lauder Double Wear\nCharlotte Tilbury Pillow Talk'}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Cerita singkat (opsional)
        <textarea rows={3} value={form.description} onChange={set('description')} className={inputClass} />
      </label>
      {withFiles && (
        <label className={`${labelClass} sm:col-span-2`}>
          Foto / video * (foto ≤ 5 MB, video ≤ 50 MB)
          <input
            key={inputKey}
            type="file"
            multiple
            required
            accept={MEDIA_ACCEPT}
            onChange={(e) => setFiles([...e.target.files])}
            className={fileInputClass}
          />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Menyimpan…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Batal
          </button>
        )}
        {error && <span className="text-sm text-wine-300">{error}</span>}
      </div>
    </form>
  )
}

function LookItem({ userId, look, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function saveDetails(values) {
    const { error: updateError } = await supabase.from('looks').update(values).eq('id', look.id)
    if (updateError) throw updateError
    setEditing(false)
    onChanged()
  }

  async function addMedia(e) {
    const files = [...e.target.files]
    e.target.value = ''
    const invalid = files.map(validateMedia).find(Boolean)
    if (invalid) return setError(invalid)
    setBusy(true)
    setError(null)
    try {
      await uploadMediaToLook(userId, look.id, files)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeMedia(media) {
    if (look.media.length === 1) return setError('Look minimal punya 1 foto/video. Hapus look-nya saja kalau mau.')
    if (!window.confirm('Hapus file ini?')) return
    const { error: delError } = await supabase.from('portfolio_photos').delete().eq('id', media.id)
    if (delError) return setError(delError.message)
    await deleteImageByUrl(media.url).catch((err) => console.error(err))
    onChanged()
  }

  async function removeLook() {
    if (!window.confirm(`Hapus look "${look.title}" beserta semua foto/videonya?`)) return
    const { error: delError } = await supabase.from('looks').delete().eq('id', look.id)
    if (delError) return setError(delError.message)
    await Promise.all(look.media.map((m) => deleteImageByUrl(m.url).catch((err) => console.error(err))))
    onChanged()
  }

  return (
    <li className="rounded-3xl border border-white/10 bg-ink-800/60 p-4 sm:p-5">
      {editing ? (
        <LookForm
          initial={{
            title: look.title,
            model_name: look.model_name ?? '',
            products: look.products.join('\n'),
            description: look.description ?? '',
          }}
          submitLabel="Simpan"
          onSubmit={saveDetails}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl text-blush-50">{look.title}</p>
            <p className="text-xs text-blush-300">
              {look.model_name ? `Model: ${look.model_name}` : 'Tanpa nama model'} · {look.media.length} file
            </p>
            {look.products.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {look.products.map((p) => (
                  <span key={p} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-blush-200">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className={secondaryButton}>
              Edit
            </button>
            <button type="button" onClick={removeLook} className={dangerButton}>
              Hapus
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {look.media.map((m) => (
          <div key={m.id} className="group relative h-28 w-20 overflow-hidden rounded-xl bg-ink-900">
            <MediaView media={m} preview className="h-full w-full" />
            {m.type === 'video' && <span className="absolute left-1 top-1 text-xs">🎬</span>}
            <button
              type="button"
              onClick={() => removeMedia(m)}
              className="absolute right-1 top-1 rounded-full bg-ink-950/80 px-1.5 text-xs text-blush-50 opacity-0 transition group-hover:opacity-100"
              aria-label="Hapus file"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="flex h-28 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 text-center text-[11px] text-blush-300 hover:border-wine-400">
          {busy ? '…' : '+ foto/video'}
          <input type="file" multiple accept={MEDIA_ACCEPT} onChange={addMedia} className="hidden" disabled={busy} />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-wine-300">{error}</p>}
    </li>
  )
}

function LooksManager({ userId, looks, onChanged }) {
  async function createLook(values, files) {
    if (files.length === 0) throw new Error('Pilih minimal 1 foto atau video.')
    const { data, error } = await supabase
      .from('looks')
      .insert({ ...values, mua_id: userId })
      .select('id')
      .single()
    if (error) throw error
    await uploadMediaToLook(userId, data.id, files)
    onChanged()
  }

  const remaining = Math.max(MIN_LOOKS - looks.length, 0)

  return (
    <section className={cardClass}>
      <h2 className="font-display text-4xl text-blush-50">Portofolio Looks</h2>
      <p className="mt-1 text-sm text-blush-300">
        Satu look = satu hasil makeup (boleh beberapa foto/video). Model & produk yang dipakai boleh dicantumkan, boleh tidak.
      </p>

      {remaining > 0 && (
        <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-900/20 p-3 text-sm text-amber-200">
          Tambah {remaining} look lagi supaya profilmu muncul di pencarian (minimal {MIN_LOOKS} look).
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {looks.map((look) => (
          <LookItem key={look.id} userId={userId} look={look} onChanged={onChanged} />
        ))}
      </ul>

      <div className="mt-5 rounded-3xl bg-white/5 p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold text-blush-100">Tambah look baru</h3>
        <LookForm
          initial={{ title: '', model_name: '', products: '', description: '' }}
          withFiles
          submitLabel="Tambah look"
          onSubmit={createLook}
        />
      </div>
    </section>
  )
}

export default LooksManager
