import type {
  AlertItem,
  AuthUser,
  BuyerProfile,
  Conversation,
  Favorite,
  Follow,
  Listing,
  Message,
  NotificationItem,
  PickupReservation,
  Review,
  SellerProfile,
  SocialPost,
} from './types'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\\/$/, '') + '/api'

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

export async function uploadListingImage(file: File): Promise<{
  ok: boolean
  fileName: string
  originalName: string
  mimeType: string
  size: number
  url: string
  absoluteUrl: string
}> {
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })

  return parseResponse(res, 'Failed to upload image')
}

export async function detectFruitFromImage(payload: {
  imageUrl?: string
  originalName?: string
  fileName?: string
}): Promise<{
  fruit: string
  confidence: number
  tags: string[]
  title: string
  source: string
}> {
  const res = await fetch(`${API_BASE}/detect-fruit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(res, 'Failed to detect fruit')
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

export async function completePickup(payload: {
  listingId: string
}): Promise<Listing> {
  const res = await fetch(`${API_BASE}/pickups/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<Listing>(res, 'Failed to complete pickup')
}

export async function getSeller(): Promise<SellerProfile> {
  const res = await fetch(`${API_BASE}/seller/me`)
  return parseResponse<SellerProfile>(res, 'Failed to load seller')
}

export async function getSellerById(id: string): Promise<SellerProfile> {
  const res = await fetch(`${API_BASE}/seller/${id}`)
  return parseResponse<SellerProfile>(res, 'Failed to load grower')
}

export async function getSellers(): Promise<SellerProfile[]> {
  const res = await fetch(`${API_BASE}/sellers`)
  return parseResponse<SellerProfile[]>(res, 'Failed to load growers')
}

export async function updateSellerProfile(
  payload: Partial<SellerProfile>,
): Promise<SellerProfile> {
  const res = await fetch(`${API_BASE}/seller/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<SellerProfile>(res, 'Failed to update seller profile')
}

export async function getBuyerProfile(): Promise<BuyerProfile> {
  const res = await fetch(`${API_BASE}/buyer/me`)
  return parseResponse<BuyerProfile>(res, 'Failed to load buyer profile')
}

export async function updateBuyerProfile(
  payload: Partial<BuyerProfile>,
): Promise<BuyerProfile> {
  const res = await fetch(`${API_BASE}/buyer/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<BuyerProfile>(res, 'Failed to update buyer profile')
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  const res = await fetch(`${API_BASE}/social`)
  return parseResponse<SocialPost[]>(res, 'Failed to load social feed')
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/notifications`)
  return parseResponse<NotificationItem[]>(res, 'Failed to load notifications')
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
  })
  return parseResponse<NotificationItem>(res, 'Failed to update notification')
}

export async function getAlerts(): Promise<AlertItem[]> {
  const res = await fetch(`${API_BASE}/alerts`)
  return parseResponse<AlertItem[]>(res, 'Failed to load alerts')
}

export async function createAlert(payload: Omit<AlertItem, 'id'>): Promise<AlertItem> {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse<AlertItem>(res, 'Failed to create alert')
}

export async function toggleAlert(id: string): Promise<AlertItem> {
  const res = await fetch(`${API_BASE}/alerts/${id}/toggle`, {
    method: 'POST',
  })
  return parseResponse<AlertItem>(res, 'Failed to update alert')
}

export async function getFollows(userId: string): Promise<Follow[]> {
  const res = await fetch(`${API_BASE}/follows?userId=${encodeURIComponent(userId)}`)
  return parseResponse<Follow[]>(res, 'Failed to load follows')
}

export async function toggleFollow(payload: {
  userId: string
  sellerId: string
}): Promise<{ active: boolean }> {
  const res = await fetch(`${API_BASE}/follows/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<{ active: boolean }>(res, 'Failed to update follow')
}

export async function getReviewsForListing(listingId: string): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/reviews/listing/${listingId}`)
  return parseResponse(res, 'Failed to load reviews')
}

export async function createReview(payload: {
  listingId: string
  sellerId: string
  buyerId: string
  buyerName: string
  rating: number
  comment: string
}): Promise<Review> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(res, 'Failed to create review')
}

export async function signup(payload: {
  name: string
  email: string
  role: 'buyer' | 'grower'
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<AuthUser>(res, 'Failed to create account')
}

export async function login(payload: {
  email: string
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<AuthUser>(res, 'Failed to log in')
}