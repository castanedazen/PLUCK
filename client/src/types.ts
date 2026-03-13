export type Listing = {
  id: string
  title: string
  fruit: string
  price: number
  unit: string
  image: string
  location: string
  city?: string
  state?: string
  zip?: string
  distance: string
  inventory: number
  sellerId: string
  sellerName: string
  description: string
  pickupWindows: string[]
  isFavorite?: boolean
  status?: 'active' | 'archived'
  tags?: string[]
  harvestLabel?: string
  freshnessLabel?: string
  availabilityLabel?: string
  harvestNote?: string
  sellerVerified?: boolean
  sellerRating?: number
  geo?: {
    lat: number
    lng: number
  } | null
  createdAt?: string
  updatedAt?: string
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
}

export type Conversation = {
  id: string
  listingId: string
  sellerId: string
  sellerName: string
  buyerId: string
  buyerName: string
  listingTitle: string
  lastMessage: string
  updatedAt: string
}

export type Favorite = {
  id: string
  userId: string
  listingId: string
}

export type PickupReservation = {
  id: string
  listingId: string
  buyerId: string
  buyerName: string
  sellerId: string
  pickupWindow: string
  createdAt: string
}

export type SellerProfile = {
  id: string
  name: string
  handle: string
  city: string
  state?: string
  zip?: string
  locationLabel?: string
  bio: string
  avatar: string
  heroFruit: string
  verified?: boolean
  rating?: number
  ratingCount?: number
  followers?: number
  responseScore?: string
  repeatBuyerScore?: string
  orchardName?: string
  specialties?: string[]
}

export type SocialPost = {
  id: string
  sellerId: string
  sellerName: string
  sellerHandle: string
  sellerAvatar: string
  sellerVerified?: boolean
  type: 'harvest' | 'orchard' | 'signal'
  title: string
  body: string
  fruit?: string
  location: string
  image?: string
  createdAt: string
}

export type NotificationItem = {
  id: string
  kind: 'nearby' | 'harvest' | 'follow' | 'system'
  title: string
  body: string
  createdAt: string
  read: boolean
}

export type AlertItem = {
  id: string
  userId: string
  fruit: string
  location: string
  radiusMiles: number
  sellerId?: string
  active: boolean
}

export type Follow = {
  id: string
  userId: string
  sellerId: string
}

export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'buyer' | 'grower'
  createdAt: string
}

export type BuyerProfile = {
  id: string
  name: string
  email?: string
  city: string
  state: string
  zip: string
  radiusMiles: number
  favoriteFruits: string[]
}