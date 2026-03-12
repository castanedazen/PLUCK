import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  createListing,
  createOrGetConversation,
  createSavedAlert,
  deleteListing,
  getConversations,
  getFavorites,
  getFollows,
  getListings,
  getMessagesByConversation,
  getNotifications,
  getSavedAlerts,
  getSeller,
  getSellerById,
  getSellers,
  getSocialPosts,
  reservePickup,
  sendMessage,
  toggleFavorite,
  toggleFollowSeller,
  updateListing,
} from './api'
import type {
  Conversation,
  Favorite,
  Listing,
  Message,
  NotificationItem,
  SavedAlert,
  SellerFollow,
  SellerProfile,
  SocialPost,
} from './types'

type QuickFilter = 'all' | 'just-added' | 'under-5' | 'citrus' | 'high-stock' | 'near-me'
type RadiusFilter = 3 | 5 | 10 | 25

type ListingFormState = {
  title: string
  fruit: string
  price: string
  unit: string
  imagePreview: string
  location: string
  inventory: string
  description: string
  pickup1: string
  pickup2: string
  harvestNote: string
  tags: string
}

type DetectionPreview = {
  produce: string
  title: string
  tags: string[]
  freshnessNote: string
}

const fallbackListings: Listing[] = [
  {
    id: '1',
    title: 'Sun-warm Valencia Oranges',
    fruit: 'Oranges',
    price: 6,
    unit: 'bag',
    image:
      'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=1200&q=80',
    location: 'Mission Hills',
    distance: '0.8 mi',
    inventory: 7,
    sellerId: 's1',
    sellerName: 'Elena',
    description: 'Picked this morning. Sweet, juicy, and ideal for snacking or fresh juice.',
    pickupWindows: ['Today 5–7 PM', 'Tomorrow 9–11 AM'],
    isFavorite: true,
    status: 'active',
    tags: ['sweet', 'citrus', 'juice'],
    harvestLabel: 'Just dropped',
    freshnessLabel: 'Fresh harvest',
    availabilityLabel: 'Available now',
    harvestNote: 'Pulled from the tree at 7 AM.',
    sellerVerified: true,
    sellerRating: 4.8,
    geo: { lat: 34.2766, lng: -118.4671 },
  },
  {
    id: '2',
    title: 'Backyard Meyer Lemons',
    fruit: 'Lemons',
    price: 4,
    unit: 'bundle',
    image:
      'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=1200&q=80',
    location: 'Granada Hills',
    distance: '1.7 mi',
    inventory: 11,
    sellerId: 's2',
    sellerName: 'Marco',
    description: 'Bright, floral lemons with strong color and a clean finish for cooking or cocktails.',
    pickupWindows: ['Today 6–8 PM', 'Saturday 10 AM–1 PM'],
    status: 'active',
    tags: ['citrus', 'kitchen'],
    harvestLabel: 'New nearby',
    freshnessLabel: 'Fresh harvest',
    availabilityLabel: 'Available now',
    harvestNote: 'Weekend cut with extra fragrant skins.',
    sellerVerified: false,
    sellerRating: 4.6,
    geo: { lat: 34.2726, lng: -118.5025 },
  },
]

const fallbackSeller: SellerProfile = {
  id: 'me',
  name: 'Christian',
  handle: '@pluckgrower',
  city: 'Mission Hills, CA',
  bio: 'Neighborhood grower sharing backyard harvests with nearby buyers.',
  avatar:
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
  heroFruit:
    'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1400&q=80',
  verified: true,
  rating: 4.9,
  ratingCount: 31,
  followers: 126,
  responseScore: '98% reply rate',
  repeatBuyerScore: '41% repeat buyers',
  orchardName: 'Mission Hills Backyard Grove',
  specialties: ['Citrus', 'Seasonal bundles', 'Same-day pickup'],
}

const emptyForm: ListingFormState = {
  title: '',
  fruit: '',
  price: '',
  unit: 'basket',
  imagePreview: '',
  location: 'Mission Hills',
  inventory: '',
  description: '',
  pickup1: '',
  pickup2: '',
  harvestNote: '',
  tags: '',
}

const quickFilters: { key: QuickFilter; label: string }[] = [
  { key: 'all', label: 'All harvests' },
  { key: 'just-added', label: 'Just added' },
  { key: 'under-5', label: 'Under $5' },
  { key: 'citrus', label: 'Citrus' },
  { key: 'high-stock', label: 'High stock' },
  { key: 'near-me', label: 'Near me' },
]

const radiusOptions: RadiusFilter[] = [3, 5, 10, 25]

function inferDetection(fileName: string, currentFruit: string): DetectionPreview {
  const name = `${fileName} ${currentFruit}`.toLowerCase()

  if (name.includes('peach')) {
    return {
      produce: 'Peaches',
      title: 'Soft-ripe neighborhood peaches',
      tags: ['stone fruit', 'sweet', 'same-day'],
      freshnessNote: 'Looks like a ripe peach batch ready for a short pickup window.',
    }
  }

  if (name.includes('lemon')) {
    return {
      produce: 'Lemons',
      title: 'Backyard Meyer lemons',
      tags: ['citrus', 'bright', 'kitchen'],
      freshnessNote: 'Likely citrus. Good candidate for a just-harvested listing.',
    }
  }

  if (name.includes('orange') || name.includes('citrus')) {
    return {
      produce: 'Oranges',
      title: 'Sun-warm local oranges',
      tags: ['citrus', 'sweet', 'juice'],
      freshnessNote: 'Detected a citrus-style produce photo. Sweetness note and harvest timing would help conversion.',
    }
  }

  return {
    produce: currentFruit || 'Produce detected',
    title: currentFruit ? `${currentFruit} harvest listing` : 'Fresh local produce listing',
    tags: ['local', 'fresh harvest', 'nearby'],
    freshnessNote: 'AI shell ready. Next layer will run real produce detection from photos.',
  }
}

