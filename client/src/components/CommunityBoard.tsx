import { useState } from 'react'

type Post = {
  id: string
  title: string
  body: string
  category: string
  location: string
}

const starterPosts: Post[] = [
  {
    id: '1',
    title: 'Need two hands for citrus picking',
    body: 'Saturday morning. Fruit trade welcome.',
    category: 'Grow & share',
    location: 'Pasadena',
  },
  {
    id: '2',
    title: 'Extra figs this week',
    body: 'Pick up before Sunday. Happy to swap.',
    category: 'Trade & help',
    location: 'Glendale',
  },
  {
    id: '3',
    title: 'Street-side harvest table this weekend',
    body: 'Small neighborhood setup. Bring what is ripe.',
    category: 'Local event',
    location: 'Highland Park',
  },
]

export default function CommunityBoard() {
  const [posts, setPosts] = useState<Post[]>(starterPosts)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [category, setCategory] = useState('Grow & share')

  function handlePost() {
    if (!title.trim()) return
    setPosts([
      {
        id: String(Date.now()),
        category,
        location: 'Local',
        title: title.trim(),
        body: details.trim() || 'Fresh note from the neighborhood.',
      },
      ...posts,
    ])
    setTitle('')
    setDetails('')
    setCategory('Grow & share')
  }

  return (
    <section className="stack board-shell">
      <div className="board-hero">
        <p className="eyebrow">Local board</p>
        <h2>Grow a seed. Make a friend.</h2>
        <p>Post events, barter needs, volunteer asks, and neighborhood signal.</p>
      </div>

      <div className="board-create">
        <div className="board-create-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Grow & share</option>
            <option>Trade & help</option>
            <option>Local event</option>
            <option>Needs volunteers</option>
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is happening?" />
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Keep it short, clear, and local."
          rows={3}
        />
        <div className="action-row board-actions">
          <button className="primary" onClick={handlePost}>
            Post it
          </button>
          <span className="board-note">For the everyman. For the neighborhood.</span>
        </div>
      </div>

      <div className="board-grid">
        {posts.map((post) => (
          <article className="board-card" key={post.id}>
            <div className="board-card-top">
              <span className="board-chip">{post.category}</span>
              <span className="board-location">{post.location}</span>
            </div>
            <h3>{post.title}</h3>
            <p>{post.body}</p>
            <button className="ghost">Reply</button>
          </article>
        ))}
      </div>
    </section>
  )
}
