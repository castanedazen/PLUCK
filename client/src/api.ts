import type {
  Listing,
  Message,
  SellerProfile,
  Favorite,
  Conversation,
  PickupReservation,
  SocialPost,
  NotificationItem,
  SavedAlert,
  SellerFollow,
} from './types'

const API_BASE = '/api'

async function parseResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (res.ok) {
    return res.json()
  }

  let detail = fallbackMessage

  try {
    const body = await res.json()
    if (body?.error) detail = body.error
  } catch {
    // ignore
  }

  throw new Error(detail)
}

export async function getListings(): Promise<Listing[]> {
  const res = await fetch(`${API_BASE}/listings`)
  return parseResponse<Listing[]>(res, 'Failed to load listings')
}

export async function createListing(payload: Omit<Listing, 'id'>): Promise<Listing> {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<Listing>(res, 'Failed to create listing')
}

export async function updateListing(id: string, payload: Omit<Listing, 'id'>): Promise<Listing> {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (res.ok) return res.json()

  if (res.status === 404 || res.status === 502) {
    return createListing(payload)
  }

  return parseResponse<Listing>(res, 'Failed to update listing')
}

export async function deleteListing(id: string): Promise<{ ok: true }> {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'DELETE',
  })

  return parseResponse<{ ok: true }>(res, 'Failed to delete listing')
}

export async function getMessages(): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/messages`)
  return parseResponse<Message[]>(res, 'Failed to load messages')
}

export async function getMessagesByConversation(conversationId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/messages/${conversationId}`)
  return parseResponse<Message[]>(res, 'Failed to load thread messages')
}

export async function sendMessage(payload: {
  conversationId: string
  senderId: string
  senderName: string
  content: string
}): Promise<Message> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<Message>(res, 'Failed to send message')
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`)
  return parseResponse<Conversation[]>(res, 'Failed to load conversations')
}

export async function createOrGetConversation(payload: {
  listingId: string
  listingTitle: string
  sellerId: string
  sellerName: string
  buyerId: string
  buyerName: string
}): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<Conversation>(res, 'Failed to open conversation')
}

export async function getFavorites(): Promise<Favorite[]> {
  const res = await fetch(`${API_BASE}/favorites`)
  return parseResponse<Favorite[]>(res, 'Failed to load favorites')
}

export async function toggleFavorite(payload: {
  userId: string
  listingId: string
}): Promise<{ active: boolean }> {
  const res = await fetch(`${API_BASE}/favorites/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<{ active: boolean }>(res, 'Failed to update favorite')
}

export async function reservePickup(payload: {
  listingId: string
  buyerId: string
  buyerName: string
  sellerId: string
  pickupWindow: string
}): Promise<{ listing: Listing; reservation: PickupReservation }> {
  const res = await fetch(`${API_BASE}/pickups/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<{ listing: Listing; reservation: PickupReservation }>(
    res,
    'Failed to reserve pickup',
  )
}

export async function getSeller(): Promise<SellerProfile> {
  const res = await fetch(`${API_BASE}/seller/me`)
  return parseResponse<SellerProfile>(res, 'Failed to load seller')
}

export async function getSellers(): Promise<SellerProfile[]> {
  const res = await fetch(`${API_BASE}/sellers`)
  return parseResponse<SellerProfile[]>(res, 'Failed to load sellers')
}

export async function getSellerById(id: string): Promise<SellerProfile> {
  const res = await fetch(`${API_BASE}/sellers/${id}`)
  return parseResponse<SellerProfile>(res, 'Failed to load seller profile')
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  const res = await fetch(`${API_BASE}/social`)
  return parseResponse<SocialPost[]>(res, 'Failed to load social posts')
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/notifications`)
  return parseResponse<NotificationItem[]>(res, 'Failed to load notifications')
}

export async function getSavedAlerts(): Promise<SavedAlert[]> {
  const res = await fetch(`${API_BASE}/alerts`)
  return parseResponse<SavedAlert[]>(res, 'Failed to load alerts')
}

export async function createSavedAlert(payload: Omit<SavedAlert, 'id'>): Promise<SavedAlert> {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<SavedAlert>(res, 'Failed to create alert')
}

export async function toggleFollowSeller(payload: {
  userId: string
  sellerId: string
}): Promise<{ active: boolean; follows: SellerFollow[] }> {
  const res = await fetch(`${API_BASE}/follows/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<{ active: boolean; follows: SellerFollow[] }>(
    res,
    'Failed to update follow state',
  )
}

export async function getFollows(userId: string): Promise<SellerFollow[]> {
  const res = await fetch(`${API_BASE}/follows?userId=${encodeURIComponent(userId)}`)
  return parseResponse<SellerFollow[]>(res, 'Failed to load follows')
}
