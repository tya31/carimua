import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import Avatar from '../components/chat/Avatar.jsx'
import ChatThread from '../components/chat/ChatThread.jsx'
import { formatChatTime, getConversation, listConversations, otherParty } from '../lib/chat.js'
import { supabase } from '../lib/supabase.js'

// /chat           → daftar percakapan
// /chat/:id       → daftar + ruang obrolan (di HP: ruang obrolan saja)
function ChatPage() {
  const { id } = useParams()
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState(null)
  const [active, setActive] = useState(null)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  // Daftar percakapan; dimuat ulang setiap ada pesan baru/dibaca supaya urutan & preview ikut berubah.
  useEffect(() => {
    let ignore = false
    listConversations()
      .then((rows) => !ignore && setConversations(rows))
      .catch((err) => !ignore && setError(err.message))
    return () => {
      ignore = true
    }
  }, [version])

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    const channel = supabase
      .channel('chat-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, bump)
      .subscribe()
    window.addEventListener('chat:read', bump)
    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('chat:read', bump)
    }
  }, [])

  // Percakapan yang sedang dibuka (diambil terpisah supaya langsung tampil walau daftar belum termuat).
  useEffect(() => {
    if (!id) return
    let ignore = false
    getConversation(id)
      .then((conv) => !ignore && setActive(conv ?? false))
      .catch((err) => !ignore && setError(err.message))
    return () => {
      ignore = true
    }
  }, [id])

  const activeConv = id && active && active.id === id ? active : null

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.3em] text-wine-400">messages</p>
      <h1 className="mt-2 font-display text-5xl text-blush-50 sm:text-6xl">
        let&apos;s <span className="italic text-gradient">talk.</span>
      </h1>
      {error && <p className="mt-3 text-sm text-wine-300">{error}</p>}

      <div className="mt-8 grid h-[70vh] min-h-[480px] overflow-hidden rounded-[2rem] border border-white/10 bg-ink-900/80 md:grid-cols-[320px_1fr]">
        {/* Daftar percakapan */}
        <aside className={`min-h-0 overflow-y-auto border-white/10 md:border-r ${id ? 'hidden md:block' : ''}`}>
          {conversations === null ? (
            <p className="p-5 text-sm text-blush-300">Memuat…</p>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-sm text-blush-300">
              <p>Belum ada percakapan.</p>
              {role === 'client' ? (
                <p className="mt-2">
                  Buka profil MUA lalu klik <span className="text-blush-50">Chat MUA</span>.{' '}
                  <Link to="/mua" className="text-wine-300 hover:underline">
                    Cari MUA →
                  </Link>
                </p>
              ) : (
                <p className="mt-2">Klien akan muncul di sini saat mereka mengirim pesan.</p>
              )}
            </div>
          ) : (
            <ul>
              {conversations.map((c) => {
                const other = otherParty(c, user.id)
                const isActive = c.id === id
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/chat/${c.id}`)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                        isActive ? 'bg-wine-900/60' : 'hover:bg-white/5'
                      }`}
                    >
                      <Avatar src={other.avatar} name={other.name} size="h-11 w-11" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-semibold text-blush-50">{other.name}</p>
                          <span className="shrink-0 text-[11px] text-blush-400">{formatChatTime(c.last_message_at)}</span>
                        </div>
                        <p className="truncate text-xs text-blush-300">
                          {c.last_message
                            ? `${c.last_sender_id === user.id ? 'Kamu: ' : ''}${c.last_message}`
                            : 'Belum ada pesan'}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        {/* Ruang obrolan */}
        <div className={`min-h-0 ${id ? '' : 'hidden md:block'}`}>
          {activeConv ? (
            <ChatThread key={activeConv.id} conversation={activeConv} userId={user.id} onBack={() => navigate('/chat')} />
          ) : id && active === false ? (
            <p className="p-6 text-sm text-blush-300">Percakapan tidak ditemukan.</p>
          ) : id ? (
            <p className="p-6 text-sm text-blush-300">Memuat…</p>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <p className="font-display text-4xl italic text-blush-100">pilih obrolan ✦</p>
                <p className="mt-1 text-sm text-blush-400">Pesan baru muncul langsung tanpa perlu refresh.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ChatPage
