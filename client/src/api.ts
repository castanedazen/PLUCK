import type { Listing, Message, SellerProfile } from './types'

const API_BASE = '/api'

export async function getListings(): Promise<Listing[]> {
  const res = await fetch(`${API_BASE}/listings`)
  if (!res.ok) throw new Error('Failed to load listings')
  return res.json()
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

  if (!res.ok) throw new Error('Failed to create listing')
  return res.json()
}

export async function getMessages(): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/messages`)
  if (!res.ok) throw new Error('Failed to load messages')
  return res.json()
}

export async function getSeller(): Promise<SellerProfile> {
  const res = await fetch(`${API_BASE}/seller/me`)
  if (!res.ok) throw new Error('Failed to load seller')
  return res.json()
}