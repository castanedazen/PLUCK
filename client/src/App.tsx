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
  Link,
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
  detectFruitFromImage,
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
  requestPasswordReset,
  resetPassword,
  reservePickup,
  sendMessage,
  signup,
  toggleAlert,
  toggleFavorite,
  toggleFollow,
  updateListing,
  uploadListingImage,
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
import { LeafletMapView } from './components/LeafletMapView'
import CommunityBoard from './components/CommunityBoard'

type QuickFilter = 'all' | 'just-added' | 'under-5' | 'citrus' | 'high-stock'

const fallbackListings: Listing[] = [
  {
    id: '1',
    title: 'Fresh Backyard Lemons',
    fruit: 'Lemons',
    price: 4,
    unit: 'bag',
    image:
      'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=1200&q=80',
    location: 'Mission Hills, CA',
    city: 'Los Angeles',
    state: 'CA',
    zip: '91345',
    distance: 'Just added',
    inventory: 12,
    sellerId: 'seller-1',
    sellerName: "Maria's Garden",
    description: 'Fresh picked backyard lemons from a local home grower.',
    pickupWindows: ['Today 5–7 PM', 'Tomorrow 9–11 AM'],
    status: 'active',
    tags: ['citrus', 'fresh', 'local'],
    harvestLabel: 'Just dropped',
    freshnessLabel: 'Fresh harvest',
    availabilityLabel: 'Available now',
    harvestNote: 'Picked this morning for same-day pickup.',
    sellerVerified: true,
    sellerRating: 4.8,
    geo: { lat: 34.2766, lng: -118.4671 },
  },
  {
    id: '2',
    title: 'Organic Avocados',
    fruit: 'Avocados',
    price: 3,
    unit: 'each',
    image:
      'https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=1200&q=80',
    location: 'Pasadena, CA',
    city: 'Pasadena',
    state: 'CA',
    zip: '91104',
    distance: 'Just added',
    inventory: 20,
    sellerId: 'seller-2',
    sellerName: 'Green Grove',
    description: 'Creamy organic avocados, perfect for toast or guacamole.',
    pickupWindows: ['Today 6–8 PM', 'Saturday 10 AM–1 PM'],
    status: 'active',
    tags: ['avocados', 'organic', 'creamy'],
    harvestLabel: 'New nearby',
    freshnessLabel: 'Fresh harvest',
    availabilityLabel: 'Available now',
    harvestNote: 'Picked at peak ripeness.',
    sellerVerified: true,
    sellerRating: 4.7,
    geo: { lat: 34.1478, lng: -118.1445 },
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

const routeMeta: { match: RegExp; eyebrow: string; title: string; subtitle: string }[] = [
  { match: /^\/$/, eyebrow: 'PLUCK orchard market', title: 'Grow local. Trade local.', subtitle: 'Real fruit. Real people. Right nearby.' },
  { match: /^\/map/, eyebrow: 'Field map', title: 'See what is growing around you.', subtitle: 'Nearby first. Big chains later.' },
  { match: /^\/board/, eyebrow: 'Local board', title: 'Post something. Show up.', subtitle: 'Events, barter, help, and neighborhood signal.' },
  { match: /^\/favorites/, eyebrow: 'Saved', title: 'Keep what matters close.', subtitle: 'Come back when it is ripe.' },
  { match: /^\/messages/, eyebrow: 'Direct line', title: 'Talk. Then pick up.', subtitle: 'No middlemen. No noise.' },
  { match: /^\/alerts/, eyebrow: 'Signals', title: 'Know when fresh drops hit.', subtitle: 'Quiet alerts. Fast action.' },
  { match: /^\/store/, eyebrow: 'Storefront', title: 'Run your stand your way.', subtitle: 'List, reply, and move fruit fast.' },
  { match: /^\/profile/, eyebrow: 'Reputation', title: 'Earn trust. Keep it.', subtitle: 'Known grower. Clear signals.' },
  { match: /^\/grower\//, eyebrow: 'Grower', title: 'Meet the grower.', subtitle: 'Trust first. Reserve second.' },
  { match: /^\/listing\//, eyebrow: 'Listing', title: 'See it. Decide fast.', subtitle: 'Big photos. Clear next step.' },
  { match: /^\/login/, eyebrow: 'Welcome back', title: 'Back to the orchard.', subtitle: 'Saved fruit, alerts, and threads waiting.' },
  { match: /^\/signup/, eyebrow: 'Join local', title: 'Start small. Grow strong.', subtitle: 'Buy, barter, sell, repeat.' },
  { match: /^\/reset-password/, eyebrow: 'Reset', title: 'Take your account back.', subtitle: 'Set a new password and keep moving.' },
]

function getRouteMeta(pathname: string) {
  return routeMeta.find((item) => item.match.test(pathname)) || routeMeta[0]
}

type ReviewItem = {
  id: string
  listingId: string
  sellerId: string
  sellerName: string
  rating: number
  comment: string
  createdAt: string
}

function routeTheme(pathname: string) {
  if (/^\/map/.test(pathname)) return 'route-theme-map'
  if (/^\/favorites/.test(pathname)) return 'route-theme-favorites'
  if (/^\/messages/.test(pathname)) return 'route-theme-messages'
  if (/^\/store/.test(pathname)) return 'route-theme-store'
  if (/^\/profile/.test(pathname) || /^\/grower\//.test(pathname)) return 'route-theme-profile'
  if (/^\/alerts/.test(pathname)) return 'route-theme-alerts'
  return 'route-theme-home'
}

function memberSinceLabel(_seller: SellerProfile) {
  return 'Member since 2023'
}

function pickupConfidenceLabel(listing: Listing) {
  if (listing.inventory >= 10) return 'Pickup confidence high'
  if (listing.inventory >= 4) return 'Pickup confidence solid'
  return 'Limited harvest window'
}

function trustSignalsForListing(listing: Listing) {
  const signals = [] as string[]
  if (listing.sellerVerified) signals.push('Verified grower')
  if (listing.sellerRating) signals.push(`★ ${listing.sellerRating.toFixed(1)} trusted`)
  signals.push('Quick reply')
  signals.push(pickupConfidenceLabel(listing))
  return signals.slice(0, 4)
}

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function TrustStrip({ listing }: { listing: Listing }) {
  return (
    <div className="trust-strip">
      {trustSignalsForListing(listing).map((item) => (
        <span className="trust-mini" key={`${listing.id}-${item}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

function RatingStars({ value, onChange, interactive = false }: { value: number; onChange?: (value: number) => void; interactive?: boolean }) {
  return (
    <div className={interactive ? 'rating-stars interactive' : 'rating-stars'}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= value ? 'star active' : 'star'}
          onClick={() => interactive && onChange?.(star)}
          aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ReviewsPanel({
  listing,
  reviews,
  onAddReview,
}: {
  listing: Listing
  reviews: ReviewItem[]
  onAddReview: (input: { listingId: string; sellerId: string; sellerName: string; rating: number; comment: string }) => void
}) {
  const [draftRating, setDraftRating] = useState(5)
  const [draftComment, setDraftComment] = useState('')

  return (
    <section className="review-panel">
      <div className="section-heading compact-heading no-top-gap">
        <div>
          <p className="eyebrow">Pickup trust</p>
          <h2>Reviews & grower confidence</h2>
        </div>
        <div className="review-summary">
          <RatingStars value={listing.sellerRating ? Math.round(listing.sellerRating) : 5} />
          <span>{listing.sellerRating ? listing.sellerRating.toFixed(1) : 'New'} {reviews.length ? `${reviews.length} reviews` : 'Be the first to review this pickup'}</span>
        </div>
      </div>

      <div className="review-compose">
        <div>
          <strong>Rate this pickup</strong>
          <p>Share fruit quality, pickup ease, and communication.</p>
        </div>
        <RatingStars value={draftRating} onChange={setDraftRating} interactive />
        <textarea
          value={draftComment}
          onChange={(e) => setDraftComment(e.target.value)}
          rows={3}
          placeholder="How was the pickup?"
        />
        <div className="action-row">
          <button
            className="primary"
            onClick={() => {
              onAddReview({
                listingId: listing.id,
                sellerId: listing.sellerId,
                sellerName: listing.sellerName,
                rating: draftRating,
                comment: draftComment.trim() || 'Great pickup and clear communication.',
              })
              setDraftComment('')
              setDraftRating(5)
            }}
          >
            Submit rating
          </button>
        </div>
      </div>

      {reviews.length ? (
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-card-head">
                <strong>{review.sellerName}</strong>
                <span>{formatReviewDate(review.createdAt)}</span>
              </div>
              <RatingStars value={review.rating} />
              <p>{review.comment}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-panel">Be the first to review this pickup and help the next buyer feel confident.</div>
      )}
    </section>
  )
}


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
  return (
    typeof listing.geo?.lat === 'number' &&
    Number.isFinite(listing.geo.lat) &&
    typeof listing.geo?.lng === 'number' &&
    Number.isFinite(listing.geo.lng)
  )
}

function normalizeListing(listing: Listing): Listing {
  const fruit = listing.fruit || 'Fruit'
  const city = listing.city || ''
  const state = listing.state || ''
  const location =
    listing.location || [city, state].filter(Boolean).join(', ') || 'Local pickup available'

  return {
    ...listing,
    fruit,
    unit: listing.unit || 'each',
    image:
      listing.image ||
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
    location,
    city,
    state,
    zip: listing.zip || '',
    distance: listing.distance || 'Just added',
    inventory: Number.isFinite(listing.inventory) ? listing.inventory : 0,
    sellerId: listing.sellerId || 'seller-unknown',
    sellerName: listing.sellerName || 'Local Grower',
    description: listing.description || 'Fresh local fruit available for pickup.',
    pickupWindows:
      listing.pickupWindows && listing.pickupWindows.length
        ? listing.pickupWindows
        : ['Pickup by message'],
    status: listing.status || 'active',
    tags: listing.tags && listing.tags.length ? listing.tags : [fruit.toLowerCase()],
    harvestLabel: listing.harvestLabel || 'Just dropped',
    freshnessLabel: listing.freshnessLabel || 'Fresh harvest',
    availabilityLabel: listing.availabilityLabel || 'Available now',
    harvestNote: listing.harvestNote || '',
    sellerVerified: listing.sellerVerified ?? false,
    sellerRating: listing.sellerRating ?? 0,
    geo: listing.geo || null,
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.onerror = () => reject(new Error('Unable to read image file.'))
    reader.readAsDataURL(file)
  })
}

function mergeTagCsv(existingCsv: string, incomingTags: string[]) {
  const existing = existingCsv
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const merged = [...existing]
  for (const tag of incomingTags) {
    const clean = tag.trim()
    if (!clean) continue
    if (!merged.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      merged.push(clean)
    }
  }

  return merged.join(', ')
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
  mode: 'login' | 'signup' | 'reset'
  onAuthSuccess: (user: AuthUser) => void
}) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'buyer' | 'grower'>('buyer')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetTokenPreview, setResetTokenPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        const user = await signup({
          name: name.trim() || 'User',
          email: email.trim(),
          role,
          password,
        })

        onAuthSuccess(user)
        navigate('/profile')
      } else if (mode === 'login') {
        const user = await login({
          email: email.trim(),
          password,
        })

        onAuthSuccess(user)
        navigate('/profile')
      } else {
        if (!resetTokenPreview) {
          const result = await requestPasswordReset({ email: email.trim() })
          setResetTokenPreview(result.resetToken)
          setInfo(`Reset code: ${result.resetToken}`)
        } else {
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters.')
          }
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match.')
          }

          await resetPassword({
            email: email.trim(),
            resetToken: resetCode.trim(),
            password,
          })

          setInfo('Password updated. You can log in now.')
          setTimeout(() => navigate('/login'), 700)
        }
      }
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
        <h1>{mode === 'signup' ? 'Join local' : mode === 'reset' ? 'Reset password' : 'Welcome back'}</h1>
        <p>
          {mode === 'reset'
            ? 'Reset your password and get back to the orchard.'
            : 'Buy, barter, sell, and stay connected locally.'}
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">{mode === 'signup' ? 'New account' : mode === 'reset' ? 'Recovery' : 'Login'}</p>
            <h2>{mode === 'signup' ? 'Start using PLUCK' : mode === 'reset' ? 'Reset your account' : 'Sign into your account'}</h2>
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

            <label className="full">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'reset' ? 'Create a new password' : 'Enter your password'}
                required
              />
            </label>

            {mode === 'signup' || mode === 'reset' ? (
              <label className="full">
                Confirm password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </label>
            ) : null}

            {mode === 'reset' && resetTokenPreview ? (
              <label className="full">
                Reset code
                <input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                  placeholder="Paste the reset code"
                  required
                />
              </label>
            ) : null}
          </div>

          {info ? <div className="status-banner success">{info}</div> : null}
          {error ? <div className="status-banner error">{error}</div> : null}

          <div className="action-row auth-action-row">
            <button className="primary" type="submit" disabled={busy}>
              {busy
                ? 'Please wait...'
                : mode === 'signup'
                  ? 'Create account'
                  : mode === 'reset'
                    ? resetTokenPreview
                      ? 'Save new password'
                      : 'Send reset code'
                    : 'Log in'}
            </button>

            {mode === 'login' ? (
              <>
                <button type="button" className="ghost" onClick={() => navigate('/signup')}>
                  Create account
                </button>
                <button type="button" className="text-btn" onClick={() => navigate('/reset-password')}>
                  Forgot password?
                </button>
              </>
            ) : mode === 'signup' ? (
              <button type="button" className="ghost" onClick={() => navigate('/login')}>
                Have an account?
              </button>
            ) : (
              <button type="button" className="ghost" onClick={() => navigate('/login')}>
                Back to login
              </button>
            )}
          </div>
        </div>
      </form>
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
  reviews: ReviewItem[]
  setReviews: Dispatch<SetStateAction<ReviewItem[]>>
  onAuthSuccess: (user: AuthUser) => void
  onLogout: () => void
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
  reviews,
  setReviews,
  onAuthSuccess,
  onLogout,
}: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [draftQuery, setDraftQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [searchFeedback, setSearchFeedback] = useState('')
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
    const q = appliedQuery.trim().toLowerCase()

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
  }, [listings, appliedQuery, activeFilter])

  const showcaseListings = (filtered.length ? filtered : listings).slice(0, 5)
  const leadShowcase = showcaseListings[0] || listings[0] || null
  const sideShowcase = showcaseListings.slice(1, 4)
  const fruitRibbon = showcaseListings.length ? showcaseListings : listings.slice(0, 5)

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id)
    }
  }, [conversations, selectedConversationId])

  async function handleCreate(payload: Omit<Listing, 'id'>) {
    const saved = normalizeListing(await createListing(payload))
    setListings((current) => [saved, ...current])
  }

  async function handleUpdate(payload: Omit<Listing, 'id'>, listingId?: string) {
    if (!listingId) {
      const saved = normalizeListing(await createListing(payload))
      setListings((current) => [saved, ...current])
      return
    }

    const updated = normalizeListing(await updateListing(listingId, payload))
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
    setListings(refreshedListings.map(normalizeListing))
  }

  async function handleConfirmReserve(listing: Listing, pickupWindow: string) {
    const result = await reservePickup({
      listingId: listing.id,
      buyerId: seller.id,
      buyerName: seller.name,
      sellerId: listing.sellerId,
      pickupWindow,
    })

    setListings((current) =>
      current.map((item) => (item.id === listing.id ? normalizeListing(result.listing) : item)),
    )
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

  function handleAddReview(input: { listingId: string; sellerId: string; sellerName: string; rating: number; comment: string }) {
    const review: ReviewItem = {
      id: crypto.randomUUID(),
      listingId: input.listingId,
      sellerId: input.sellerId,
      sellerName: input.sellerName,
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString(),
    }
    setReviews((current) => [review, ...current])
  }

  function isActivePath(path: string) {
    return location.pathname === path
  }

  function describeSearchTarget(raw: string) {
    if (!raw.trim()) return ''
    return /^\d{5}$/.test(raw.trim()) ? `Showing fruit near ${raw.trim()}` : `Showing results for “${raw.trim()}”`
  }

  function submitSearch(targetId = 'listing-feed') {
    const normalized = draftQuery.trim()
    setAppliedQuery(normalized)
    setSearchFeedback(describeSearchTarget(normalized))
    scrollToId(targetId)
  }

  function clearSearch() {
    setDraftQuery('')
    setAppliedQuery('')
    setSearchFeedback('')
  }

  function useNearMe() {
    const fallback = seller.zip || seller.city || seller.locationLabel || ''
    setDraftQuery(fallback)
    setAppliedQuery(fallback)
    setSearchFeedback(describeSearchTarget(fallback))
    goTo('/map', 'map-panel')
  }

  function goTo(path: string, targetId = 'route-start') {
    navigate(path)
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 40)
    })
  }

  function scrollToId(targetId: string) {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const currentMeta = getRouteMeta(location.pathname)
  const currentRouteTheme = routeTheme(location.pathname)

  useEffect(() => {
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById('route-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 20)
    })
  }, [location.pathname])

  return (
    <div className="app-shell">
      <header className={`topbar topbar--slim ${currentRouteTheme}`}>
        <div className="brand-lockup">
          <p className="eyebrow">Pluck orchard market</p>
          <h1>{currentMeta.title}</h1>
          <p className="subtle-copy">
            {currentMeta.subtitle}
          </p>
        </div>
        <div className="topbar-actions">
          {!authUser ? (
            <>
              <button className="ghost" onClick={() => goTo('/login')}>
                Log in
              </button>
              <button className="primary" onClick={() => goTo('/signup')}>
                Create account
              </button>
            </>
          ) : (
            <>
              <button className="ghost" onClick={() => goTo('/favorites')}>
                Saved {favoriteListings.length ? `(${favoriteListings.length})` : ''}
              </button>
              <button className="ghost" onClick={() => goTo('/alerts')}>
                Alerts {unreadNotifications.length ? `(${unreadNotifications.length})` : ''}
              </button>
              <button className="ghost" onClick={() => goTo('/profile')}>
                Profile
              </button>
              <button className="ghost" onClick={onLogout}>
                Log out
              </button>
              <button className="primary" onClick={() => goTo('/store/new')}>
                + New listing
              </button>
            </>
          )}
        </div>
      </header>

      {leadShowcase ? (
        <section className="cinematic-hero">
          <div className="cinematic-backdrop">
            <img src={leadShowcase.image} alt={leadShowcase.title} />
            <div className="cinematic-overlay">
              <p className="eyebrow eyebrow--light">Pluck orchard market</p>
              <h2>{leadShowcase.title}</h2>
              <p>Backyard harvests, orchard trust, and quick pickup plans—all surfaced in one beautiful place.</p>
              <div className="cinematic-pill-row">
                <span className="cinematic-pill">{leadShowcase.fruit}</span>
                <span className="cinematic-pill">${leadShowcase.price}/{leadShowcase.unit}</span>
                <span className="cinematic-pill">{prettyLocation(leadShowcase)}</span>
                {leadShowcase.sellerRating ? <span className="cinematic-pill">★ {leadShowcase.sellerRating.toFixed(1)}</span> : null}
              </div>
              <div className="hero-cta-row">
                <button className="primary" onClick={() => scrollToId('live-picks')}>
                  Shop featured fruit
                </button>
                <button className="ghost ghost--light" onClick={() => goTo('/map', 'map-panel')}>
                  Explore nearby map
                </button>
              </div>
            </div>
          </div>

          <div className="cinematic-side-rail">
            {(sideShowcase.length ? sideShowcase : listings.slice(1, 4)).slice(0, 3).map((item) => (
              <button className="cinematic-fruit-card cinematic-link-card" key={item.id} onClick={() => goTo('/listing/' + item.id)}>
                <img src={item.image} alt={item.title} />
                <div className="cinematic-fruit-card-copy">
                  <strong>{item.title}</strong>
                  <span>${item.price}/{item.unit}</span>
                  <TrustStrip listing={item} />
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {leadShowcase ? (
        <section id="live-picks" className="hero-live-grid">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">Live orchard picks</p>
              <h2>Tap any fruit to open the real listing.</h2>
            </div>
            <span className="section-meta">{fruitRibbon.length} live now</span>
          </div>

          <div className="hero-live-grid__cards">
            {fruitRibbon.slice(0, 6).map((item) => (
              <button className="hero-live-card cinematic-link-card" key={item.id} onClick={() => goTo('/listing/' + item.id)}>
                <img src={item.image} alt={item.title} />
                <div className="hero-live-card__overlay">
                  <span className="hero-live-card__kicker">{item.harvestLabel || item.distance || 'Fresh nearby'}</span>
                  <strong>{item.title}</strong>
                  <span>
                    ${item.price}/{item.unit} • {item.city || item.location}
                  </span>
                  <TrustStrip listing={item} />
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {fruitRibbon.length ? (
        <section className="fruit-ribbon">
          {fruitRibbon.map((item) => (
            <button className="fruit-ribbon-card cinematic-link-card" key={item.id} onClick={() => goTo('/listing/' + item.id)}>
              <img src={item.image} alt={item.title} />
              <div>
                <strong>{item.title}</strong>
                <span>
                  ${item.price}/{item.unit} • {item.city || item.location}
                </span>
                <TrustStrip listing={item} />
              </div>
            </button>
          ))}
        </section>
      ) : null}

      <div className="search-wrap search-wrap--floating">
        <div className="search-form-row search-form-row--premium">
          <input
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitSearch(isActivePath('/map') ? 'map-panel' : 'listing-feed')
              }
            }}
            placeholder="Search fruit, growers, city, state, or ZIP... Press Enter to search."
          />
          <div className="search-action-stack">
            <button className="search-submit" onClick={() => submitSearch(isActivePath('/map') ? 'map-panel' : 'listing-feed')}>
              Search
            </button>
            <button className="ghost compact-btn" onClick={clearSearch}>
              Clear
            </button>
          </div>
        </div>
        <div className="search-meta-row">
          <p className="search-hint">Type what you want, then press Enter or tap Search to jump to the matching fruit below.</p>
          <button className="ghost compact-btn" onClick={useNearMe}>Near me</button>
        </div>
        {searchFeedback ? <div className="search-feedback-pill">{searchFeedback}</div> : null}
        {appliedQuery ? <div className="search-applied-copy">Live search locked in for <strong>{appliedQuery}</strong></div> : null}

        <div className="search-bottom-row">
          <div className="toggle-row">
            <button className={isActivePath('/') ? 'toggle active' : 'toggle'} onClick={() => goTo('/', 'listing-feed')}>
              List
            </button>
            <button className={isActivePath('/map') ? 'toggle active' : 'toggle'} onClick={() => goTo('/map', 'map-panel')}>
              Map
            </button>
          </div>

          <div className="filter-chip-row">
            {quickFilters.map((filter) => (
              <button
                key={filter.key}
                className={activeFilter === filter.key ? 'filter-chip active' : 'filter-chip'}
                onClick={() => { setActiveFilter(filter.key); setTimeout(() => scrollToId('listing-feed'), 30) }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section id="route-start" className={`route-intro-card ${currentRouteTheme}`}>
        <div>
          <p className="eyebrow">{currentMeta.eyebrow}</p>
          <h2>{currentMeta.title}</h2>
          <p>{currentMeta.subtitle}</p>
        </div>
        <div className="route-intro-actions">
          <button className="ghost" onClick={() => goTo('/map', 'map-panel')}>Open map</button>
          <button className="primary" onClick={() => scrollToId('listing-feed')}>Browse fruit</button>
        </div>
      </section>

      <main id="listing-feed" className="content">
        <Routes>
          <Route path="/login" element={<AuthShell mode="login" onAuthSuccess={onAuthSuccess} />} />
          <Route path="/signup" element={<AuthShell mode="signup" onAuthSuccess={onAuthSuccess} />} />
          <Route path="/reset-password" element={<AuthShell mode="reset" onAuthSuccess={onAuthSuccess} />} />

          <Route
            path="/"
            element={
              <>
                <section className="hero-card hero-card--gallery">
                  <div className="hero-card-copy">
                    <p className="eyebrow">Curated fruit edit</p>
                    <h2>Fresh picks worth opening, saving, and reserving.</h2>
                    <p>Discover local fruit with richer photos, clearer trust, and faster pickup moves.</p>
                  </div>
                  <div className="hero-card-gallery">
                    {(fruitRibbon.length ? fruitRibbon : listings.slice(0, 4)).slice(0, 4).map((item) => (
                      <button className="hero-fruit-tile" key={item.id} onClick={() => goTo('/listing/' + item.id)}>
                        <img src={item.image} alt={item.title} />
                        <span>{item.fruit}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {unreadNotifications.length ? (
                  <section className="signal-strip">
                    {unreadNotifications.slice(0, 2).map((item) => (
                      <button className="signal-pill" key={item.id} onClick={() => goTo('/alerts')}>
                        {item.title}
                      </button>
                    ))}
                  </section>
                ) : null}

                <section className="section-heading">
                  <div>
                    <p className="eyebrow">Featured near you</p>
                    <h2>Beautiful fruit worth opening</h2>
                  </div>
                  <span className="section-meta">{filtered.length} listings</span>
                </section>

                <section className="grid">
                  {filtered.map((item) => {
                    const isFavorite = favoriteListingIds.has(item.id)
                    const isFollowing = followingSellerIds.has(item.sellerId)

                    return (
                      <article className="card premium-card listing-card-v2" key={item.id}>
                        <button className="card-image-wrap card-image-button" onClick={() => goTo('/listing/' + item.id)}>
                          <img src={item.image} alt={item.title} />
                          <span className="card-badge">{item.distance}</span>
                        </button>
                        <div className="card-body">
                          <div className="price-row">
                            <button className="listing-title-link" onClick={() => goTo('/listing/' + item.id)}>{item.title}</button>
                            <span>
                              ${item.price}/{item.unit}
                            </span>
                          </div>

                          <div className="listing-badge-row">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.freshnessLabel ? <span className="trust-pill freshness">{item.freshnessLabel}</span> : null}
                            {item.availabilityLabel ? <span className="trust-pill available">{item.availabilityLabel}</span> : null}
                          </div>

                          <p className="meta">
                            {prettyLocation(item)} • {item.inventory} left
                          </p>

                          <button className="seller-inline-link" onClick={() => navigate('/grower/' + item.sellerId)}>
                            {item.sellerVerified ? '✓ ' : ''}
                            {sellerLabel(item)}
                          </button>

                          <TrustStrip listing={item} />

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
                            <button className="ghost fill-btn" onClick={() => goTo('/listing/' + item.id)}>
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
                    <button className="activity-card activity-card--live" key={item.id} onClick={() => goTo('/listing/' + item.id)}>
                      <img src={item.image} alt={item.title} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>
                          {prettyLocation(item)} • ${item.price}/{item.unit}
                        </p>
                      </div>
                    </button>
                  ))}
                </section>
              </>
            }
          />

          <Route
            path="/map"
            element={
              <section id="map-panel" className="map-panel">
                <div className="map-fallback premium-map">
                  <div className="map-header-row">
                    <div>
                      <p className="eyebrow">Discovery map</p>
                      <h3>Location-first neighborhood browsing</h3>
                    </div>
                    <button className="ghost" onClick={() => goTo('/store/new')}>
                      Add your harvest
                    </button>
                  </div>

                  <p>
                    Zoom into any neighborhood, type a ZIP to recenter the map, and open live fruit listings directly from the pins or the list below.
                  </p>

                  <div className="leaflet-map-panel">
                    <LeafletMapView
                      listings={filtered}
                      searchQuery={appliedQuery}
                      onOpenListing={(listingId) => navigate('/listing/' + listingId)}
                    />
                  </div>

                  <div className="map-support-row">
                    <div className="map-support-copy">
                      <strong>Search any ZIP, city, or neighborhood</strong>
                      <span>The map now recenters to the place you typed, then keeps the nearby fruit cards underneath in sync.</span>
                    </div>
                    <button className="ghost" onClick={() => scrollToId('listing-feed')}>
                      Jump to matching fruit
                    </button>
                  </div>

                  <div className="pin-list premium-pin-list">
                    {filtered.map((item) => (
                      <button className="pin-row premium-pin-row premium-pin-button" key={item.id} onClick={() => navigate('/listing/' + item.id)}>
                        <div>
                          <strong>{item.fruit}</strong>
                          <p>
                            {item.title} • {prettyLocation(item)}
                          </p>
                          <div className="listing-badge-row">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.sellerVerified ? <span className="trust-pill verified">Verified grower</span> : null}
                            {hasGeo(item) ? <span className="trust-pill available">Map ready</span> : null}
                          </div>
                        </div>
                        <span>
                          ${item.price}/{item.unit}
                        </span>
                      </button>
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
                reviews={reviews}
                onAddReview={handleAddReview}
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
                          <TrustStrip listing={item} />
                        </div>
                        <button className="ghost" onClick={() => goTo('/listing/' + item.id)}>
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-panel">Save fruit you want to revisit and it will land here.</div>
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
                          <TrustStrip listing={item} />
                        </div>
                        <div className="listing-row-actions">
                          <button className="ghost" onClick={() => goTo('/listing/' + item.id)}>
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
                  <div className="empty-panel">Add your first harvest and your storefront listings will appear here.</div>
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
                    <div className="empty-panel">Your active inventory will show up here once you publish a harvest.</div>
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
                      <button className="primary" onClick={() => goTo('/signup')}>
                        Create account
                      </button>
                      <button className="ghost" onClick={() => goTo('/login')}>
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
                      <div className="metric-chip">{memberSinceLabel(seller)}</div>
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
                      <button className="ghost" onClick={() => navigate('/store/listings')}>
                        Manage listings
                      </button>
                      <button className="ghost" onClick={() => navigate('/store/new')}>
                        Add new listing
                      </button>
                      <button className="ghost" onClick={onLogout}>
                        Log out
                      </button>
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
        <NavLink to="/map" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Map
        </NavLink>
        <NavLink to="/board" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Board
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Messages
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
  const [listings, setListings] = useState<Listing[]>([])
  const [seller, setSeller] = useState<SellerProfile>(fallbackSeller)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [follows, setFollows] = useState<Follow[]>([])
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const raw = window.localStorage.getItem('pluck-auth-user')
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  })
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const raw = window.localStorage.getItem('pluck-reviews')
      return raw ? (JSON.parse(raw) as ReviewItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    getListings()
      .then((data) => setListings(data.map(normalizeListing)))
      .catch(() => setListings(fallbackListings))

    getSeller().then(setSeller).catch(() => setSeller(fallbackSeller))
    getFavorites().then(setFavorites).catch(() => setFavorites([]))
    getConversations().then(setConversations).catch(() => setConversations([]))
    getSocialPosts().then(setSocialPosts).catch(() => setSocialPosts([]))
    getNotifications().then(setNotifications).catch(() => setNotifications([]))
    getAlerts().then(setAlerts).catch(() => setAlerts([]))
    getFollows('me').then(setFollows).catch(() => setFollows([]))
  }, [])

  useEffect(() => {
    try {
      if (authUser) {
        window.localStorage.setItem('pluck-auth-user', JSON.stringify(authUser))
      } else {
        window.localStorage.removeItem('pluck-auth-user')
      }
    } catch {}
  }, [authUser])

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
      reviews={reviews}
      setReviews={setReviews}
      onAuthSuccess={setAuthUser}
      onLogout={() => setAuthUser(null)}
    />
  )
}

export default App