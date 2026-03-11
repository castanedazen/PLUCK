import type { Listing, Message, SellerProfile } from './types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export async function getListings(): Promise<Listing[]> {
  const res = await fetch(API_BASE + '/api/listings')
  return res.json()
}

export async function getMessages(): Promise<Message[]> {
  const res = await fetch(API_BASE + '/api/messages')
  return res.json()
}

export async function getSeller(): Promise<SellerProfile> {
  const res = await fetch(API_BASE + '/api/seller/me')
  return res.json()
}
