import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { createListing, getListings, getMessages, getSeller } from './api'
import type { Listing, Message, SellerProfile } from './types'

type Tab = 'home' | 'map' | 'favorites' | 'messages' | 'store' | 'profile'
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
    location: 'Mission Hills',
    distance: '0.8 mi',
    inventory: 7,
    sellerId: 's1',
    sellerName: 'Elena',
    description: 'Picked this morning. Sweet, juicy, and ideal for snacking or fresh juice.',
    pickupWindows: ['Today 5–7 PM', 'Tomorrow 9–11 AM'],
    isFavorite: true,
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
  },
  {
    id: '3',
    title: 'Persimmon Porch Basket',
    fruit: 'Persimmons',
    price: 8,
    unit: 'basket',
    image:
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=1200&q=80',
    location: 'Northridge',
    distance: '2.4 mi',
    inventory: 4,
    sellerId: 's3',
    sellerName: 'Jules',
    description: 'Honey-sweet persimmons from a mature backyard tree, packed for quick pickup.',
    pickupWindows: ['Tomorrow 8–10 AM', 'Sunday 4–6 PM'],
  },
]

const fallbackMessages: Message[] = [
  {
    id: 'm1',
    listingId: '1',
    sellerName: 'Elena',
    preview: 'Yes, I can hold two bags until 6 PM.',
    updatedAt: '2h ago',
  },
  {
    id: 'm2',
    listingId: '2',
    sellerName: 'Marco',
    preview: 'Pickup near the front gate works for me.',
    updatedAt: 'Yesterday',
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
}

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
}

