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
}

export type Message = {
  id: string
  listingId: string
  sellerName: string
  preview: string
  updatedAt: string
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
