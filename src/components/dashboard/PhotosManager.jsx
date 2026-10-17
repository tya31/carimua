import { useState } from 'react'
import { deleteImageByUrl, uploadImage, validateImage } from '../../lib/storage.js'
import { supabase } from '../../lib/supabase.js'
import { cardClass, dangerButton, inputClass, labelClass, primaryButton } from './ui.js'

function PhotosManager({ userId, photos, onChanged }) {
  const [files, setFiles] = useState([])
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [inputKey, setInputKey] = useState(0) // ganti key = kosongkan <input type="file">

  async function handleUpload(e) {
    e.preventDefault()
    setMessage(null)

    const invalid = files.map(validateImage).find(Boolean)
    if (invalid) return setMessage({ type: 'error', text: invalid })

    setBusy(true)
    try {
      // 1. Upload file ke Storage, 2. simpan URL-nya ke tabel portfolio_photos.
      for (const file of files) {
        const image_url = await uploadImage(userId, file)
        const { error } = await supabase
          .from('portfolio_photos')
          .insert({ mua_id: userId, image_url, caption: caption.trim() || null })
        if (error) throw error
      }
      setMessage({ type: 'info', text: `${files.length} foto berhasil di-upload ✓` })
      setFiles([])
      setCaption('')
      setInputKey((k) => k + 1)
      onChanged()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function deletePhoto(photo) {
    if (!window.confirm('Hapus foto ini?')) return
    const { error } = await supabase.from('portfolio_photos').delete().eq('id', photo.id)
    if (error) return window.alert(error.message)
    await deleteImageByUrl(photo.image_url).catch((err) => console.error(err))
    onChanged()
  }

  return (
    <section className={cardClass}>
      <h2 className="text-lg font-semibold text-gray-900">Foto Portofolio</h2>

      <form onSubmit={handleUpload} className="mt-4 grid gap-3 rounded-xl bg-rose-50/60 p-4 sm:grid-cols-2">
        <label className={labelClass}>
          Pilih foto (bisa lebih dari 1, maks 5 MB/foto)
          <input
            key={inputKey}
            type="file"
            multiple
            required
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFiles([...e.target.files])}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-1.5 file:text-rose-700"
          />
        </label>
        <label className={labelClass}>
          Caption (opsional)
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Contoh: Makeup akad adat Sunda"
            className={inputClass}
          />
        </label>
        <div className="flex items-center gap-4 sm:col-span-2">
          <button type="submit" disabled={busy || files.length === 0} className={primaryButton}>
            {busy ? 'Mengupload…' : 'Upload'}
          </button>
          {message && (
            <span className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
              {message.text}
            </span>
          )}
        </div>
      </form>

      {photos.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Belum ada foto.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-xl bg-rose-50 ring-1 ring-rose-100">
              <img src={photo.image_url} alt={photo.caption ?? ''} className="aspect-[3/4] w-full object-cover" />
              <figcaption className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-xs text-gray-600">{photo.caption ?? '—'}</span>
                <button type="button" onClick={() => deletePhoto(photo)} className={`${dangerButton} !px-2 !py-0.5 text-xs`}>
                  Hapus
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  )
}

export default PhotosManager