function formatRelativeTime(value: string) {
  const now = new Date().getTime()
  const then = new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round((now - then) / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function ListingSignalRow({ listing }: { listing: Listing }) {
  const labels = [listing.harvestLabel, listing.freshnessLabel, listing.availabilityLabel].filter(Boolean)

  return (
    <div className="signal-row">
      {labels.map((label) => (
        <span key={`${listing.id}-${label}`} className="signal-pill">
          {label}
        </span>
      ))}
    </div>
  )
}

type ListingFormProps = {
  seller: SellerProfile
  initialValues?: Listing
  submitLabel: string
  onSubmitListing: (payload: Omit<Listing, 'id'>, existingId?: string) => Promise<void>
  existingId?: string
}

function ListingForm({
  seller,
  initialValues,
  submitLabel,
  onSubmitListing,
  existingId,
}: ListingFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState<ListingFormState>(() => {
    if (!initialValues) return emptyForm
    return {
      title: initialValues.title,
      fruit: initialValues.fruit,
      price: String(initialValues.price),
      unit: initialValues.unit,
      imagePreview: initialValues.image,
      location: initialValues.location,
      inventory: String(initialValues.inventory),
      description: initialValues.description,
      pickup1: initialValues.pickupWindows?.[0] || '',
      pickup2: initialValues.pickupWindows?.[1] || '',
      harvestNote: initialValues.harvestNote || '',
      tags: (initialValues.tags || []).join(', '),
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [detection, setDetection] = useState<DetectionPreview | null>(null)

  function updateForm<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function applyDetection(suggestion: DetectionPreview) {
    setForm((current) => ({
      ...current,
      fruit: current.fruit || suggestion.produce,
      title: current.title || suggestion.title,
      tags: current.tags || suggestion.tags.join(', '),
      harvestNote: current.harvestNote || suggestion.freshnessNote,
    }))
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const suggestion = inferDetection(file.name, form.fruit)
    setDetection(suggestion)

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      updateForm('imagePreview', result)
      applyDetection(suggestion)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const pickupWindows = [form.pickup1, form.pickup2].map((x) => x.trim()).filter(Boolean)
      const tagList = form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      const payload: Omit<Listing, 'id'> = {
        title: form.title.trim() || `${form.fruit.trim()} Listing`,
        fruit: form.fruit.trim() || 'Fruit',
        price: Number(form.price) || 0,
        unit: form.unit.trim() || 'basket',
        image:
          form.imagePreview ||
          'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
        location: form.location.trim() || 'Mission Hills',
        distance: initialValues?.distance || 'Just added',
        inventory: Number(form.inventory) || 1,
        sellerId: seller.id,
        sellerName: seller.name,
        description: form.description.trim() || 'Fresh local fruit available for pickup.',
        pickupWindows: pickupWindows.length ? pickupWindows : ['Pickup by message'],
        isFavorite: initialValues?.isFavorite || false,
        status: initialValues?.status || 'active',
        tags: tagList,
        harvestLabel: initialValues?.harvestLabel || 'Just dropped',
        freshnessLabel: initialValues?.freshnessLabel || 'Fresh harvest',
        availabilityLabel: initialValues?.availabilityLabel || 'Available now',
        harvestNote: form.harvestNote.trim() || detection?.freshnessNote || 'Local harvest ready for pickup.',
        sellerVerified: seller.verified,
        sellerRating: seller.rating,
        geo: initialValues?.geo || { lat: 34.2706, lng: -118.4728 },
      }

      await onSubmitListing(payload, existingId)
      setSaveSuccess(existingId ? 'Listing updated successfully.' : 'Listing created successfully.')

      setTimeout(() => {
        navigate('/store/listings')
      }, 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save listing right now.'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="stack form-stack premium-form-shell">
      <div className="form-header">
        <div>
          <p className="eyebrow">{existingId ? 'Edit listing' : 'Photo-first listing builder'}</p>
          <h2>{existingId ? 'Update listing details' : 'Create a trusted neighborhood listing'}</h2>
          <p>Use one strong produce photo, clear harvest language, and a tight pickup window to convert faster.</p>
        </div>
      </div>

      <form className="listing-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="full upload-zone upload-zone-large">
            Upload fruit photo
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <span className="upload-hint">PLUCK will turn this into an AI-ready produce detection flow later.</span>
          </label>

          {form.imagePreview && (
            <div className="image-preview-wrap full detection-layout">
              <img className="image-preview" src={form.imagePreview} alt="Preview" />
              <div className="detection-card">
                <p className="eyebrow">AI produce shell</p>
                <h3>Detect produce from image</h3>
                <p className="detection-note">This is the V6A product shell. Real classifier logic lands in V6B.</p>
                {detection ? (
                  <>
                    <strong>{detection.produce}</strong>
                    <p>{detection.freshnessNote}</p>
                    <div className="signal-row compact-signal-row">
                      {detection.tags.map((tag) => (
                        <span className="signal-pill" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button type="button" className="ghost" onClick={() => applyDetection(detection)}>
                      Use suggestions
                    </button>
                  </>
                ) : (
                  <p>Upload a produce photo to generate suggested fruit type, tags, and a freshness note.</p>
                )}
              </div>
            </div>
          )}

          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              placeholder="Golden backyard avocados"
            />
          </label>

          <label>
            Fruit
            <input
              value={form.fruit}
              onChange={(e) => updateForm('fruit', e.target.value)}
              placeholder="Avocados"
            />
          </label>

          <label>
            Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateForm('price', e.target.value)}
              placeholder="8"
            />
          </label>

          <label>
            Unit
            <input value={form.unit} onChange={(e) => updateForm('unit', e.target.value)} placeholder="bag" />
          </label>

          <label>
            Neighborhood
            <input
              value={form.location}
              onChange={(e) => updateForm('location', e.target.value)}
              placeholder="Mission Hills"
            />
          </label>

          <label>
            Inventory
            <input
              type="number"
              min="1"
              step="1"
              value={form.inventory}
              onChange={(e) => updateForm('inventory', e.target.value)}
              placeholder="6"
            />
          </label>

          <label className="full">
            Listing tags
            <input
              value={form.tags}
              onChange={(e) => updateForm('tags', e.target.value)}
              placeholder="sweet, citrus, same-day"
            />
          </label>

          <label className="full">
            Description
            <textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="Tell buyers what makes this fruit special."
              rows={4}
            />
          </label>

          <label className="full">
            Harvest note
            <textarea
              value={form.harvestNote}
              onChange={(e) => updateForm('harvestNote', e.target.value)}
              placeholder="Picked this morning. Best for same-day pickup."
              rows={3}
            />
          </label>

          <label>
            Pickup window 1
            <input
              value={form.pickup1}
              onChange={(e) => updateForm('pickup1', e.target.value)}
              placeholder="Today 5–7 PM"
            />
          </label>

          <label>
            Pickup window 2
            <input
              value={form.pickup2}
              onChange={(e) => updateForm('pickup2', e.target.value)}
              placeholder="Tomorrow 10 AM–12 PM"
            />
          </label>
        </div>

        {(saveError || saveSuccess) && (
          <div className={saveError ? 'status-banner error' : 'status-banner success'}>{saveError || saveSuccess}</div>
        )}

        <div className="action-row">
          <button type="submit" className="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : submitLabel}
          </button>
          <button type="button" className="ghost" disabled={isSaving} onClick={() => navigate('/store/listings')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

function ListingDetailRoute({
  listings,
  favorites,
  sellers,
  follows,
  onEdit,
  onToggleFavorite,
  onReserve,
  onStartConversation,
  onFollow,
}: {
  listings: Listing[]
  favorites: Favorite[]
  sellers: SellerProfile[]
  follows: SellerFollow[]
  onEdit: (id: string) => void
  onToggleFavorite: (listingId: string) => Promise<void>
  onReserve: (listing: Listing) => Promise<void>
  onStartConversation: (listing: Listing) => Promise<void>
  onFollow: (sellerId: string) => Promise<void>
}) {
  const navigate = useNavigate()
  const { id } = useParams()
  const listing = listings.find((item) => item.id === id)

  if (!listing) {
    return (
      <section className="stack">
        <h2>Listing not found</h2>
      </section>
    )
  }

  const isFavorite = favorites.some((fav) => fav.listingId === listing.id)
  const seller = sellers.find((item) => item.id === listing.sellerId)
  const isFollowing = follows.some((follow) => follow.sellerId === listing.sellerId)

  return (
    <section className="stack">
      <div className="listing-detail-hero">
        <img className="listing-detail-image" src={listing.image} alt={listing.title} />
        <div className="listing-detail-copy">
          <p className="eyebrow">{listing.fruit}</p>
          <h2>{listing.title}</h2>
          <p className="listing-detail-price">
            ${listing.price}/{listing.unit}
          </p>
          <ListingSignalRow listing={listing} />
          <p className="desc">{listing.description}</p>
          <p className="meta">
            {listing.location} · {listing.inventory} left · {listing.sellerName}
          </p>
          {listing.harvestNote && <p className="desc">{listing.harvestNote}</p>}

          <div className="trust-row">
            <span className="trust-pill">{listing.sellerVerified ? 'Verified farmer' : 'Verification pending'}</span>
            <span className="trust-pill">{listing.sellerRating?.toFixed(1) || '4.7'} ★ seller rating</span>
            <span className="trust-pill">Local pickup</span>
          </div>

          <div className="pill-row">
            {(listing.tags || []).map((tag) => (
              <span className="pill" key={`${listing.id}-${tag}`}>
                {tag}
              </span>
            ))}
          </div>

          <div className="pill-row">
            {listing.pickupWindows.map((slot, index) => (
              <span className="pill" key={`${listing.id}-${slot}-${index}`}>
                {slot}
              </span>
            ))}
          </div>

          {seller && (
            <div className="seller-inline-card">
              <img src={seller.avatar} alt={seller.name} />
              <div>
                <strong>{seller.name}</strong>
                <p>
                  {seller.handle} · {seller.city}
                </p>
              </div>
              <button className="ghost" onClick={() => navigate(`/seller/${seller.id}`)}>
                Seller page
              </button>
            </div>
          )}

          <div className="action-row">
            <button className="primary" onClick={() => onReserve(listing)} disabled={listing.inventory <= 0}>
              {listing.inventory <= 0 ? 'Sold out' : 'Reserve pickup'}
            </button>
            <button className="ghost" onClick={() => onStartConversation(listing)}>
              Message seller
            </button>
            <button className="ghost" onClick={() => onToggleFavorite(listing.id)}>
              {isFavorite ? 'Saved' : 'Save'}
            </button>
            <button className="ghost" onClick={() => onFollow(listing.sellerId)}>
              {isFollowing ? 'Following' : 'Follow seller'}
            </button>
            <button className="ghost" onClick={() => onEdit(listing.id)}>
              Edit listing
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function MessagesPage({
  conversations,
  threadMessages,
  seller,
  onSelectConversation,
  onSendMessage,
}: {
  conversations: Conversation[]
  threadMessages: Message[]
  seller: SellerProfile
  onSelectConversation: (id: string) => Promise<void>
  onSendMessage: (conversationId: string, content: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const activeConversation = conversations[0]

  return (
    <section className="messages-layout">
      <div className="stack">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Conversations</p>
            <h2>Inbox</h2>
          </div>
          <span className="section-meta">{conversations.length} threads</span>
        </div>

        {conversations.length ? (
          conversations.map((conversation) => (
            <button key={conversation.id} className="thread thread-button" onClick={() => onSelectConversation(conversation.id)}>
              <div>
                <strong>{conversation.sellerName}</strong>
                <p>{conversation.lastMessage}</p>
              </div>
              <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
            </button>
          ))
        ) : (
          <p>No conversations yet.</p>
        )}
      </div>

      <div className="stack">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Thread</p>
            <h2>{activeConversation ? activeConversation.listingTitle : 'Select a conversation'}</h2>
          </div>
        </div>

        <div className="message-thread">
          {threadMessages.length ? (
            threadMessages.map((msg) => (
              <div key={msg.id} className={msg.senderId === seller.id ? 'message-bubble mine' : 'message-bubble'}>
                <strong>{msg.senderName}</strong>
                <p>{msg.content}</p>
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
        </div>

        {activeConversation && (
          <div className="message-compose">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message..." rows={3} />
            <button
              className="primary"
              onClick={async () => {
                if (!draft.trim()) return
                await onSendMessage(activeConversation.id, draft)
                setDraft('')
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function SellerRoute({
  listings,
  sellers,
  follows,
  onToggleFavorite,
  favorites,
  onFollow,
}: {
  listings: Listing[]
  sellers: SellerProfile[]
  follows: SellerFollow[]
  onToggleFavorite: (listingId: string) => Promise<void>
  favorites: Favorite[]
  onFollow: (sellerId: string) => Promise<void>
}) {
  const navigate = useNavigate()
  const { sellerId } = useParams()
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)

  useEffect(() => {
    if (!sellerId) return
    getSellerById(sellerId).then(setSellerProfile).catch(() => {
      const match = sellers.find((item) => item.id === sellerId) || null
      setSellerProfile(match)
    })
  }, [sellerId, sellers])

  if (!sellerId) return <Navigate to="/" replace />

  const seller = sellerProfile || sellers.find((item) => item.id === sellerId)

  if (!seller) {
    return (
      <section className="stack">
        <h2>Seller not found</h2>
      </section>
    )
  }

  const sellerListings = listings.filter((listing) => listing.sellerId === seller.id)
  const isFollowing = follows.some((follow) => follow.sellerId === seller.id)

  return (
    <section className="stack">
      <section className="seller-hero-card">
        <img className="seller-hero-image" src={seller.heroFruit} alt={seller.name} />
        <div className="seller-hero-content">
          <div className="seller-hero-row">
            <img className="avatar" src={seller.avatar} alt={seller.name} />
            <div>
              <h2>{seller.name}</h2>
              <p>
                {seller.handle} · {seller.city}
              </p>
            </div>
            <button className="primary" onClick={() => onFollow(seller.id)}>
              {isFollowing ? 'Following' : 'Follow seller'}
            </button>
          </div>

          <div className="signal-row">
            <span className="signal-pill">{seller.verified ? 'Verified farmer' : 'Verification pending'}</span>
            <span className="signal-pill">{seller.rating?.toFixed(1) || '4.7'} ★</span>
            <span className="signal-pill">{seller.responseScore || 'Reply score pending'}</span>
            <span className="signal-pill">{seller.repeatBuyerScore || 'Repeat buyers pending'}</span>
          </div>

          <p>{seller.bio}</p>

          <div className="dashboard-stats profile-stats">
            <div className="dashboard-card">
              <span>Listings</span>
              <strong>{seller.listingCount ?? sellerListings.length}</strong>
            </div>
            <div className="dashboard-card">
              <span>Followers</span>
              <strong>{seller.followers || 0}</strong>
            </div>
            <div className="dashboard-card">
              <span>Rating</span>
              <strong>{seller.rating?.toFixed(1) || '4.7'}</strong>
            </div>
          </div>

          <div className="pill-row">
            {(seller.specialties || []).map((specialty) => (
              <span className="pill" key={specialty}>
                {specialty}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Live listings</p>
          <h2>{seller.name}'s harvest board</h2>
        </div>
        <span className="section-meta">{sellerListings.length} live</span>
      </section>

      <section className="grid">
        {sellerListings.map((item) => {
          const isFavorite = favorites.some((fav) => fav.listingId === item.id)
          return (
            <article className="card premium-card" key={item.id}>
              <div className="card-image-wrap">
                <img src={item.image} alt={item.title} />
                <span className="card-badge">{item.distance}</span>
              </div>
              <div className="card-body">
                <div className="price-row">
                  <div>
                    <h3>{item.title}</h3>
                    <span>
                      ${item.price}/{item.unit}
                    </span>
                  </div>
                </div>
                <ListingSignalRow listing={item} />
                <p className="meta">{item.location}</p>
                <p className="desc">{item.description}</p>
                <div className="action-row">
                  <button className="primary" onClick={() => navigate(`/listing/${item.id}`)}>
                    View
                  </button>
                  <button className="ghost" onClick={() => onToggleFavorite(item.id)}>
                    {isFavorite ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </section>
  )
}

function NotificationsRoute({
  notifications,
  alerts,
  seller,
  sellers,
  follows,
  onCreateAlert,
}: {
  notifications: NotificationItem[]
  alerts: SavedAlert[]
  seller: SellerProfile
  sellers: SellerProfile[]
  follows: SellerFollow[]
  onCreateAlert: (payload: Omit<SavedAlert, 'id'>) => Promise<void>
}) {
  const [fruit, setFruit] = useState('Peaches')
  const [location, setLocation] = useState(seller.city.replace(', CA', ''))
  const [radius, setRadius] = useState('5')
  const [sellerId, setSellerId] = useState('')

  return (
    <section className="stack">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Alerts + notifications</p>
          <h2>Notification center</h2>
        </div>
        <span className="section-meta">{notifications.filter((item) => !item.read).length} unread</span>
      </div>

      <div className="alerts-grid">
        <section className="alert-builder-card">
          <p className="eyebrow">Saved alert match</p>
          <h3>Create nearby fruit alerts</h3>
          <div className="form-grid compact-form-grid">
            <label>
              Fruit
              <input value={fruit} onChange={(e) => setFruit(e.target.value)} placeholder="Peaches" />
            </label>
            <label>
              Neighborhood
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mission Hills" />
            </label>
            <label>
              Radius miles
              <input value={radius} onChange={(e) => setRadius(e.target.value)} type="number" min="1" />
            </label>
            <label>
              Seller focus
              <select value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
                <option value="">Any seller</option>
                {sellers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="primary"
            onClick={() =>
              onCreateAlert({
                userId: seller.id,
                fruit,
                location,
                radiusMiles: Number(radius) || 5,
                sellerId,
                active: true,
              })
            }
          >
            Save alert
          </button>
        </section>

        <section className="stack card-like">
          <p className="eyebrow">Live alerts</p>
          <h3>Saved alert list</h3>
          {(alerts || []).map((alert) => (
            <div className="mini-card premium-mini-card" key={alert.id}>
              <div className="mini-card-copy">
                <strong>{alert.fruit}</strong>
                <p>
                  {alert.location} · {alert.radiusMiles} mi radius
                </p>
                <span>{alert.sellerId ? `Seller-specific alert` : 'Any local seller'}</span>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="stack card-like">
        <p className="eyebrow">In-app push scaffold</p>
        <h3>Notification feed</h3>
        {notifications.map((item) => (
          <div className="notification-row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
            <span>{formatRelativeTime(item.createdAt)}</span>
          </div>
        ))}
      </section>

      <section className="stack card-like">
        <p className="eyebrow">Followed sellers</p>
        <h3>Signal foundation</h3>
        {follows.length ? (
          follows.map((follow) => {
            const sellerMatch = sellers.find((item) => item.id === follow.sellerId)
            return (
              <div className="notification-row" key={follow.id}>
                <div>
                  <strong>{sellerMatch?.name || 'Seller'}</strong>
                  <p>{sellerMatch?.city || 'Local seller'} · alert-ready for future push and email notifications.</p>
                </div>
              </div>
            )
          })
        ) : (
          <p>No followed sellers yet.</p>
        )}
      </section>
    </section>
  )
}

function SocialRoute({ posts }: { posts: SocialPost[] }) {
  return (
    <section className="stack">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Community layer</p>
          <h2>Social feed</h2>
        </div>
        <span className="section-meta">Seller posts · harvest updates · neighborhood signals</span>
      </div>

      <div className="social-feed-list">
        {posts.map((post) => (
          <article className="social-card" key={post.id}>
            <div className="social-card-header">
              <div className="social-author">
                <img src={post.sellerAvatar} alt={post.sellerName} />
                <div>
                  <strong>{post.sellerName}</strong>
                  <p>
                    {post.sellerHandle} · {post.location} · {formatRelativeTime(post.createdAt)}
                  </p>
                </div>
              </div>
              <span className="signal-pill">{post.type}</span>
            </div>
            <div className="social-card-body">
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              {post.image && <img className="social-card-image" src={post.image} alt={post.title} />}
              <div className="social-card-actions">
                <button className="ghost" type="button">
                  Reactions soon
                </button>
                <button className="ghost" type="button">
                  Comments soon
                </button>
                <button className="ghost" type="button">
                  Spotlight soon
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

type AppLayoutProps = {
  listings: Listing[]
  setListings: React.Dispatch<React.SetStateAction<Listing[]>>
  seller: SellerProfile
  favorites: Favorite[]
  setFavorites: React.Dispatch<React.SetStateAction<Favorite[]>>
  conversations: Conversation[]
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  threadMessages: Message[]
  setThreadMessages: React.Dispatch<React.SetStateAction<Message[]>>
  sellers: SellerProfile[]
  setSellers: React.Dispatch<React.SetStateAction<SellerProfile[]>>
  posts: SocialPost[]
  notifications: NotificationItem[]
  alerts: SavedAlert[]
  setAlerts: React.Dispatch<React.SetStateAction<SavedAlert[]>>
  follows: SellerFollow[]
  setFollows: React.Dispatch<React.SetStateAction<SellerFollow[]>>
}

function AppLayout({
  listings,
  setListings,
  seller,
  favorites,
  setFavorites,
  conversations,
  setConversations,
  threadMessages,
  setThreadMessages,
  sellers,
  setSellers,
  posts,
  notifications,
  alerts,
  setAlerts,
  follows,
  setFollows,
}: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all')
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>(5)
  const [selectedMapListingId, setSelectedMapListingId] = useState<string | null>(null)

  const favoriteListingIds = new Set(favorites.map((fav) => fav.listingId))
  const favoriteListings = listings.filter((item) => favoriteListingIds.has(item.id))
  const myListings = listings.filter((item) => item.sellerId === seller.id)
  const justAdded = listings.filter((item) => item.distance === 'Just added' || item.harvestLabel === 'Just dropped')
  const totalInventory = myListings.reduce((sum, item) => sum + item.inventory, 0)
  const averagePrice =
    myListings.length > 0
      ? (myListings.reduce((sum, item) => sum + item.price, 0) / myListings.length).toFixed(2)
      : '0.00'
  const unreadCount = notifications.filter((item) => !item.read).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    let result = listings.filter((item) =>
      [item.title, item.fruit, item.location, item.sellerName, item.description, ...(item.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )

    if (activeFilter === 'just-added') {
      result = result.filter((item) => item.distance === 'Just added' || item.harvestLabel === 'Just dropped')
    }

    if (activeFilter === 'under-5') {
      result = result.filter((item) => item.price <= 5)
    }

    if (activeFilter === 'citrus') {
      result = result.filter((item) =>
        ['orange', 'oranges', 'lemon', 'lemons', 'lime', 'limes', 'grapefruit', 'citrus'].includes(item.fruit.toLowerCase()),
      )
    }

    if (activeFilter === 'high-stock') {
      result = result.filter((item) => item.inventory >= 6)
    }

    if (activeFilter === 'near-me') {
      result = result.filter((item) => {
        const value = Number.parseFloat(item.distance)
        return Number.isFinite(value) ? value <= radiusFilter : true
      })
    }

    return result.sort((a, b) => {
      const aValue = Number.parseFloat(a.distance)
      const bValue = Number.parseFloat(b.distance)
      if (Number.isFinite(aValue) && Number.isFinite(bValue)) return aValue - bValue
      return 0
    })
  }, [listings, query, activeFilter, radiusFilter])

  const selectedMapListing = filtered.find((item) => item.id === selectedMapListingId) || filtered[0] || null

  async function handleCreate(payload: Omit<Listing, 'id'>) {
    const saved = await createListing(payload)
    setListings((current) => [saved, ...current])
  }

  async function handleUpdate(payload: Omit<Listing, 'id'>, listingId?: string) {
    if (!listingId) {
      const saved = await createListing(payload)
      setListings((current) => [saved, ...current])
      return
    }

    const updated = await updateListing(listingId, payload)

    setListings((current) => {
      const exists = current.some((item) => item.id === listingId)
      if (exists) {
        return current.map((item) => (item.id === listingId ? updated : item))
      }
      return [updated, ...current]
    })
  }

  async function handleArchive(listingId: string) {
    const confirmed = window.confirm('Archive this listing?')
    if (!confirmed) return

    await deleteListing(listingId)
    setListings((current) => current.filter((item) => item.id !== listingId))
  }

  async function handleToggleFavorite(listingId: string) {
    const result = await toggleFavorite({ userId: seller.id, listingId })

    if (result.active) {
      setFavorites((current) => [{ id: crypto.randomUUID(), userId: seller.id, listingId }, ...current])
    } else {
      setFavorites((current) => current.filter((fav) => fav.listingId !== listingId))
    }
  }

  async function handleReserve(listing: Listing) {
    const pickupWindow = listing.pickupWindows?.[0] || 'Pickup by message'
    const result = await reservePickup({
      listingId: listing.id,
      buyerId: seller.id,
      buyerName: seller.name,
      sellerId: listing.sellerId,
      pickupWindow,
    })

    setListings((current) => current.map((item) => (item.id === listing.id ? result.listing : item)))
    window.alert(`Pickup reserved for ${pickupWindow}`)
  }

  async function handleStartConversation(listing: Listing) {
    const conversation = await createOrGetConversation({
      listingId: listing.id,
      listingTitle: listing.title,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      buyerId: seller.id,
      buyerName: seller.name,
    })

    const refreshed = await getConversations()
    setConversations(refreshed)

    const thread = await getMessagesByConversation(conversation.id)
    setThreadMessages(thread)

    navigate('/messages')
  }

  async function handleSelectConversation(conversationId: string) {
    const thread = await getMessagesByConversation(conversationId)
    setThreadMessages(thread)

    const selected = conversations.find((item) => item.id === conversationId)
    if (selected) {
      const ordered = [selected, ...conversations.filter((item) => item.id !== conversationId)]
      setConversations(ordered)
    }
  }

  async function handleSendMessage(conversationId: string, content: string) {
    await sendMessage({
      conversationId,
      senderId: seller.id,
      senderName: seller.name,
      content,
    })

    const refreshedConversations = await getConversations()
    const thread = await getMessagesByConversation(conversationId)

    setConversations(refreshedConversations)
    setThreadMessages(thread)
  }

  async function handleFollow(sellerId: string) {
    const result = await toggleFollowSeller({ userId: seller.id, sellerId })
    setFollows(result.follows)
    const refreshedSellers = await getSellers().catch(() => sellers)
    setSellers(refreshedSellers)
  }

  async function handleCreateAlert(payload: Omit<SavedAlert, 'id'>) {
    const saved = await createSavedAlert(payload)
    setAlerts((current) => [saved, ...current])
  }

  function isActivePath(path: string) {
    return location.pathname === path
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Pluck</p>
          <h1>Fresh fruit from neighbors</h1>
          <p className="subtle-copy">
            A trusted local marketplace for backyard harvests, same-day pickup, grower discovery, and social neighborhood signals.
          </p>
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={() => navigate('/notifications')}>
            Alerts {unreadCount ? `(${unreadCount})` : ''}
          </button>
          <button className="primary" onClick={() => navigate('/store/new')}>
            + New listing
          </button>
        </div>
      </header>

      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">V6A productization layer</p>
          <h2>Trust, alerts, geo discovery, social proof, and AI-ready listing creation.</h2>
          <p>
            PLUCK now feels like a real startup product: stronger seller identity, harvest urgency, saved alerts, seller pages, and a scalable photo-first create flow.
          </p>
          <div className="hero-cta-row">
            <button className="primary" onClick={() => navigate('/store/new')}>
              Create premium listing
            </button>
            <button className="ghost" onClick={() => navigate('/social')}>
              Open social feed
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <button className="stat-card stat-link" onClick={() => navigate('/')}>
            <span>Nearby listings</span>
            <strong>{listings.length}</strong>
          </button>
          <button className="stat-card stat-link" onClick={() => navigate('/favorites')}>
            <span>Saved items</span>
            <strong>{favoriteListings.length}</strong>
          </button>
          <button className="stat-card stat-link" onClick={() => navigate('/notifications')}>
            <span>Saved alerts</span>
            <strong>{alerts.length}</strong>
          </button>
          <button className="stat-card stat-link" onClick={() => navigate('/social')}>
            <span>Social posts</span>
            <strong>{posts.length}</strong>
          </button>
        </div>
      </section>

      <div className="search-wrap">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search oranges, peaches, growers, neighborhoods..." />

        <div className="search-bottom-row">
          <div className="toggle-row">
            <button className={isActivePath('/') ? 'toggle active' : 'toggle'} onClick={() => navigate('/')}>
              List
            </button>
            <button className={isActivePath('/map') ? 'toggle active' : 'toggle'} onClick={() => navigate('/map')}>
              Map
            </button>
            <button className={isActivePath('/social') ? 'toggle active' : 'toggle'} onClick={() => navigate('/social')}>
              Feed
            </button>
          </div>

          <div className="filter-chip-row">
            {quickFilters.map((filter) => (
              <button key={filter.key} className={activeFilter === filter.key ? 'filter-chip active' : 'filter-chip'} onClick={() => setActiveFilter(filter.key)}>
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="radius-chip-row">
          <span className="radius-label">Radius</span>
          {radiusOptions.map((radius) => (
            <button key={radius} className={radiusFilter === radius ? 'filter-chip active' : 'filter-chip'} onClick={() => setRadiusFilter(radius)}>
              {radius} mi
            </button>
          ))}
        </div>
      </div>

      <main className="content">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <section className="hero-card">
                  <div>
                    <p className="eyebrow">Today nearby</p>
                    <h2>Backyard harvests, same-day pickup, trusted growers</h2>
                    <p>Browse live listings, save alerts, follow growers, and move from discovery to pickup in a few taps.</p>
                  </div>
                  <button className="primary" onClick={() => navigate('/notifications')}>
                    Set nearby alert
                  </button>
                </section>

                <section className="section-heading">
                  <div>
                    <p className="eyebrow">Featured near you</p>
                    <h2>Beautiful local harvests</h2>
                  </div>
                  <span className="section-meta">{filtered.length} listings</span>
                </section>

                <section className="grid">
                  {filtered.map((item) => {
                    const isFavorite = favoriteListingIds.has(item.id)
                    const sellerMatch = sellers.find((sellerItem) => sellerItem.id === item.sellerId)

                    return (
                      <article className="card premium-card" key={item.id}>
                        <div className="card-image-wrap">
                          <img src={item.image} alt={item.title} />
                          <span className="card-badge">{item.distance}</span>
                        </div>
                        <div className="card-body">
                          <div className="price-row">
                            <div>
                              <h3>{item.title}</h3>
                              <span>
                                ${item.price}/{item.unit}
                              </span>
                            </div>
                            <button className={isFavorite ? 'icon-favorite active' : 'icon-favorite'} onClick={() => handleToggleFavorite(item.id)}>
                              ♥
                            </button>
                          </div>
                          <ListingSignalRow listing={item} />
                          <p className="meta">
                            {item.location} · {item.inventory} left · {item.sellerRating?.toFixed(1) || '4.7'} ★
                          </p>
                          <p className="desc">{item.description}</p>
                          <button className="seller-link-inline" onClick={() => navigate(`/seller/${item.sellerId}`)}>
                            {item.sellerVerified ? 'Verified' : 'Local'} seller: {item.sellerName}
                            {sellerMatch?.orchardName ? ` · ${sellerMatch.orchardName}` : ''}
                          </button>
                          <div className="pill-row">
                            {(item.tags || []).map((tag) => (
                              <span className="pill" key={`${item.id}-${tag}`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="action-row">
                            <button className="primary" onClick={() => handleStartConversation(item)}>
                              Message
                            </button>
                            <button className="ghost" onClick={() => navigate(`/listing/${item.id}`)}>
                              View
                            </button>
                            <button className="ghost" onClick={() => handleFollow(item.sellerId)}>
                              {follows.some((follow) => follow.sellerId === item.sellerId) ? 'Following' : 'Follow'}
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </section>

                <section className="section-heading section-gap-top">
                  <div>
                    <p className="eyebrow">Fresh activity</p>
                    <h2>Just added + harvest urgency</h2>
                  </div>
                </section>

                <section className="mini-grid">
                  {(justAdded.length ? justAdded : listings.slice(0, 3)).map((item) => (
                    <div className="activity-card harvest-activity-card" key={item.id}>
                      <img src={item.image} alt={item.title} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>
                          {item.location} · ${item.price}/{item.unit}
                        </p>
                        <span>{item.harvestLabel || 'Just dropped'}</span>
                      </div>
                    </div>
                  ))}
                </section>
              </>
            }
          />

          <Route
            path="/map"
            element={
              <section className="map-panel">
                <div className="map-fallback premium-map enhanced-map-panel">
                  <div className="map-header-row">
                    <div>
                      <p className="eyebrow">Discovery map</p>
                      <h3>Location-first neighborhood browsing</h3>
                    </div>
                    <button className="ghost" onClick={() => navigate('/store/new')}>
                      Add your harvest
                    </button>
                  </div>
                  <p>Geo discovery now supports near-me sorting, radius filtering, selected marker focus, and seller-aware map browsing.</p>
                  <div className="map-two-col">
                    <div className="pin-list">
                      {filtered.map((item) => (
                        <button
                          className={selectedMapListing?.id === item.id ? 'pin-row premium-pin-row active' : 'pin-row premium-pin-row'}
                          key={item.id}
                          onClick={() => setSelectedMapListingId(item.id)}
                        >
                          <div>
                            <strong>{item.fruit}</strong>
                            <p>
                              {item.title} · {item.location}
                            </p>
                          </div>
                          <span>
                            ${item.price}/{item.unit}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="map-focus-card">
                      {selectedMapListing ? (
                        <>
                          <img src={selectedMapListing.image} alt={selectedMapListing.title} />
                          <h3>{selectedMapListing.title}</h3>
                          <p>{selectedMapListing.description}</p>
                          <ListingSignalRow listing={selectedMapListing} />
                          <div className="action-row">
                            <button className="primary" onClick={() => navigate(`/listing/${selectedMapListing.id}`)}>
                              Open listing
                            </button>
                            <button className="ghost" onClick={() => navigate(`/seller/${selectedMapListing.sellerId}`)}>
                              Seller page
                            </button>
                          </div>
                        </>
                      ) : (
                        <p>No listings in this radius yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            }
          />

          <Route
            path="/listing/:id"
            element={<ListingDetailRoute listings={listings} favorites={favorites} sellers={sellers} follows={follows} onEdit={(id) => navigate(`/store/edit/${id}`)} onToggleFavorite={handleToggleFavorite} onReserve={handleReserve} onStartConversation={handleStartConversation} onFollow={handleFollow} />}
          />

          <Route
            path="/favorites"
            element={
              <section className="stack">
                <div className="section-heading compact-heading">
                  <div>
                    <p className="eyebrow">Saved for later</p>
                    <h2>Favorites</h2>
                  </div>
                  <span className="section-meta">{favoriteListings.length} saved</span>
                </div>

                {favoriteListings.length ? (
                  favoriteListings.map((item) => (
                    <div className="mini-card premium-mini-card" key={item.id}>
                      <img src={item.image} alt={item.title} />
                      <div className="mini-card-copy">
                        <strong>{item.title}</strong>
                        <p>
                          {item.location} · ${item.price}/{item.unit}
                        </p>
                        <span>{item.pickupWindows[0]}</span>
                      </div>
                      <button className="ghost" onClick={() => navigate(`/listing/${item.id}`)}>
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No saved listings yet.</p>
                )}
              </section>
            }
          />

          <Route path="/messages" element={<MessagesPage conversations={conversations} threadMessages={threadMessages} seller={seller} onSelectConversation={handleSelectConversation} onSendMessage={handleSendMessage} />} />

          <Route
            path="/notifications"
            element={<NotificationsRoute notifications={notifications} alerts={alerts} seller={seller} sellers={sellers} follows={follows} onCreateAlert={handleCreateAlert} />}
          />

          <Route path="/social" element={<SocialRoute posts={posts} />} />

          <Route
            path="/seller/:sellerId"
            element={<SellerRoute listings={listings} sellers={sellers} follows={follows} favorites={favorites} onToggleFavorite={handleToggleFavorite} onFollow={handleFollow} />}
          />

          <Route
            path="/store"
            element={
              <section className="stack">
                <div className="section-heading compact-heading">
                  <div>
                    <p className="eyebrow">Seller dashboard</p>
                    <h2>My Store</h2>
                  </div>
                  <button className="primary" onClick={() => navigate('/store/new')}>
                    New listing
                  </button>
                </div>

                <div className="dashboard-stats">
                  <button className="dashboard-card dashboard-link" onClick={() => navigate('/store/listings')}>
                    <span>Active listings</span>
                    <strong>{myListings.length}</strong>
                  </button>
                  <button className="dashboard-card dashboard-link" onClick={() => navigate('/store/inventory')}>
                    <span>Total inventory</span>
                    <strong>{totalInventory}</strong>
                  </button>
                  <button className="dashboard-card dashboard-link" onClick={() => navigate('/store/analytics')}>
                    <span>Average price</span>
                    <strong>${averagePrice}</strong>
                  </button>
                </div>

                <div className="tool-grid">
                  <button className="tool-card" onClick={() => navigate('/store/new')}>
                    <strong>+ New listing</strong>
                    <span>Create a photo-first product card</span>
                  </button>
                  <button className="tool-card" onClick={() => navigate('/store/listings')}>
                    <strong>Manage listings</strong>
                    <span>View and edit your active items</span>
                  </button>
                  <button className="tool-card" onClick={() => navigate('/notifications')}>
                    <strong>Alerts</strong>
                    <span>Control saved fruit notifications</span>
                  </button>
                  <button className="tool-card" onClick={() => navigate('/social')}>
                    <strong>Community feed</strong>
                    <span>Track harvest posts and neighborhood signals</span>
                  </button>
                </div>
              </section>
            }
          />

          <Route
            path="/store/listings"
            element={
              <section className="stack">
                <div className="section-heading compact-heading">
                  <div>
                    <p className="eyebrow">Seller listings</p>
                    <h2>Manage Listings</h2>
                  </div>
                  <button className="primary" onClick={() => navigate('/store/new')}>
                    New listing
                  </button>
                </div>

                {myListings.length ? (
                  myListings.map((item) => (
                    <div className="listing-row" key={item.id}>
                      <img className="listing-row-image" src={item.image} alt={item.title} />
                      <div className="listing-row-copy">
                        <strong>{item.title}</strong>
                        <p>
                          {item.location} · {item.inventory} left · ${item.price}/{item.unit}
                        </p>
                        <span>{item.pickupWindows[0]}</span>
                      </div>
                      <div className="listing-row-actions">
                        <button className="ghost" onClick={() => navigate(`/listing/${item.id}`)}>
                          View
                        </button>
                        <button className="ghost" onClick={() => navigate(`/store/edit/${item.id}`)}>
                          Edit
                        </button>
                        <button className="ghost" onClick={() => handleArchive(item.id)}>
                          Archive
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>You do not have any listings yet.</p>
                )}
              </section>
            }
          />

          <Route
            path="/store/inventory"
            element={
              <section className="stack">
                <div className="section-heading compact-heading">
                  <div>
                    <p className="eyebrow">Inventory</p>
                    <h2>Inventory Overview</h2>
                  </div>
                  <button className="ghost" onClick={() => navigate('/store/listings')}>
                    Back to listings
                  </button>
                </div>

                <div className="inventory-table">
                  {myListings.length ? (
                    myListings.map((item) => (
                      <div className="inventory-row" key={item.id}>
                        <span>{item.title}</span>
                        <strong>{item.inventory} in stock</strong>
                      </div>
                    ))
                  ) : (
                    <p>You do not have inventory yet.</p>
                  )}
                </div>
              </section>
            }
          />

          <Route
            path="/store/analytics"
            element={
              <section className="stack">
                <div className="section-heading compact-heading">
                  <div>
                    <p className="eyebrow">Seller analytics</p>
                    <h2>Performance Snapshot</h2>
                  </div>
                </div>

                <div className="dashboard-stats">
                  <div className="dashboard-card">
                    <span>Active listings</span>
                    <strong>{myListings.length}</strong>
                  </div>
                  <div className="dashboard-card">
                    <span>Total inventory</span>
                    <strong>{totalInventory}</strong>
                  </div>
                  <div className="dashboard-card">
                    <span>Average price</span>
                    <strong>${averagePrice}</strong>
                  </div>
                </div>

                <div className="analytics-note">
                  <strong>Next scale layer:</strong>
                  <p>V6B adds push notifications, real trust ranking, AI produce detection backend, and feed ranking.</p>
                </div>
              </section>
            }
          />

          <Route path="/store/new" element={<ListingForm seller={seller} submitLabel="Save listing" onSubmitListing={async (payload) => handleCreate(payload)} />} />

          <Route path="/store/edit/:id" element={<EditListingRoute listings={listings} seller={seller} onSubmitListing={async (payload, existingId) => handleUpdate(payload, existingId)} />} />

          <Route
            path="/profile"
            element={
              <section className="profile-card premium-profile">
                <img className="hero-fruit" src={seller.heroFruit} alt="Lead fruit" />
                <div className="profile-row">
                  <img className="avatar" src={seller.avatar} alt={seller.name} />
                  <div>
                    <h2>{seller.name}</h2>
                    <p>
                      {seller.handle} · {seller.city}
                    </p>
                  </div>
                </div>

                <p>{seller.bio}</p>

                <div className="signal-row">
                  <span className="signal-pill">{seller.verified ? 'Verified farmer' : 'Verification pending'}</span>
                  <span className="signal-pill">{seller.responseScore || 'Response score pending'}</span>
                  <span className="signal-pill">{seller.repeatBuyerScore || 'Repeat-buyer score pending'}</span>
                </div>

                <div className="dashboard-stats profile-stats">
                  <div className="dashboard-card">
                    <span>Listings</span>
                    <strong>{myListings.length}</strong>
                  </div>
                  <div className="dashboard-card">
                    <span>Favorites</span>
                    <strong>{favoriteListings.length}</strong>
                  </div>
                  <div className="dashboard-card">
                    <span>Followers</span>
                    <strong>{seller.followers || 0}</strong>
                  </div>
                </div>

                <div className="action-row">
                  <button className="ghost">Upload profile photo</button>
                  <button className="ghost">Upload lead fruit photo</button>
                </div>
              </section>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Home
        </NavLink>
        <NavLink to="/social" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Feed
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Messages
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Alerts
        </NavLink>
        <NavLink to="/store" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          My Store
        </NavLink>
      </nav>
    </div>
  )
}

function EditListingRoute({
  listings,
  seller,
  onSubmitListing,
}: {
  listings: Listing[]
  seller: SellerProfile
  onSubmitListing: (payload: Omit<Listing, 'id'>, existingId?: string) => Promise<void>
}) {
  const { id } = useParams()
  const listing = listings.find((item) => item.id === id)

  if (!listing) {
    return (
      <section className="stack">
        <h2>Listing not found</h2>
        <p>This listing may have been created before persistence was enabled. Create a fresh listing instead.</p>
      </section>
    )
  }

  return <ListingForm seller={seller} initialValues={listing} existingId={listing.id} submitLabel="Update listing" onSubmitListing={onSubmitListing} />
}

function App() {
  const [listings, setListings] = useState<Listing[]>(fallbackListings)
  const [seller, setSeller] = useState<SellerProfile>(fallbackSeller)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [sellers, setSellers] = useState<SellerProfile[]>([fallbackSeller])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [alerts, setAlerts] = useState<SavedAlert[]>([])
  const [follows, setFollows] = useState<SellerFollow[]>([])

  useEffect(() => {
    getListings().then(setListings).catch(() => setListings(fallbackListings))
    getSeller().then(setSeller).catch(() => setSeller(fallbackSeller))
    getFavorites().then(setFavorites).catch(() => setFavorites([]))
    getConversations().then(setConversations).catch(() => setConversations([]))
    getSellers().then(setSellers).catch(() => setSellers([fallbackSeller]))
    getSocialPosts().then(setPosts).catch(() => setPosts([]))
    getNotifications().then(setNotifications).catch(() => setNotifications([]))
    getSavedAlerts().then(setAlerts).catch(() => setAlerts([]))
    getFollows('me').then(setFollows).catch(() => setFollows([]))
  }, [])

  return (
    <AppLayout
      listings={listings}
      setListings={setListings}
      seller={seller}
      favorites={favorites}
      setFavorites={setFavorites}
      conversations={conversations}
      setConversations={setConversations}
      threadMessages={threadMessages}
      setThreadMessages={setThreadMessages}
      sellers={sellers}
      setSellers={setSellers}
      posts={posts}
      notifications={notifications}
      alerts={alerts}
      setAlerts={setAlerts}
      follows={follows}
      setFollows={setFollows}
    />
  )
}

export default App
