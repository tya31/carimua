import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatChatTime } from '../lib/chat.js'
import { supabase } from '../lib/supabase.js'
import Icon from './Icon.jsx'

const ICONS = {
  booking_new: 'calendar',
  booking_confirmed: 'check',
  booking_cancelled: 'x',
  booking_completed: 'sparkle',
  reminder_h2: 'clock',
}

// Lonceng notifikasi di navbar: daftar 15 terbaru, angka belum dibaca, update realtime.
function NotificationBell({ userId }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const boxRef = useRef(null)

  useEffect(() => {
    let ignore = false
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => !ignore && data && setItems(data))
    return () => {
      ignore = true
    }
  }, [userId, version])

  // Notifikasi baru → muat ulang daftar.
  useEffect(() => {
    const channel = supabase
      .channel('notif-bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => setVersion((v) => v + 1),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Klik di luar kotak → tutup.
  useEffect(() => {
    if (!open) return
    const close = (e) => !boxRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const unread = items.filter((n) => !n.read_at).length

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      await supabase.rpc('mark_notifications_read')
      // Tetap tampilkan titik "baru" selama kotak terbuka; angka di lonceng langsung hilang.
      setItems((prev) => prev.map((n) => ({ ...n, seen: !n.read_at, read_at: n.read_at ?? new Date().toISOString() })))
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative flex items-center rounded-full px-3 py-2 text-blush-200 transition hover:text-white"
        aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`}
      >
        <Icon name="bell" className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 top-0.5 rounded-full bg-wine-500 px-1.5 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl bg-ink-900/95 shadow-2xl">
          <p className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.25em] text-wine-300">notifikasi</p>
          {items.length === 0 ? (
            <p className="p-4 text-sm text-blush-300">Belum ada notifikasi.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      if (n.link) navigate(n.link)
                    }}
                    className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine-900/70 text-wine-300">
                      <Icon name={ICONS[n.type] ?? 'bell'} className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-blush-50">{n.title}</span>
                        {n.seen && <span className="h-2 w-2 shrink-0 rounded-full bg-wine-400" />}
                      </span>
                      {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-blush-300">{n.body}</span>}
                      <span className="mt-1 block text-[10px] text-blush-400">{formatChatTime(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
