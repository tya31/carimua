// Fungsi-fungsi chat (Supabase + Realtime).
import { supabase } from './supabase.js'

const throwIf = ({ data, error }) => {
  if (error) throw error
  return data
}

// Buka (atau buat) percakapan dengan lawan bicara. Mengembalikan id percakapan.
// Klien → otherId = id MUA. MUA → otherId = id klien (harus pernah booking).
export const startConversation = (otherId) =>
  supabase.rpc('start_conversation', { p_other: otherId }).then(throwIf)

export const listConversations = () =>
  supabase
    .from('conversations')
    .select('*, mua_profiles(name, slug, avatar_url), profiles(full_name, avatar_url)')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .then(throwIf)

export const getConversation = (id) =>
  supabase
    .from('conversations')
    .select('*, mua_profiles(name, slug, avatar_url), profiles(full_name, avatar_url)')
    .eq('id', id)
    .maybeSingle()
    .then(throwIf)

export const loadMessages = (conversationId) =>
  supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at').then(throwIf)

export const sendMessage = (conversationId, senderId, body) =>
  supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim() })
    .select()
    .single()
    .then(throwIf)

// Tandai pesan lawan bicara sudah dibaca, lalu kabari badge navbar.
export async function markRead(conversationId) {
  await supabase.rpc('mark_conversation_read', { p_conversation: conversationId }).then(throwIf)
  window.dispatchEvent(new Event('chat:read'))
}

export const unreadCount = () => supabase.rpc('unread_message_count').then(throwIf)

// Nama & foto lawan bicara dari sudut pandang user yang login.
export function otherParty(conversation, myId) {
  if (conversation.client_id === myId) {
    return {
      id: conversation.mua_id,
      name: conversation.mua_profiles?.name ?? 'MUA',
      avatar: conversation.mua_profiles?.avatar_url,
      link: conversation.mua_profiles ? `/mua/${conversation.mua_profiles.slug}` : null,
    }
  }
  return {
    id: conversation.client_id,
    name: conversation.profiles?.full_name ?? 'Klien',
    avatar: conversation.profiles?.avatar_url,
    link: null,
  }
}

const timeFmt = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

// "14.05" untuk hari ini, "12 Okt" untuk hari lain.
export function formatChatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString() ? timeFmt.format(d) : dayFmt.format(d)
}

export const formatClock = (iso) => timeFmt.format(new Date(iso))
