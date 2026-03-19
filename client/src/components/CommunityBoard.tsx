import { useState } from 'react'

type Post = {
  id: string
  title: string
  body: string
  category: string
  location: string
}

export default function CommunityBoard() {
  const [posts, setPosts] = useState<Post[]>([
    { id: '1', title: 'Need help picking oranges', body: 'Saturday morning. Will trade fruit.', category: 'Grow & share', location: 'Pasadena' },
    { id: '2', title: 'Extra figs this week', body: 'Come by before Sunday. Happy to swap.', category: 'Trade & help', location: 'Glendale' },
    { id: '3', title: 'Weekend harvest table', body: 'Bring what is ripe. Help set up at 8am.', category: 'Local event', location: 'Highland Park' },
  ])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Grow & share')

  function createPost() {
    if (!title.trim()) return
    setPosts([
      { id: Date.now().toString(), title: title.trim(), body: body.trim() || 'Fresh note from the neighborhood.', category, location: 'Local' },
      ...posts,
    ])
    setTitle('')
    setBody('')
    setCategory('Grow & share')
  }

  return (
    <section className="board-page stack">
      <div className="board-hero card">
        <p className="eyebrow">Community board</p>
        <h2>Grow a seed. Make a friend.</h2>
        <p>Trade, volunteer, organize, and keep local life moving.</p>
      </div>

      <div className="board-create card">
        <div className="board-create-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Grow & share</option>
            <option>Trade & help</option>
            <option>Local event</option>
            <option>Needs volunteers</option>
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is happening?" />
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Keep it short, clear, and local." rows={3} />
        <div className="board-actions action-row">
          <button className="primary" onClick={createPost}>Post it</button>
          <span className="board-note">For the neighborhood. For the everyman.</span>
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
