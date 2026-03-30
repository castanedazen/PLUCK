import { useState } from 'react'

type BoardReply = {
  id: string
  author: string
  body: string
}

type BoardPost = {
  id: string
  title: string
  body: string
  category: string
  location: string
  replies: BoardReply[]
}

const seedPosts: BoardPost[] = [
  {
    id: '1',
    title: 'Need two hands for citrus picking',
    body: 'Saturday morning. Fruit trade welcome. Gloves and ladders covered.',
    category: 'Grow & share',
    location: 'Pasadena',
    replies: [{ id: 'r1', author: 'Maya', body: 'I can help from 9 to noon.' }],
  },
  {
    id: '2',
    title: 'Extra figs this week',
    body: 'Pick up before Sunday. Happy to swap for lemons or avocados.',
    category: 'Trade & help',
    location: 'Glendale',
    replies: [],
  },
  {
    id: '3',
    title: 'Pop-up harvest table this weekend',
    body: 'Small neighborhood stand on Sunday. Bring what is ripe and priced to move.',
    category: 'Local event',
    location: 'Highland Park',
    replies: [],
  },
]

export default function CommunityBoard() {
  const [posts, setPosts] = useState<BoardPost[]>(seedPosts)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [category, setCategory] = useState('Grow & share')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [openReplyId, setOpenReplyId] = useState<string | null>(null)

  function handlePost() {
    if (!title.trim()) return
    setPosts((current) => [
      {
        id: String(Date.now()),
        category,
        location: 'Local',
        title: title.trim(),
        body: details.trim() || 'Fresh signal from the neighborhood.',
        replies: [],
      },
      ...current,
    ])
    setTitle('')
    setDetails('')
    setCategory('Grow & share')
  }

  function handleReply(postId: string) {
    const value = (replyDrafts[postId] || '').trim()
    if (!value) return
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              replies: [...post.replies, { id: `${postId}-${Date.now()}`, author: 'Neighbor', body: value }],
            }
          : post,
      ),
    )
    setReplyDrafts((current) => ({ ...current, [postId]: '' }))
    setOpenReplyId(postId)
  }

  return (
    <section className="board-shell stack">
      <div className="board-hero-card">
        <div>
          <p className="eyebrow eyebrow--light">Community board</p>
          <h2>Grow a seed. Make a friend.</h2>
          <p>Use the board for barter, volunteer calls, harvest updates, and neighborhood signal.</p>
        </div>
      </div>

      <div className="board-create board-create-card">
        <div className="board-create-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Grow & share</option>
            <option>Trade & help</option>
            <option>Local event</option>
            <option>Needs volunteers</option>
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is happening?" />
        </div>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Keep it short, clear, and local." rows={3} />
        <div className="action-row board-actions">
          <button className="primary" onClick={handlePost}>Post it</button>
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
            {post.replies.length ? (
              <div className="board-replies">
                {post.replies.map((reply) => (
                  <div className="board-reply" key={reply.id}>
                    <strong>{reply.author}</strong>
                    <span>{reply.body}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {openReplyId === post.id ? (
              <div className="board-reply-form">
                <textarea
                  rows={2}
                  value={replyDrafts[post.id] || ''}
                  onChange={(e) => setReplyDrafts((current) => ({ ...current, [post.id]: e.target.value }))}
                  placeholder="Reply to the post"
                />
                <div className="action-row">
                  <button className="primary" onClick={() => handleReply(post.id)}>Send reply</button>
                  <button className="ghost" onClick={() => setOpenReplyId(null)}>Close</button>
                </div>
              </div>
            ) : (
              <button className="ghost" onClick={() => setOpenReplyId(post.id)}>Reply</button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
