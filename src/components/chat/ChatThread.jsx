import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatClock, loadMessages, markRead, otherParty, sendMessage } from '../../lib/chat.js'
import { supabase } from '../../lib/supabase.js'
import Avatar from './Avatar.jsx'

// Ruang obrolan 1 percakapan. Pesan baru masuk langsung lewat Supabase Realtime.
function ChatThread({ conversation, userId, onBack }) {
  const [messages, setMessages] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const other = otherParty(conversation, userId)

  // Muat riwayat + dengarkan pesan baru / status dibaca.
  useEffect(() => {
    let ignore = false
    loadMessages(conversation.id)
      .then((rows) => {
        if (ignore) return
        setMessages(rows)
        markRead(conversation.id).catch(() => {})
      })
      .catch((err) => !ignore && setError(err.message))

    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        ({ new: msg }) => {
          setMessages((prev) => (prev && !prev.some((m) => m.id === msg.id) ? [...prev, msg] : prev))
          if (msg.sender_id !== userId) markRead(conversation.id).catch(() => {})
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        ({ new: msg }) => setMessages((prev) => prev?.map((m) => (m.id === msg.id ? msg : m)) ?? prev),
      )
      .subscribe()

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [conversation.id, userId])

  // Selalu scroll ke pesan terbaru.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      const msg = await sendMessage(conversation.id, userId, text)
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/10 p-4">
        {onBack && (
          <button type="button" onClick={onBack} className="text-xl text-blush-200 md:hidden" aria-label="Kembali">
            ←
          </button>
        )}
        <Avatar src={other.avatar} name={other.name} />
        <div className="min-w-0">
          {other.link ? (
            <Link to={other.link} className="truncate font-semibold text-blush-50 hover:underline">
              {other.name}
            </Link>
          ) : (
            <p className="truncate font-semibold text-blush-50">{other.name}</p>
          )}
          <p className="text-xs text-blush-400">{conversation.client_id === userId ? 'Makeup artist' : 'Klien'}</p>
        </div>
      </header>

      {/* Pesan */}
      <div className="halftone-soft min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {messages === null ? (
          <p className="text-sm text-blush-300">Memuat…</p>
        ) : messages.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="font-display text-3xl italic text-blush-100">say hi.</p>
            <p className="mt-1 text-sm text-blush-400">Tanya jadwal, paket, atau minta referensi look.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm shadow-lg ${
                    mine ? 'rounded-br-md bg-wine-gradient text-white' : 'glass rounded-bl-md text-blush-50'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-right text-[10px] ${mine ? 'text-blush-200' : 'text-blush-400'}`}>
                    {formatClock(m.created_at)}
                    {mine && <span className="ml-1">{m.read_at ? '✓✓' : '✓'}</span>}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Kirim */}
      <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-white/10 p-3">
        <textarea
          rows={1}
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter = kirim, Shift+Enter = baris baru
            if (e.key === 'Enter' && !e.shiftKey) handleSend(e)
          }}
          placeholder="Tulis pesan…"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-white/10 bg-ink-800 px-4 py-2.5 text-sm text-blush-50 placeholder:text-blush-400 focus:border-wine-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="h-11 rounded-full bg-wine-gradient px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          Kirim
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-xs text-wine-300">{error}</p>}
    </div>
  )
}

export default ChatThread
