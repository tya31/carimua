import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { startConversation } from '../../lib/chat.js'

// Tombol "Chat" → buka/buat percakapan dengan otherId lalu pindah ke /chat/:id.
// Kalau belum login, diarahkan ke /login dulu.
function StartChatButton({ otherId, className, children = '💬 Chat' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleClick() {
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    setBusy(true)
    setError(null)
    try {
      const id = await startConversation(otherId)
      navigate(`/chat/${id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={busy} className={className}>
        {busy ? 'Membuka chat…' : children}
      </button>
      {error && <span className="text-xs text-wine-300">{error}</span>}
    </>
  )
}

export default StartChatButton