const quickFilters: { key: QuickFilter; label: string }[] = [
  { key: 'all', label: 'All harvests' },
  { key: 'just-added', label: 'Just added' },
  { key: 'under-5', label: 'Under $5' },
  { key: 'citrus', label: 'Citrus' },
  { key: 'high-stock', label: 'High stock' },
]

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all')
  const [listings, setListings] = useState<Listing[]>(fallbackListings)
  const [messages, setMessages] = useState<Message[]>(fallbackMessages)
  const [seller, setSeller] = useState<SellerProfile>(fallbackSeller)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState<ListingFormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  useEffect(() => {
    getListings().then(setListings).catch(() => setListings(fallbackListings))
    getMessages().then(setMessages).catch(() => setMessages(fallbackMessages))
    getSeller().then(setSeller).catch(() => setSeller(fallbackSeller))
  }, [])

  const myListings = useMemo(
    () => listings.filter((item) => item.sellerName === seller.name),
    [listings, seller.name],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    let result = listings.filter((item) =>
      [item.title, item.fruit, item.location, item.sellerName, item.description]
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

  const favorites = listings.filter((item) => item.isFavorite)
  const justAdded = listings.filter((item) => item.distance === 'Just added')
  const totalInventory = myListings.reduce((sum, item) => sum + item.inventory, 0)
  const averagePrice =
    myListings.length > 0
      ? (
          myListings.reduce((sum, item) => sum + item.price, 0) / myListings.length
        ).toFixed(2)
      : '0.00'

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

  function openCreateListing() {
    setTab('home')
    setShowCreateForm(true)
    setSaveError('')
    setSaveSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleCreateListing(e: FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const pickupWindows = [form.pickup1, form.pickup2].map((x) => x.trim()).filter(Boolean)

      const payload: Omit<Listing, 'id'> = {
        title: form.title.trim() || `${form.fruit.trim()} Listing`,
        fruit: form.fruit.trim() || 'Fruit',
        price: Number(form.price) || 0,
        unit: form.unit.trim() || 'basket',
        image:
          form.imagePreview ||
          'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
        location: form.location.trim() || 'Mission Hills',
        distance: 'Just added',
        inventory: Number(form.inventory) || 1,
        sellerId: seller.id,
        sellerName: seller.name,
        description: form.description.trim() || 'Fresh local fruit available for pickup.',
        pickupWindows: pickupWindows.length ? pickupWindows : ['Pickup by message'],
        isFavorite: false,
      }

      const saved = await createListing(payload)
      setListings((current) => [saved, ...current])
      setForm(emptyForm)
      setShowCreateForm(false)
      setTab('store')
      setSaveSuccess('Listing created successfully.')
    } catch (error) {
      setSaveError('Unable to save listing right now.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Pluck</p>
          <h1>Fresh fruit from neighbors</h1>
          <p className="subtle-copy">
            A beautifully local marketplace for backyard harvests, same-day pickup, and neighborhood discovery.
          </p>
        </div>
        <div className="topbar-actions">
          <button className="ghost">Mission Hills</button>
          <button className="primary" onClick={openCreateListing}>
            + New listing
          </button>
        </div>
      </header>

      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">Refined neighborhood commerce</p>
          <h2>Turn extra fruit into a polished local marketplace experience.</h2>
          <p>
            Pluck is evolving into a premium neighborhood product: stronger seller presence, tighter cards,
            better listing quality, and a cleaner path from harvest to pickup.
          </p>
          <div className="hero-cta-row">
            <button className="primary" onClick={openCreateListing}>
              Create premium listing
            </button>
            <button className="ghost" onClick={() => setTab('map')}>
              Explore nearby map
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Nearby listings</span>
            <strong>{listings.length}</strong>
          </div>
          <div className="stat-card">
            <span>Saved items</span>
            <strong>{favorites.length}</strong>
          </div>
          <div className="stat-card">
            <span>Your inventory</span>
            <strong>{totalInventory}</strong>
          </div>
          <div className="stat-card">
            <span>Inbox threads</span>
            <strong>{messages.length}</strong>
          </div>
        </div>
      </section>

      <div className="search-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search oranges, avocados, lemons, neighborhoods..."
        />

        <div className="search-bottom-row">
          <div className="toggle-row">
            <button className={tab === 'home' ? 'toggle active' : 'toggle'} onClick={() => setTab('home')}>
              List
            </button>
            <button className={tab === 'map' ? 'toggle active' : 'toggle'} onClick={() => setTab('map')}>
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
        {(tab === 'home' || tab === 'map') && (
          <>
            <section className="hero-card">
              <div>
                <p className="eyebrow">Today nearby</p>
                <h2>Backyard harvests, same-day pickup</h2>
                <p>Browse fruit from local growers, reserve by message, and coordinate a clear pickup window.</p>
              </div>
              <button className="primary" onClick={() => setShowCreateForm((v) => !v)}>
                {showCreateForm ? 'Close form' : 'Create listing'}
              </button>
            </section>

            {showCreateForm && (
              <section className="stack form-stack premium-form-shell">
                <div className="form-header">
                  <div>
                    <p className="eyebrow">New listing</p>
                    <h2>Create a premium fruit listing</h2>
                    <p>
                      Better titles, cleaner imagery, and clearer pickup windows produce a more credible listing.
                    </p>
                  </div>
                </div>

                <form className="listing-form" onSubmit={handleCreateListing}>
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
                      Location
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

                    <label className="full upload-zone">
                      Upload photo
                      <input type="file" accept="image/*" onChange={handleImageUpload} />
                      <span className="upload-hint">Choose a fruit photo from your device for instant preview.</span>
                    </label>

                    {form.imagePreview && (
                      <div className="image-preview-wrap full">
                        <img className="image-preview" src={form.imagePreview} alt="Preview" />
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => updateForm('imagePreview', '')}
                        >
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
                      {isSaving ? 'Saving...' : 'Save listing'}
                    </button>
                    <button type="button" className="ghost" onClick={() => setForm(emptyForm)} disabled={isSaving}>
                      Reset
                    </button>
                  </div>
                </form>
              </section>
            )}
          </>
        )}

        {tab === 'home' && (
          <>
            <section className="section-heading">
              <div>
                <p className="eyebrow">Featured near you</p>
                <h2>Beautiful local harvests</h2>
              </div>
              <span className="section-meta">{filtered.length} listings</span>
            </section>

            <section className="grid">
              {filtered.map((item) => (
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
                    <p className="meta">
                      {item.location} · {item.inventory} left · {item.sellerName}
                    </p>
                    <p className="desc">{item.description}</p>
                    <div className="pill-row">
                      {item.pickupWindows.map((slot) => (
                        <span className="pill" key={slot}>
                          {slot}
                        </span>
                      ))}
                    </div>
                    <div className="action-row">
                      <button className="primary">Message seller</button>
                      <button className="ghost">Save</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

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
                      {item.location} · ${item.price}/{item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === 'map' && (
          <section className="map-panel">
            <div className="map-fallback premium-map">
              <div className="map-header-row">
                <div>
                  <p className="eyebrow">Discovery map</p>
                  <h3>Location-first neighborhood browsing</h3>
                </div>
                <button className="ghost" onClick={openCreateListing}>
                  Add your harvest
                </button>
              </div>
              <p>
                This is the refined map state. The next layer will be real pins, neighborhoods, and distance-based discovery.
              </p>
              <div className="pin-list">
                {filtered.map((item) => (
                  <div className="pin-row premium-pin-row" key={item.id}>
                    <div>
                      <strong>{item.fruit}</strong>
                      <p>
                        {item.title} · {item.location}
                      </p>
                    </div>
                    <span>
                      ${item.price}/{item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === 'favorites' && (
          <section className="stack">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Saved for later</p>
                <h2>Favorites</h2>
              </div>
              <span className="section-meta">{favorites.length} saved</span>
            </div>

            {favorites.length ? (
              favorites.map((item) => (
                <div className="mini-card premium-mini-card" key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <div className="mini-card-copy">
                    <strong>{item.title}</strong>
                    <p>
                      {item.location} · ${item.price}/{item.unit}
                    </p>
                    <span>{item.pickupWindows[0]}</span>
                  </div>
                  <button className="ghost">View</button>
                </div>
              ))
            ) : (
              <p>No saved listings yet.</p>
            )}
          </section>
        )}

        {tab === 'messages' && (
          <section className="stack">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Conversations</p>
                <h2>Inbox</h2>
              </div>
              <span className="section-meta">{messages.length} threads</span>
            </div>

            {messages.map((msg) => (
              <div className="thread premium-thread" key={msg.id}>
                <div>
                  <strong>{msg.sellerName}</strong>
                  <p>{msg.preview}</p>
                </div>
                <span>{msg.updatedAt}</span>
              </div>
            ))}
          </section>
        )}

        {tab === 'store' && (
          <section className="stack">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Seller dashboard</p>
                <h2>My Store</h2>
              </div>
              <button className="primary" onClick={openCreateListing}>
                New listing
              </button>
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

            <div className="hero-card compact">
              <div>
                <p className="eyebrow">Seller tools</p>
                <h3>Inventory, pickup windows, and listing creation</h3>
              </div>
              <button className="ghost" onClick={openCreateListing}>
                Open form
              </button>
            </div>

            {myListings.length ? (
              myListings.map((item) => (
                <div className="thread premium-thread" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.inventory} left · {item.pickupWindows[0]}
                    </p>
                  </div>
                  <button className="ghost">Edit</button>
                </div>
              ))
            ) : (
              <p>You do not have any listings yet.</p>
            )}
          </section>
        )}

        {tab === 'profile' && (
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

            <div className="dashboard-stats profile-stats">
              <div className="dashboard-card">
                <span>Listings</span>
                <strong>{myListings.length}</strong>
              </div>
              <div className="dashboard-card">
                <span>Favorites</span>
                <strong>{favorites.length}</strong>
              </div>
              <div className="dashboard-card">
                <span>Messages</span>
                <strong>{messages.length}</strong>
              </div>
            </div>

            <div className="action-row">
              <button className="ghost">Upload profile photo</button>
              <button className="ghost">Upload lead fruit photo</button>
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={tab === 'home' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('home')}>
          Home
        </button>
        <button
          className={tab === 'favorites' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('favorites')}
        >
          Favorites
        </button>
        <button
          className={tab === 'messages' ? 'nav-item active' : 'nav-item'}
          onClick={() => setTab('messages')}
        >
          Messages
        </button>
        <button className={tab === 'store' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('store')}>
          My Store
        </button>
        <button className={tab === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('profile')}>
          Profile
        </button>
      </nav>
    </div>
  )
}

export default App