import { useState } from 'react'

type BoardPost = {
  id: string
  title: string
  body: string
  category: string
  location: string
}

const seedPosts: BoardPost[] = [
  { id: '1', title: 'Need help picking oranges', body: 'Saturday morning. Fruit trade welcome.', category: 'Grow & Share', location: 'Pasadena' },
  { id: '2', title: 'Extra figs this week', body: 'Come by before Sunday. Happy to swap.', category: 'Trade & Help', location: 'Glendale' },
  { id: '3', title: 'Community table this weekend', body: 'Bring what is ripe. Take what you need.', category: 'Local Event', location: 'Highland Park' },
]

export default function CommunityBoard() {
  const [posts, setPosts] = useState<BoardPost[]>(seedPosts)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Grow & Share')

  function createPost() {
    if (!title.trim()) return
    setPosts([{ id: String(Date.now()), title: title.trim(), body: body.trim() || 'Fresh signal from the neighborhood.', category, location: 'Local' }, ...posts])
    setTitle('')
    setBody('')
    setCategory('Grow & Share')
  }

  return (
    <section className="stack board-shell">
      <div className="board-hero">
        <p className="eyebrow">Community board</p>
        <h2>Grow a seed. Make a friend.</h2>
        <p>Post events, barter needs, volunteer asks, and neighborhood signal.</p>
      </div>
      <div className="board-create">
        <div className="board-create-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Grow & Share</option>
            <option>Trade & Help</option>
            <option>Local Event</option>
            <option>Needs Volunteers</option>
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is happening?" />
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Keep it short, clear, and local." rows={3} />
        <div className="action-row board-actions">
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
