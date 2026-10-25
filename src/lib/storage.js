import { PHOTO_BUCKET, supabase } from './supabase.js'

const MB = 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE = 5 * MB
const MAX_VIDEO = 50 * MB // sama dengan batas bucket di 03_looks.sql

export const IMAGE_ACCEPT = IMAGE_TYPES.join(',')
export const MEDIA_ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(',')

export const mediaTypeOf = (file) => (VIDEO_TYPES.includes(file.type) ? 'video' : 'image')

export function validateImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return `${file.name}: format harus JPG, PNG, atau WEBP.`
  if (file.size > MAX_IMAGE) return `${file.name}: ukuran foto maksimal 5 MB.`
  return null
}

// Foto (JPG/PNG/WEBP ≤ 5 MB) atau video (MP4/WEBM/MOV ≤ 50 MB).
export function validateMedia(file) {
  if (VIDEO_TYPES.includes(file.type)) {
    return file.size > MAX_VIDEO ? `${file.name}: ukuran video maksimal 50 MB.` : null
  }
  if (!IMAGE_TYPES.includes(file.type)) return `${file.name}: format harus foto (JPG/PNG/WEBP) atau video (MP4/WEBM/MOV).`
  return validateImage(file)
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
