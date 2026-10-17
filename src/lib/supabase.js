import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Kalau .env belum diisi, website tetap jalan dalam "mode demo" memakai data dummy
// dari src/data/demoData.js. Login & dashboard baru aktif setelah Supabase dihubungkan.
export const isDemoMode = !url || !key

export const supabase = isDemoMode ? null : createClient(url, key)

// Nama bucket Supabase Storage untuk avatar & foto portofolio (dibuat di supabase/schema.sql).
export const PHOTO_BUCKET = 'portfolio'
