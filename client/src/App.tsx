import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getListings, getMessages, getSeller } from './api'
import type { Listing, Message, SellerProfile } from './types'

type Tab = 'home' | 'map' | 'favorites' | 'messages' | 'store' | 'profile'

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
    description: 'Picked this morning. Sweet, juicy, and perfect for juice or snacks.',
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
    description: 'Bright and floral. Great for cooking, cocktails, and lemon bars.',
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
    description: 'Soft, honey-sweet persimmons from a mature backyard tree.',
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
    'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80',
}

type ListingFormState = {
  title: string
  fruit: string
  price: string
  unit: string
  image: string
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
  image: '',
  location: 'Mission Hills',
  inventory: '',
  description: '',
  pickup1: '',
  pickup2: '',
}

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [query, setQuery] = useState('')
  const [listings, setListings] = useState<Listing[]>(fallbackListings)
  const [messages, setMessages] = useState<Message[]>(fallbackMessages)
  const [seller, setSeller] = useState<SellerProfile>(fallbackSeller)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState<ListingFormState>(emptyForm)

  useEffect(() => {
    getListings().then(setListings).catch(() => setListings(fallbackListings))
    getMessages().then(setMessages).catch(() => setMessages(fallbackMessages))
    getSeller().then(setSeller).catch(() => setSeller(fallbackSeller))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return listings
    return listings.filter((item) =>
      [item.title, item.fruit, item.location, item.sellerName]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [listings, query])

  const favorites = listings.filter((item) => item.isFavorite)

  function updateForm<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleCreateListing(e: FormEvent) {
    e.preventDefault()

    const pickupWindows = [form.pickup1, form.pickup2].map((x) => x.trim()).filter(Boolean)

    const nextListing: Listing = {
      id: crypto.randomUUID(),
      title: form.title.trim() || `${form.fruit.trim()} Listing`,
      fruit: form.fruit.trim() || 'Fruit',
      price: Number(form.price) || 0,
      unit: form.unit.trim() || 'basket',
      image:
        form.image.trim() ||
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

    setListings((current) => [nextListing, ...current])
    setForm(emptyForm)
    setShowCreateForm(false)
    setTab('store')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Pluck</p>
          <h1>Fresh fruit from neighbors</h1>
        </div>
        <button className="ghost">Mission Hills</button>
      </header>

      <div className="search-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search oranges, avocados, lemons..."
        />
        <div className="toggle-row">
          <button className={tab === 'home' ? 'toggle active' : 'toggle'} onClick={() => setTab('home')}>
            List
          </button>
          <button className={tab === 'map' ? 'toggle active' : 'toggle'} onClick={() => setTab('map')}>
            Map
          </button>
        </div>
      </div>

      <main className="content">
        {(tab === 'home' || tab === 'map') && (
          <>
            <section className="hero-card">
              <div>
                <p className="eyebrow">Today nearby</p>
                <h2>Backyard harvests, same-day pickup</h2>
                <p>Browse fruit from local growers, reserve by message, and coordinate an easy pickup window.</p>
              </div>
              <button className="primary" onClick={() => setShowCreateForm((v) => !v)}>
                {showCreateForm ? 'Close form' : 'Create listing'}
              </button>
            </section>

            {showCreateForm && (
              <section className="stack form-stack">
                <div className="form-header">
                  <div>
                    <p className="eyebrow">New listing</p>
                    <h2>Create a fruit listing</h2>
                  </div>
                </div>

                <form className="listing-form" onSubmit={handleCreateListing}>
                  <div className="form-grid">
                    <label>
                      Title
                      <input
                        value={form.title}
                        onChange={(e) => updateForm('title', e.target.value)}
                        placeholder="Sweet backyard avocados"
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

                    <label className="full">
                      Image URL
                      <input
                        value={form.image}
                        onChange={(e) => updateForm('image', e.target.value)}
                        placeholder="Paste an image URL"
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

                  <div className="action-row">
                    <button type="submit" className="primary">
                      Save listing
                    </button>
                    <button type="button" className="ghost" onClick={() => setForm(emptyForm)}>
                      Reset
                    </button>
                  </div>
                </form>
              </section>
            )}
          </>
        )}

        {tab === 'home' && (
          <section className="grid">
            {filtered.map((item) => (
              <article className="card" key={item.id}>
                <img src={item.image} alt={item.title} />
                <div className="card-body">
                  <div className="price-row">
                    <h3>{item.title}</h3>
                    <span>
                      ${item.price}/{item.unit}
                    </span>
                  </div>
                  <p className="meta">
                    {item.location} · {item.distance} · {item.inventory} left
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
        )}

        {tab === 'map' && (
          <section className="map-panel">
            <div className="map-fallback">
              <h3>Google Maps-ready discovery</h3>
              <p>Add a Maps API key later. For now, this clean fallback shows nearby inventory in a map-first style.</p>
              <div className="pin-list">
                {filtered.map((item) => (
                  <div className="pin-row" key={item.id}>
                    <strong>{item.fruit}</strong>
                    <span>{item.location}</span>
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
            <h2>Saved listings</h2>
            {favorites.length ? (
              favorites.map((item) => (
                <div className="mini-card" key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.location} · ${item.price}/{item.unit}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p>No saved listings yet.</p>
            )}
          </section>
        )}

        {tab === 'messages' && (
          <section className="stack">
            <h2>Inbox</h2>
            {messages.map((msg) => (
              <div className="thread" key={msg.id}>
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
            <h2>My Store</h2>
            <div className="hero-card compact">
              <div>
                <p className="eyebrow">Seller tools</p>
                <h3>Inventory, pickup windows, and listing creation</h3>
              </div>
              <button className="primary" onClick={() => setShowCreateForm(true)}>
                New listing
              </button>
            </div>
            {listings
              .filter((item) => item.sellerName === seller.name)
              .map((item) => (
                <div className="thread" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.inventory} left · {item.pickupWindows[0]}
                    </p>
                  </div>
                  <button className="ghost">Edit</button>
                </div>
              ))}
          </section>
        )}

        {tab === 'profile' && (
          <section className="profile-card">
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
