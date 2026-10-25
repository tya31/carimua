import { useEffect, useState } from 'react'
import { unreadCount } from '../../lib/chat.js'
import { supabase } from '../../lib/supabase.js'

// Jumlah pesan belum dibaca untuk user yang login; diperbarui realtime.
export function useUnreadCount(userId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    let ignore = false
    const refresh = () =>
      unreadCount()
        .then((n) => !ignore && setCount(n))
        .catch(() => {})

    refresh()
    const channel = supabase
      .channel('chat-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refresh)
      .subscribe()
    window.addEventListener('chat:read', refresh)
    return () => {
      ignore = true
      supabase.removeChannel(channel)
      window.removeEventListener('chat:read', refresh)
    }
  }, [userId])

  return userId ? count : 0
}
