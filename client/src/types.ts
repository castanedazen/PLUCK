export type Listing = {
  id: string
  title: string
  fruit: string
  price: number
  unit: string
  image: string
  location: string
  distance: string
  inventory: number
  sellerId: string
  sellerName: string
  description: string
  pickupWindows: string[]
  isFavorite?: boolean
  status?: 'active' | 'archived'
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
  bio: string
  avatar: string
  heroFruit: string
}