import type { Listing, Message, SellerProfile } from './types'

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
    // ignore parse failure
  }

  throw new Error(detail)
}

export async function getListings(): Promise<Listing[]> {
  const res = await fetch(`${API_BASE}/listings`)
  return parseResponse<Listing[]>(res, 'Failed to load listings')
}

export async function createListing(
  payload: Omit<Listing, 'id'>,
): Promise<Listing> {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse<Listing>(res, 'Failed to create listing')
}

export async function updateListing(
  id: string,
  payload: Omit<Listing, 'id'>,
): Promise<Listing> {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse<Listing>(res, 'Failed to update listing')
}

export async function getMessages(): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/messages`)
  return parseResponse<Message[]>(res, 'Failed to load messages')
}

export async function getSeller(): Promise<SellerProfile> {
  const res = await fetch(`${API_BASE}/seller/me`)
  return parseResponse<SellerProfile>(res, 'Failed to load seller')
}