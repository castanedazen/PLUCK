import {
  ChangeEvent,
  FormEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react'
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
  createAlert,
  createListing,
  createOrGetConversation,
  deleteListing,
  getAlerts,
  getConversations,
  getFavorites,
  getFollows,
  getListings,
  getMessagesByConversation,
  getNotifications,
  getSeller,
  getSellerById,
  getSocialPosts,
  login,
  markNotificationRead,
  reservePickup,
  sendMessage,
  signup,
  toggleAlert,
  toggleFavorite,
  toggleFollow,
  updateListing,
} from './api'
import type {
  AlertItem,
  AuthUser,
  Conversation,
  Favorite,
  Follow,
  Listing,
  Message,
  NotificationItem,
  SellerProfile,
  SocialPost,
} from './types'

type QuickFilter = 'all' | 'just-added' | 'under-5' | 'citrus' | 'high-stock'

const fallbackListings: Listing[] = [
  {
    id: '1',
    title: 'Sun-warm Valencia Oranges',
    fruit: 'Oranges',
    price: 6,
    unit: 'bag',
    image:
      'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=1200&q=80',
    location: 'Mission Hills, CA',
    city: 'Mission Hills',
    state: 'CA',
    distance: '0.8 mi',
    inventory: 7,
    sellerId: 's1',
    sellerName: 'Elena',
    description: 'Picked this morning. Sweet, juicy, and ideal for snacking or fresh juice.',
    pickupWindows: ['Today 5–7 PM', 'Tomorrow 9–11 AM'],
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
    location: 'Granada Hills, CA',
    city: 'Granada Hills',
    state: 'CA',
    distance: '1.7 mi',
    inventory: 11,
    sellerId: 's2',
    sellerName: 'Marco',
    description: 'Bright, floral lemons with strong color and a clean finish for cooking or cocktails.',
    pickupWindows: ['Today 6–8 PM', 'Saturday 10 AM–1 PM'],
    status: 'active',
    tags: ['citrus', 'cocktails', 'kitchen'],
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
  city: 'Mission Hills',
  state: 'CA',
  zip: '91345',
  locationLabel: 'Mission Hills, CA',
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

type ListingFormState = {
  title: string
  fruit: string
  price: string
  unit: string
  imagePreview: string
  location: string
  city: string
  state: string
  zip: string
  inventory: string
  description: string
  pickup1: string
  pickup2: string
  tags: string
  harvestNote: string
  harvestLabel: string
  freshnessLabel: string
  availabilityLabel: string
}

const emptyForm: ListingFormState = {
  title: '',
  fruit: '',
  price: '',
  unit: 'basket',
  imagePreview: '',
  location: '',
  city: '',
  state: '',
  zip: '',
  inventory: '',
  description: '',
  pickup1: '',
  pickup2: '',
  tags: '',
  harvestNote: '',
  harvestLabel: 'Just dropped',
  freshnessLabel: 'Fresh harvest',
  availabilityLabel: 'Available now',
}

const quickFilters: { key: QuickFilter; label: string }[] = [
  { key: 'all', label: 'All harvests' },
  { key: 'just-added', label: 'Just added' },
  { key: 'under-5', label: 'Under $5' },
  { key: 'citrus', label: 'Citrus' },
  { key: 'high-stock', label: 'High stock' },
]

function formatTime(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatShortDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function sellerLabel(listing: Listing) {
  const rating = listing.sellerRating ? listing.sellerRating.toFixed(1) : null
  return rating ? `${listing.sellerName} • ★ ${rating}` : listing.sellerName
}

function prettyLocation(listing: Listing) {
  const parts = [listing.city || '', listing.state || ''].filter(Boolean)
  if (parts.length) return parts.join(', ')
  return listing.location
}

function hasGeo(listing: Listing) {
  return Boolean(listing.geo?.lat && listing.geo?.lng)
}

function ActionGrid({
  children,
  columns = 2,
}: {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
}) {
  return <div className={`action-grid action-grid--${columns}`}>{children}</div>
}

function ReserveModal({
  listing,
  onClose,
  onConfirm,
}: {
  listing: Listing
  onClose: () => void
  onConfirm: (pickupWindow: string) => Promise<void>
}) {
  const [selectedWindow, setSelectedWindow] = useState(listing.pickupWindows?.[0] || 'Pickup by message')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Reserve pickup</p>
            <h3>{listing.title}</h3>
            <p className="modal-subcopy">
              Choose the pickup window that works best. You can message the grower immediately after.
            </p>
          </div>
          <button className="ghost compact-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-window-list">
          {listing.pickupWindows.map((slot) => (
            <button
              key={slot}
              className={selectedWindow === slot ? 'window-pill active' : 'window-pill'}
              onClick={() => setSelectedWindow(slot)}
            >
              {slot}
            </button>
          ))}
        </div>

        {error ? <div className="status-banner error">{error}</div> : null}

        <div className="action-row">
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              try {
                setBusy(true)
                setError('')
                await onConfirm(selectedWindow)
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Unable to reserve pickup.'
                setError(message)
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Reserving...' : 'Confirm pickup'}
          </button>
          <button className="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function AuthShell({
  mode,
  onAuthSuccess,
}: {
  mode: 'login' | 'signup'
  onAuthSuccess: (user: AuthUser) => void
}) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'buyer' | 'grower'>('buyer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      const user =
        mode === 'signup'
          ? await signup({
              name: name.trim() || 'User',
              email: email.trim(),
              role,
            })
          : await login({
              email: email.trim(),
            })

      onAuthSuccess(user)
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to continue.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-hero">
        <p className="eyebrow">PLUCK account</p>
        <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p>
          Join as a buyer or grower. This is the foundation for real profiles, saved searches, and nationwide discovery.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">{mode === 'signup' ? 'New account' : 'Login'}</p>
            <h2>{mode === 'signup' ? 'Start using PLUCK' : 'Sign into your account'}</h2>
          </div>
        </div>

        <div className="listing-form">
          <div className="form-grid">
            {mode === 'signup' ? (
              <label className="full">
                Full name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Miller" />
              </label>
            ) : null}

            <label className="full">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            {mode === 'signup' ? (
              <label className="full">
                Role
                <div className="auth-role-row">
                  <button
                    type="button"
                    className={role === 'buyer' ? 'ghost auth-role active-soft' : 'ghost auth-role'}
                    onClick={() => setRole('buyer')}
                  >
                    Buyer
                  </button>
                  <button
                    type="button"
                    className={role === 'grower' ? 'ghost auth-role active-soft' : 'ghost auth-role'}
                    onClick={() => setRole('grower')}
                  >
                    Grower
                  </button>
                </div>
              </label>
            ) : null}
          </div>

          {error ? <div className="status-banner error">{error}</div> : null}

          <div className="action-row">
            <button className="primary" type="submit" disabled={busy}>
              {busy ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => navigate(mode === 'signup' ? '/login' : '/signup')}
            >
              {mode === 'signup' ? 'Have an account?' : 'Create account'}
            </button>
          </div>
        </div>
      </form>
    </section>
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
      city: initialValues.city || '',
      state: initialValues.state || '',
      zip: initialValues.zip || '',
      inventory: String(initialValues.inventory),
      description: initialValues.description,
      pickup1: initialValues.pickupWindows?.[0] || '',
      pickup2: initialValues.pickupWindows?.[1] || '',
      tags: (initialValues.tags || []).join(', '),
      harvestNote: initialValues.harvestNote || '',
      harvestLabel: initialValues.harvestLabel || 'Just dropped',
      freshnessLabel: initialValues.freshnessLabel || 'Fresh harvest',
      availabilityLabel: initialValues.availabilityLabel || 'Available now',
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  function updateForm<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      updateForm('imagePreview', result)
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
      const locationLabel =
        form.location.trim() ||
        [form.city.trim(), form.state.trim()].filter(Boolean).join(', ') ||
        'Anywhere, USA'

      const payload: Omit<Listing, 'id'> = {
        title: form.title.trim() || `${form.fruit.trim()} Listing`,
        fruit: form.fruit.trim() || 'Fruit',
        price: Number(form.price) || 0,
        unit: form.unit.trim() || 'basket',
        image:
          form.imagePreview ||
          'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
        location: locationLabel,
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        distance: initialValues?.distance || 'Just added',
        inventory: Number(form.inventory) || 1,
        sellerId: seller.id,
        sellerName: seller.name,
        description: form.description.trim() || 'Fresh local fruit available for pickup.',
        pickupWindows: pickupWindows.length ? pickupWindows : ['Pickup by message'],
        isFavorite: initialValues?.isFavorite || false,
        status: initialValues?.status || 'active',
        tags: form.tags
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        harvestNote: form.harvestNote.trim(),
        harvestLabel: form.harvestLabel,
        freshnessLabel: form.freshnessLabel,
        availabilityLabel: form.availabilityLabel,
        sellerVerified: seller.verified,
        sellerRating: seller.rating,
        geo: initialValues?.geo || null,
      }

      await onSubmitListing(payload, existingId)
      setSaveSuccess(existingId ? 'Listing updated successfully.' : 'Listing created successfully.')

      setTimeout(() => {
        navigate('/store/listings')
      }, 450)
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
          <p className="eyebrow">{existingId ? 'Edit listing' : 'New listing'}</p>
          <h2>{existingId ? 'Update listing details' : 'Create a premium fruit listing'}</h2>
          <p>
            Stronger titles, clearer pickup windows, trust badges, and nationwide-ready location fields.
          </p>
        </div>
      </div>

      <form className="listing-form" onSubmit={handleSubmit}>
        <div className="form-grid">
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
            <input
              value={form.unit}
              onChange={(e) => updateForm('unit', e.target.value)}
              placeholder="bag"
            />
          </label>

          <label>
            City
            <input
              value={form.city}
              onChange={(e) => updateForm('city', e.target.value)}
              placeholder="Austin"
            />
          </label>

          <label>
            State
            <input
              value={form.state}
              onChange={(e) => updateForm('state', e.target.value)}
              placeholder="TX"
            />
          </label>

          <label>
            ZIP code
            <input
              value={form.zip}
              onChange={(e) => updateForm('zip', e.target.value)}
              placeholder="78704"
            />
          </label>

          <label>
            Location label
            <input
              value={form.location}
              onChange={(e) => updateForm('location', e.target.value)}
              placeholder="South Austin, TX"
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

          <label className="full upload-zone">
            Upload photo
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <span className="upload-hint">Choose a fruit photo from your device for instant preview.</span>
          </label>

          {form.imagePreview && (
            <div className="image-preview-wrap full">
              <img className="image-preview" src={form.imagePreview} alt="Preview" />
              <button type="button" className="ghost compact-btn" onClick={() => updateForm('imagePreview', '')}>
                Remove image
              </button>
            </div>
          )}

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
            Tags
            <input
              value={form.tags}
              onChange={(e) => updateForm('tags', e.target.value)}
              placeholder="sweet, citrus, juice"
            />
          </label>

          <label className="full">
            Harvest note
            <textarea
              value={form.harvestNote}
              onChange={(e) => updateForm('harvestNote', e.target.value)}
              placeholder="Picked at dawn. Best same-day."
              rows={3}
            />
          </label>

          <label>
            Harvest badge
            <input
              value={form.harvestLabel}
              onChange={(e) => updateForm('harvestLabel', e.target.value)}
              placeholder="Just dropped"
            />
          </label>

          <label>
            Freshness badge
            <input
              value={form.freshnessLabel}
              onChange={(e) => updateForm('freshnessLabel', e.target.value)}
              placeholder="Fresh harvest"
            />
          </label>

          <label className="full">
            Availability badge
            <input
              value={form.availabilityLabel}
              onChange={(e) => updateForm('availabilityLabel', e.target.value)}
              placeholder="Available now"
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
          <div className={saveError ? 'status-banner error' : 'status-banner success'}>
            {saveError || saveSuccess}
          </div>
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

function GrowerTrust({
  seller,
  isFollowing,
  onToggleFollow,
}: {
  seller: SellerProfile
  isFollowing: boolean
  onToggleFollow: () => Promise<void>
}) {
  return (
    <div className="grower-trust-card">
      <div className="grower-head">
        <img className="avatar" src={seller.avatar} alt={seller.name} />
        <div>
          <div className="grower-name-row">
            <h3>{seller.name}</h3>
            {seller.verified ? <span className="trust-pill verified">Verified grower</span> : null}
          </div>
          <p className="meta">
            {seller.handle} • {[seller.city, seller.state].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      <p className="desc">{seller.bio}</p>

      <div className="trust-metrics">
        <div className="metric-chip">
          ★ {(seller.rating || 0).toFixed(1)} {seller.ratingCount ? `(${seller.ratingCount})` : ''}
        </div>
        <div className="metric-chip">{seller.followers || 0} followers</div>
        {seller.responseScore ? <div className="metric-chip">{seller.responseScore}</div> : null}
        {seller.repeatBuyerScore ? <div className="metric-chip">{seller.repeatBuyerScore}</div> : null}
      </div>

      {seller.specialties?.length ? (
        <div className="pill-row">
          {seller.specialties.map((item) => (
            <span className="pill" key={item}>
              {item}
            </span>
          ))}
        </div>
      ) : null}

      <div className="action-row">
        <button className="primary" onClick={onToggleFollow}>
          {isFollowing ? 'Following' : 'Follow grower'}
        </button>
      </div>
    </div>
  )
}

function ListingDetailRoute({
  listings,
  favorites,
  follows,
  onEdit,
  onToggleFavorite,
  onToggleFollow,
  onOpenReserve,
  onStartConversation,
}: {
  listings: Listing[]
  favorites: Favorite[]
  follows: Follow[]
  onEdit: (id: string) => void
  onToggleFavorite: (listingId: string) => Promise<void>
  onToggleFollow: (sellerId: string) => Promise<void>
  onOpenReserve: (listing: Listing) => void
  onStartConversation: (listing: Listing) => Promise<void>
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
  const isFollowing = follows.some((item) => item.sellerId === listing.sellerId)

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

          <div className="listing-top-badges">
            {listing.harvestLabel ? <span className="trust-pill harvest">{listing.harvestLabel}</span> : null}
            {listing.freshnessLabel ? <span className="trust-pill freshness">{listing.freshnessLabel}</span> : null}
            {listing.availabilityLabel ? <span className="trust-pill available">{listing.availabilityLabel}</span> : null}
          </div>

          <p className="desc">{listing.description}</p>
          <p className="meta">
            {prettyLocation(listing)} • {listing.inventory} left • {sellerLabel(listing)}
          </p>

          {listing.harvestNote ? <div className="harvest-note">“{listing.harvestNote}”</div> : null}

          {(listing.tags || []).length ? (
            <div className="pill-row">
              {listing.tags?.map((tag) => (
                <span className="pill" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="pill-row">
            {listing.pickupWindows.map((slot, index) => (
              <span className="pill" key={`${listing.id}-${slot}-${index}`}>
                {slot}
              </span>
            ))}
          </div>

          <ActionGrid columns={2}>
            <button className="primary fill-btn" onClick={() => onOpenReserve(listing)} disabled={listing.inventory <= 0}>
              {listing.inventory <= 0 ? 'Sold out' : 'Reserve pickup'}
            </button>
            <button className="ghost fill-btn" onClick={() => onStartConversation(listing)}>
              Message seller
            </button>
            <button className="ghost fill-btn" onClick={() => onToggleFavorite(listing.id)}>
              {isFavorite ? 'Saved' : 'Save'}
            </button>
            <button className="ghost fill-btn" onClick={() => onToggleFollow(listing.sellerId)}>
              {isFollowing ? 'Following' : 'Follow grower'}
            </button>
            <button className="ghost fill-btn" onClick={() => navigate('/grower/' + listing.sellerId)}>
              Grower profile
            </button>
            <button className="ghost fill-btn" onClick={() => onEdit(listing.id)}>
              Edit listing
            </button>
          </ActionGrid>
        </div>
      </div>
    </section>
  )
}

function MessagesPage({
  conversations,
  selectedConversationId,
  threadMessages,
  seller,
  onSelectConversation,
  onSendMessage,
}: {
  conversations: Conversation[]
  selectedConversationId: string | null
  threadMessages: Message[]
  seller: SellerProfile
  onSelectConversation: (id: string) => Promise<void>
  onSendMessage: (conversationId: string, content: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')

  const activeConversation =
    conversations.find((item) => item.id === selectedConversationId) || conversations[0] || null

  return (
    <section className="messages-shell">
      <aside className="messages-sidebar">
        <div className="section-heading compact-heading no-top-gap">
          <div>
            <p className="eyebrow">Conversations</p>
            <h2>Inbox</h2>
          </div>
          <span className="section-meta">{conversations.length} threads</span>
        </div>

        <div className="messages-list">
          {conversations.length ? (
            conversations.map((conversation) => {
              const active = conversation.id === activeConversation?.id
              return (
                <button
                  key={conversation.id}
                  className={active ? 'thread-card active' : 'thread-card'}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="thread-card-top">
                    <strong>{conversation.sellerName}</strong>
                    <span>{formatShortDate(conversation.updatedAt)}</span>
                  </div>
                  <div className="thread-card-title">{conversation.listingTitle}</div>
                  <p>{conversation.lastMessage || 'No messages yet'}</p>
                </button>
              )
            })
          ) : (
            <div className="empty-panel">No conversations yet.</div>
          )}
        </div>
      </aside>

      <section className="messages-main">
        <div className="section-heading compact-heading no-top-gap">
          <div>
            <p className="eyebrow">Thread</p>
            <h2>{activeConversation ? activeConversation.listingTitle : 'Select a conversation'}</h2>
          </div>
        </div>

        <div className="thread-panel">
          {activeConversation ? (
            <>
              <div className="thread-context">
                <div>
                  <strong>{activeConversation.sellerName}</strong>
                  <p>{activeConversation.lastMessage || 'Conversation started'}</p>
                </div>
                <span>{formatTime(activeConversation.updatedAt)}</span>
              </div>

              <div className="message-thread">
                {threadMessages.length ? (
                  threadMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={msg.senderId === seller.id ? 'message-bubble mine' : 'message-bubble'}
                    >
                      <strong>{msg.senderName}</strong>
                      <p>{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="empty-panel">No messages yet.</div>
                )}
              </div>

              <div className="message-compose">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message..."
                  rows={3}
                />
                <button
                  className="primary fill-btn"
                  onClick={async () => {
                    if (!draft.trim()) return
                    await onSendMessage(activeConversation.id, draft)
                    setDraft('')
                  }}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="empty-panel">Choose a conversation to view the thread.</div>
          )}
        </div>
      </section>
    </section>
  )
}

function GrowerPage({
  listings,
  currentSeller,
  follows,
  onToggleFollow,
}: {
  listings: Listing[]
  currentSeller: SellerProfile
  follows: Follow[]
  onToggleFollow: (sellerId: string) => Promise<void>
}) {
  const { id } = useParams()
  const [grower, setGrower] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)

    getSellerById(id)
      .then((data) => {
        if (!cancelled) setGrower(data)
      })
      .catch(() => {
        if (!cancelled) setGrower(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <section className="stack">
        <p>Loading grower...</p>
      </section>
    )
  }

  if (!grower) {
    return (
      <section className="stack">
        <h2>Grower not found</h2>
      </section>
    )
  }

  const growerListings = listings.filter((item) => item.sellerId === grower.id)
  const isFollowing = follows.some((item) => item.sellerId === grower.id)

  return (
    <section className="stack">
      <section className="profile-card premium-profile">
        <img className="hero-fruit" src={grower.heroFruit} alt="Grower orchard" />
        <div className="profile-row">
          <img className="avatar" src={grower.avatar} alt={grower.name} />
          <div>
            <h2>{grower.name}</h2>
            <p>
              {grower.handle} • {[grower.city, grower.state].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        <p>{grower.bio}</p>

        <div className="dashboard-stats profile-stats">
          <div className="dashboard-card">
            <span>Listings</span>
            <strong>{growerListings.length}</strong>
          </div>
          <div className="dashboard-card">
            <span>Followers</span>
            <strong>{grower.followers || 0}</strong>
          </div>
          <div className="dashboard-card">
            <span>Rating</span>
            <strong>{(grower.rating || 0).toFixed(1)}</strong>
          </div>
        </div>

        <div className="trust-metrics">
          {grower.verified ? <div className="metric-chip">Verified grower</div> : null}
          {grower.responseScore ? <div className="metric-chip">{grower.responseScore}</div> : null}
          {grower.repeatBuyerScore ? <div className="metric-chip">{grower.repeatBuyerScore}</div> : null}
          {grower.orchardName ? <div className="metric-chip">{grower.orchardName}</div> : null}
        </div>

        {grower.specialties?.length ? (
          <div className="pill-row">
            {grower.specialties.map((item) => (
              <span className="pill" key={item}>
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {grower.id !== currentSeller.id ? (
          <div className="action-row">
            <button className="primary" onClick={() => onToggleFollow(grower.id)}>
              {isFollowing ? 'Following' : 'Follow grower'}
            </button>
          </div>
        ) : null}
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Grower listings</p>
            <h2>Current harvests</h2>
          </div>
          <span className="section-meta">{growerListings.length} live</span>
        </div>

        <section className="grid">
          {growerListings.map((item) => (
            <article className="card premium-card" key={item.id}>
              <div className="card-image-wrap">
                <img src={item.image} alt={item.title} />
                <span className="card-badge">{item.distance}</span>
              </div>
              <div className="card-body">
                <div className="price-row">
                  <h3>{item.title}</h3>
                  <span>
                    ${item.price}/{item.unit}
                  </span>
                </div>
                <p className="meta">{prettyLocation(item)} • {item.inventory} left</p>
                <div className="listing-badge-row">
                  {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                  {item.freshnessLabel ? <span className="trust-pill freshness">{item.freshnessLabel}</span> : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </section>
  )
}

function AlertsPage({
  seller,
  alerts,
  notifications,
  onCreateAlert,
  onToggleAlert,
  onReadNotification,
}: {
  seller: SellerProfile
  alerts: AlertItem[]
  notifications: NotificationItem[]
  onCreateAlert: (payload: Omit<AlertItem, 'id'>) => Promise<void>
  onToggleAlert: (id: string) => Promise<void>
  onReadNotification: (id: string) => Promise<void>
}) {
  const [fruit, setFruit] = useState('')
  const [location, setLocation] = useState('Anywhere, USA')
  const [radiusMiles, setRadiusMiles] = useState('25')

  return (
    <section className="alerts-layout">
      <div className="stack">
        <div className="section-heading compact-heading no-top-gap">
          <div>
            <p className="eyebrow">Saved alerts</p>
            <h2>Watchlist</h2>
          </div>
          <span className="section-meta">{alerts.length} alerts</span>
        </div>

        <form
          className="listing-form"
          onSubmit={async (e) => {
            e.preventDefault()
            await onCreateAlert({
              userId: seller.id,
              fruit: fruit || 'Fruit',
              location: location || 'Anywhere, USA',
              radiusMiles: Number(radiusMiles) || 25,
              sellerId: '',
              active: true,
            })
            setFruit('')
            setLocation('Anywhere, USA')
            setRadiusMiles('25')
          }}
        >
          <div className="form-grid">
            <label>
              Fruit
              <input value={fruit} onChange={(e) => setFruit(e.target.value)} placeholder="Peaches" />
            </label>
            <label>
              Location
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Denver, CO" />
            </label>
            <label className="full">
              Radius miles
              <input
                type="number"
                min="1"
                max="500"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(e.target.value)}
              />
            </label>
          </div>

          <div className="action-row">
            <button className="primary" type="submit">
              Create alert
            </button>
          </div>
        </form>

        <div className="stack-list">
          {alerts.map((alert) => (
            <div className="alert-card-row" key={alert.id}>
              <div>
                <strong>{alert.fruit}</strong>
                <p>
                  {alert.location} • {alert.radiusMiles} miles
                </p>
              </div>
              <button className={alert.active ? 'ghost active-soft' : 'ghost'} onClick={() => onToggleAlert(alert.id)}>
                {alert.active ? 'Active' : 'Paused'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="stack">
        <div className="section-heading compact-heading no-top-gap">
          <div>
            <p className="eyebrow">Notifications</p>
            <h2>Recent signals</h2>
          </div>
          <span className="section-meta">{notifications.filter((n) => !n.read).length} unread</span>
        </div>

        <div className="stack-list">
          {notifications.length ? (
            notifications.map((item) => (
              <div className={item.read ? 'notification-card' : 'notification-card unread'} key={item.id}>
                <div className="notification-copy">
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <span>{formatTime(item.createdAt)}</span>
                </div>
                {!item.read ? (
                  <button className="ghost compact-btn" onClick={() => onReadNotification(item.id)}>
                    Mark read
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="empty-panel">No notifications yet.</div>
          )}
        </div>
      </div>
    </section>
  )
}

type AppLayoutProps = {
  listings: Listing[]
  setListings: Dispatch<SetStateAction<Listing[]>>
  seller: SellerProfile
  favorites: Favorite[]
  setFavorites: Dispatch<SetStateAction<Favorite[]>>
  conversations: Conversation[]
  setConversations: Dispatch<SetStateAction<Conversation[]>>
  threadMessages: Message[]
  setThreadMessages: Dispatch<SetStateAction<Message[]>>
  socialPosts: SocialPost[]
  notifications: NotificationItem[]
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>
  alerts: AlertItem[]
  setAlerts: Dispatch<SetStateAction<AlertItem[]>>
  follows: Follow[]
  setFollows: Dispatch<SetStateAction<Follow[]>>
  authUser: AuthUser | null
  onAuthSuccess: (user: AuthUser) => void
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
  socialPosts,
  notifications,
  setNotifications,
  alerts,
  setAlerts,
  follows,
  setFollows,
  authUser,
  onAuthSuccess,
}: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all')
  const [reserveTarget, setReserveTarget] = useState<Listing | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  const favoriteListingIds = new Set(favorites.map((fav) => fav.listingId))
  const favoriteListings = listings.filter((item) => favoriteListingIds.has(item.id))
  const myListings = listings.filter((item) => item.sellerName === seller.name)
  const justAdded = listings.filter((item) => item.distance === 'Just added')
  const totalInventory = myListings.reduce((sum, item) => sum + item.inventory, 0)
  const averagePrice =
    myListings.length > 0
      ? (myListings.reduce((sum, item) => sum + item.price, 0) / myListings.length).toFixed(2)
      : '0.00'

  const unreadNotifications = notifications.filter((item) => !item.read)
  const followingSellerIds = new Set(follows.map((item) => item.sellerId))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    let result = listings.filter((item) =>
      [
        item.title,
        item.fruit,
        item.location,
        item.city || '',
        item.state || '',
        item.zip || '',
        item.sellerName,
        item.description,
        ...(item.tags || []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )

    if (activeFilter === 'just-added') {
      result = result.filter((item) => item.distance === 'Just added')
    }

    if (activeFilter === 'under-5') {
      result = result.filter((item) => item.price <= 5)
    }

    if (activeFilter === 'citrus') {
      result = result.filter((item) =>
        ['orange', 'oranges', 'lemon', 'lemons', 'lime', 'limes', 'grapefruit'].includes(
          item.fruit.toLowerCase(),
        ),
      )
    }

    if (activeFilter === 'high-stock') {
      result = result.filter((item) => item.inventory >= 6)
    }

    return result
  }, [listings, query, activeFilter])

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
    setListings((current) => current.map((item) => (item.id === listingId ? updated : item)))
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

  async function handleToggleFollow(sellerId: string) {
    if (sellerId === seller.id) return
    const result = await toggleFollow({ userId: seller.id, sellerId })

    if (result.active) {
      setFollows((current) => [{ id: crypto.randomUUID(), userId: seller.id, sellerId }, ...current])
    } else {
      setFollows((current) => current.filter((item) => item.sellerId !== sellerId))
    }

    const refreshedListings = await getListings()
    setListings(refreshedListings)
  }

  async function handleConfirmReserve(listing: Listing, pickupWindow: string) {
    const result = await reservePickup({
      listingId: listing.id,
      buyerId: seller.id,
      buyerName: seller.name,
      sellerId: listing.sellerId,
      pickupWindow,
    })

    setListings((current) => current.map((item) => (item.id === listing.id ? result.listing : item)))
    setReserveTarget(null)

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
    setSelectedConversationId(conversation.id)

    const thread = await getMessagesByConversation(conversation.id)
    setThreadMessages(thread)

    navigate('/messages')
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
    setSelectedConversationId(conversation.id)

    const thread = await getMessagesByConversation(conversation.id)
    setThreadMessages(thread)

    navigate('/messages')
  }

  async function handleSelectConversation(conversationId: string) {
    const thread = await getMessagesByConversation(conversationId)
    setThreadMessages(thread)
    setSelectedConversationId(conversationId)

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
    setSelectedConversationId(conversationId)
  }

  async function handleCreateAlert(payload: Omit<AlertItem, 'id'>) {
    const created = await createAlert(payload)
    setAlerts((current) => [created, ...current])
  }

  async function handleToggleAlert(id: string) {
    const updated = await toggleAlert(id)
    setAlerts((current) => current.map((item) => (item.id === id ? updated : item)))
  }

  async function handleReadNotification(id: string) {
    const updated = await markNotificationRead(id)
    setNotifications((current) => current.map((item) => (item.id === id ? updated : item)))
  }

  function isActivePath(path: string) {
    return location.pathname === path
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Pluck V7C shell</p>
          <h1>Fresh fruit from neighbors</h1>
          <p className="subtle-copy">
            A sharper local marketplace for backyard harvests, same-day pickup, grower trust, and nationwide-ready discovery.
          </p>
        </div>
        <div className="topbar-actions">
          {!authUser ? (
            <>
              <button className="ghost" onClick={() => navigate('/login')}>
                Log in
              </button>
              <button className="primary" onClick={() => navigate('/signup')}>
                Create account
              </button>
            </>
          ) : (
            <>
              <button className="ghost" onClick={() => navigate('/alerts')}>
                Alerts {unreadNotifications.length ? `(${unreadNotifications.length})` : ''}
              </button>
              <button className="ghost" onClick={() => navigate('/profile')}>
                {[seller.city, seller.state].filter(Boolean).join(', ') || 'Profile'}
              </button>
              <button className="primary" onClick={() => navigate('/store/new')}>
                + New listing
              </button>
            </>
          )}
        </div>
      </header>

      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">Refined neighborhood commerce</p>
          <h2>Turn extra fruit into a polished local marketplace experience.</h2>
          <p>
            Pluck now surfaces grower trust, harvest freshness, alerts, stronger messaging, and a cleaner mobile-style product rhythm.
          </p>
          <div className="hero-cta-row">
            <button className="primary" onClick={() => navigate('/store/new')}>
              Create premium listing
            </button>
            <button className="ghost" onClick={() => navigate('/map')}>
              Explore nearby map
            </button>
            <button className="ghost" onClick={() => navigate('/alerts')}>
              Open alerts
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
          <button className="stat-card stat-link" onClick={() => navigate('/store/inventory')}>
            <span>Your inventory</span>
            <strong>{totalInventory}</strong>
          </button>
          <button className="stat-card stat-link" onClick={() => navigate('/messages')}>
            <span>Inbox threads</span>
            <strong>{conversations.length}</strong>
          </button>
        </div>
      </section>

      <div className="search-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fruit, growers, city, state, or ZIP..."
        />

        <div className="search-bottom-row">
          <div className="toggle-row">
            <button className={isActivePath('/') ? 'toggle active' : 'toggle'} onClick={() => navigate('/')}>
              List
            </button>
            <button className={isActivePath('/map') ? 'toggle active' : 'toggle'} onClick={() => navigate('/map')}>
              Map
            </button>
          </div>

          <div className="filter-chip-row">
            {quickFilters.map((filter) => (
              <button
                key={filter.key}
                className={activeFilter === filter.key ? 'filter-chip active' : 'filter-chip'}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="content">
        <Routes>
          <Route path="/login" element={<AuthShell mode="login" onAuthSuccess={onAuthSuccess} />} />
          <Route path="/signup" element={<AuthShell mode="signup" onAuthSuccess={onAuthSuccess} />} />

          <Route
            path="/"
            element={
              <>
                <section className="hero-card">
                  <div>
                    <p className="eyebrow">Today nearby</p>
                    <h2>Backyard harvests, same-day pickup</h2>
                    <p>Browse fruit from local growers, reserve by message, and coordinate a clear pickup window.</p>
                  </div>
                  <button className="primary" onClick={() => navigate('/store/new')}>
                    Create listing
                  </button>
                </section>

                {unreadNotifications.length ? (
                  <section className="signal-strip">
                    {unreadNotifications.slice(0, 2).map((item) => (
                      <button className="signal-pill" key={item.id} onClick={() => navigate('/alerts')}>
                        {item.title}
                      </button>
                    ))}
                  </section>
                ) : null}

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
                    const isFollowing = followingSellerIds.has(item.sellerId)

                    return (
                      <article className="card premium-card listing-card-v2" key={item.id}>
                        <div className="card-image-wrap">
                          <img src={item.image} alt={item.title} />
                          <span className="card-badge">{item.distance}</span>
                        </div>
                        <div className="card-body">
                          <div className="price-row">
                            <h3>{item.title}</h3>
                            <span>
                              ${item.price}/{item.unit}
                            </span>
                          </div>

                          <div className="listing-badge-row">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.freshnessLabel ? <span className="trust-pill freshness">{item.freshnessLabel}</span> : null}
                            {item.availabilityLabel ? <span className="trust-pill available">{item.availabilityLabel}</span> : null}
                          </div>

                          <p className="meta">{prettyLocation(item)} • {item.inventory} left</p>

                          <button className="seller-inline-link" onClick={() => navigate('/grower/' + item.sellerId)}>
                            {item.sellerVerified ? '✓ ' : ''}
                            {sellerLabel(item)}
                          </button>

                          <p className="desc">{item.description}</p>

                          {item.harvestNote ? <div className="harvest-note small">{item.harvestNote}</div> : null}

                          {(item.tags || []).length ? (
                            <div className="pill-row">
                              {item.tags?.map((tag) => (
                                <span className="pill" key={tag}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="pill-row">
                            {item.pickupWindows.map((slot, index) => (
                              <span className="pill" key={`${item.id}-${slot}-${index}`}>
                                {slot}
                              </span>
                            ))}
                          </div>

                          <ActionGrid columns={2}>
                            <button className="primary fill-btn" onClick={() => handleStartConversation(item)}>
                              Message
                            </button>
                            <button className="ghost fill-btn" onClick={() => navigate('/listing/' + item.id)}>
                              View
                            </button>
                            <button className="ghost fill-btn" onClick={() => handleToggleFavorite(item.id)}>
                              {isFavorite ? 'Saved' : 'Save'}
                            </button>
                            <button className="ghost fill-btn" onClick={() => handleToggleFollow(item.sellerId)}>
                              {isFollowing ? 'Following' : 'Follow'}
                            </button>
                          </ActionGrid>
                        </div>
                      </article>
                    )
                  })}
                </section>

                {socialPosts.length ? (
                  <>
                    <section className="section-heading section-gap-top">
                      <div>
                        <p className="eyebrow">Harvest feed</p>
                        <h2>Grower signals</h2>
                      </div>
                    </section>

                    <section className="social-grid">
                      {socialPosts.slice(0, 3).map((post) => (
                        <article className="social-card" key={post.id}>
                          <div className="social-head">
                            <img className="avatar small" src={post.sellerAvatar} alt={post.sellerName} />
                            <div>
                              <strong>{post.sellerName}</strong>
                              <p>
                                {post.sellerHandle} • {post.location}
                              </p>
                            </div>
                          </div>

                          {post.image ? <img className="social-image" src={post.image} alt={post.title} /> : null}

                          <div className="social-body">
                            <span className="trust-pill social-type">{post.type}</span>
                            <h3>{post.title}</h3>
                            <p>{post.body}</p>
                            <ActionGrid columns={1}>
                              <button className="ghost fill-btn" onClick={() => navigate('/grower/' + post.sellerId)}>
                                View grower
                              </button>
                            </ActionGrid>
                          </div>
                        </article>
                      ))}
                    </section>
                  </>
                ) : null}

                <section className="section-heading section-gap-top">
                  <div>
                    <p className="eyebrow">Fresh activity</p>
                    <h2>Just added</h2>
                  </div>
                </section>

                <section className="mini-grid">
                  {(justAdded.length ? justAdded : listings.slice(0, 2)).map((item) => (
                    <div className="activity-card" key={item.id}>
                      <img src={item.image} alt={item.title} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>
                          {prettyLocation(item)} • ${item.price}/{item.unit}
                        </p>
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
                <div className="map-fallback premium-map">
                  <div className="map-header-row">
                    <div>
                      <p className="eyebrow">Discovery map</p>
                      <h3>Location-first neighborhood browsing</h3>
                    </div>
                    <button className="ghost" onClick={() => navigate('/store/new')}>
                      Add your harvest
                    </button>
                  </div>

                  <p>
                    This map view is now geo-aware and nationwide-ready. Listings with coordinates are ready for live pin rendering in the next step.
                  </p>

                  <div className="pin-list">
                    {filtered.map((item) => (
                      <div className="pin-row premium-pin-row" key={item.id}>
                        <div>
                          <strong>{item.fruit}</strong>
                          <p>
                            {item.title} • {prettyLocation(item)}
                          </p>
                          <div className="listing-badge-row">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.sellerVerified ? <span className="trust-pill verified">Verified</span> : null}
                            {hasGeo(item) ? <span className="trust-pill available">Geo-ready</span> : null}
                          </div>
                        </div>
                        <span>
                          ${item.price}/{item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            }
          />

          <Route
            path="/listing/:id"
            element={
              <ListingDetailRoute
                listings={listings}
                favorites={favorites}
                follows={follows}
                onEdit={(id) => navigate('/store/edit/' + id)}
                onToggleFavorite={handleToggleFavorite}
                onToggleFollow={handleToggleFollow}
                onOpenReserve={setReserveTarget}
                onStartConversation={handleStartConversation}
              />
            }
          />

          <Route
            path="/grower/:id"
            element={
              <GrowerPage
                listings={listings}
                currentSeller={seller}
                follows={follows}
                onToggleFollow={handleToggleFollow}
              />
            }
          />

          <Route
            path="/favorites"
            element={
              <section className="stack">
                <div className="section-heading compact-heading no-top-gap">
                  <div>
                    <p className="eyebrow">Saved for later</p>
                    <h2>Favorites</h2>
                  </div>
                  <span className="section-meta">{favoriteListings.length} saved</span>
                </div>

                {favoriteListings.length ? (
                  <div className="stack-list">
                    {favoriteListings.map((item) => (
                      <div className="mini-card premium-mini-card" key={item.id}>
                        <img src={item.image} alt={item.title} />
                        <div className="mini-card-copy">
                          <strong>{item.title}</strong>
                          <p>
                            {prettyLocation(item)} • ${item.price}/{item.unit}
                          </p>
                          <span>{item.pickupWindows[0]}</span>
                        </div>
                        <button className="ghost" onClick={() => navigate('/listing/' + item.id)}>
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-panel">No saved listings yet.</div>
                )}
              </section>
            }
          />

          <Route
            path="/alerts"
            element={
              <AlertsPage
                seller={seller}
                alerts={alerts}
                notifications={notifications}
                onCreateAlert={handleCreateAlert}
                onToggleAlert={handleToggleAlert}
                onReadNotification={handleReadNotification}
              />
            }
          />

          <Route
            path="/messages"
            element={
              <MessagesPage
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                threadMessages={threadMessages}
                seller={seller}
                onSelectConversation={handleSelectConversation}
                onSendMessage={handleSendMessage}
              />
            }
          />

          <Route
            path="/store"
            element={
              <section className="stack">
                <div className="section-heading compact-heading no-top-gap">
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
                    <span>Create a new product card</span>
                  </button>
                  <button className="tool-card" onClick={() => navigate('/store/listings')}>
                    <strong>Manage listings</strong>
                    <span>View and edit your active items</span>
                  </button>
                  <button className="tool-card" onClick={() => navigate('/store/inventory')}>
                    <strong>Inventory</strong>
                    <span>Adjust stock across listings</span>
                  </button>
                  <button className="tool-card" onClick={() => navigate('/store/analytics')}>
                    <strong>Analytics</strong>
                    <span>See pricing and seller metrics</span>
                  </button>
                </div>

                <GrowerTrust
                  seller={seller}
                  isFollowing={false}
                  onToggleFollow={async () => Promise.resolve()}
                />
              </section>
            }
          />

          <Route
            path="/store/listings"
            element={
              <section className="stack">
                <div className="section-heading compact-heading no-top-gap">
                  <div>
                    <p className="eyebrow">Seller listings</p>
                    <h2>Manage Listings</h2>
                  </div>
                  <button className="primary" onClick={() => navigate('/store/new')}>
                    New listing
                  </button>
                </div>

                {myListings.length ? (
                  <div className="stack-list">
                    {myListings.map((item) => (
                      <div className="listing-row" key={item.id}>
                        <img className="listing-row-image" src={item.image} alt={item.title} />
                        <div className="listing-row-copy">
                          <strong>{item.title}</strong>
                          <p>
                            {prettyLocation(item)} • {item.inventory} left • ${item.price}/{item.unit}
                          </p>
                          <span>{item.pickupWindows[0]}</span>
                          <div className="listing-badge-row">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.availabilityLabel ? <span className="trust-pill available">{item.availabilityLabel}</span> : null}
                          </div>
                        </div>
                        <div className="listing-row-actions">
                          <button className="ghost" onClick={() => navigate('/listing/' + item.id)}>
                            View
                          </button>
                          <button className="ghost" onClick={() => navigate('/store/edit/' + item.id)}>
                            Edit
                          </button>
                          <button className="ghost" onClick={() => handleArchive(item.id)}>
                            Archive
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-panel">You do not have any listings yet.</div>
                )}
              </section>
            }
          />

          <Route
            path="/store/inventory"
            element={
              <section className="stack">
                <div className="section-heading compact-heading no-top-gap">
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
                    <div className="empty-panel">You do not have inventory yet.</div>
                  )}
                </div>
              </section>
            }
          />

          <Route
            path="/store/analytics"
            element={
              <section className="stack">
                <div className="section-heading compact-heading no-top-gap">
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
                  <strong>Next build target:</strong>
                  <p>Live map pins, editable profiles, and richer pickup coordination flow.</p>
                </div>
              </section>
            }
          />

          <Route
            path="/store/new"
            element={
              <ListingForm
                seller={seller}
                submitLabel="Save listing"
                onSubmitListing={async (payload) => handleCreate(payload)}
              />
            }
          />

          <Route
            path="/store/edit/:id"
            element={
              <EditListingRoute
                listings={listings}
                seller={seller}
                onSubmitListing={async (payload, existingId) => handleUpdate(payload, existingId)}
              />
            }
          />

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
                      {seller.handle} • {[seller.city, seller.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                {!authUser ? (
                  <>
                    <p>Create an account or log in to make this profile live across devices.</p>
                    <div className="action-row">
                      <button className="primary" onClick={() => navigate('/signup')}>
                        Create account
                      </button>
                      <button className="ghost" onClick={() => navigate('/login')}>
                        Log in
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{seller.bio}</p>

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
                        <span>Messages</span>
                        <strong>{conversations.length}</strong>
                      </div>
                    </div>

                    <div className="trust-metrics">
                      {seller.verified ? <div className="metric-chip">Verified grower</div> : null}
                      {seller.rating ? <div className="metric-chip">★ {seller.rating.toFixed(1)}</div> : null}
                      {seller.followers ? <div className="metric-chip">{seller.followers} followers</div> : null}
                      {seller.responseScore ? <div className="metric-chip">{seller.responseScore}</div> : null}
                      {seller.repeatBuyerScore ? <div className="metric-chip">{seller.repeatBuyerScore}</div> : null}
                    </div>

                    {seller.specialties?.length ? (
                      <div className="pill-row">
                        {seller.specialties.map((item) => (
                          <span className="pill" key={item}>
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="action-row">
                      <button className="ghost">Upload profile photo</button>
                      <button className="ghost">Upload lead fruit photo</button>
                    </div>
                  </>
                )}
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
        <NavLink to="/favorites" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Favorites
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Messages
        </NavLink>
        <NavLink to="/store" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          My Store
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Profile
        </NavLink>
      </nav>

      {reserveTarget ? (
        <ReserveModal
          listing={reserveTarget}
          onClose={() => setReserveTarget(null)}
          onConfirm={async (pickupWindow) => handleConfirmReserve(reserveTarget, pickupWindow)}
        />
      ) : null}
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

  return (
    <ListingForm
      seller={seller}
      initialValues={listing}
      existingId={listing.id}
      submitLabel="Update listing"
      onSubmitListing={onSubmitListing}
    />
  )
}

function App() {
  const [listings, setListings] = useState<Listing[]>(fallbackListings)
  const [seller, setSeller] = useState<SellerProfile>(fallbackSeller)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [follows, setFollows] = useState<Follow[]>([])
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    getListings().then(setListings).catch(() => setListings(fallbackListings))
    getSeller().then(setSeller).catch(() => setSeller(fallbackSeller))
    getFavorites().then(setFavorites).catch(() => setFavorites([]))
    getConversations().then(setConversations).catch(() => setConversations([]))
    getSocialPosts().then(setSocialPosts).catch(() => setSocialPosts([]))
    getNotifications().then(setNotifications).catch(() => setNotifications([]))
    getAlerts().then(setAlerts).catch(() => setAlerts([]))
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
      socialPosts={socialPosts}
      notifications={notifications}
      setNotifications={setNotifications}
      alerts={alerts}
      setAlerts={setAlerts}
      follows={follows}
      setFollows={setFollows}
      authUser={authUser}
      onAuthSuccess={setAuthUser}
    />
  )
}

export default App