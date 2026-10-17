import { PHOTO_BUCKET, supabase } from './supabase.js'

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB, sama dengan batas bucket di schema.sql
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return `${file.name}: format harus JPG, PNG, atau WEBP.`
  if (file.size > MAX_FILE_SIZE) return `${file.name}: ukuran maksimal 5 MB.`
  return null
}

// Upload ke "<userId>/<waktu>-<acak>.<ext>". Folder = id user, sesuai aturan
// storage policy di schema.sql. Mengembalikan URL publik file tersebut.
export async function uploadImage(userId, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
  })
  if (error) throw error

  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

// Hapus file dari Storage berdasarkan URL publiknya.
// URL dari luar Storage (mis. foto dummy) dilewati saja.
export async function deleteImageByUrl(url) {
  const marker = `/storage/v1/object/public/${PHOTO_BUCKET}/`
  const index = url?.indexOf(marker) ?? -1
  if (index === -1) return

  const path = decodeURIComponent(url.slice(index + marker.length))
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path])
  if (error) throw error
}
