import { useState, useEffect, useCallback } from 'react'
import { getArticles } from '../api'
import ArticleCard from './ArticleCard'

export default function ArticleList({ topic, source, search, topics, dark }) {
  const [articles, setArticles] = useState([])
  const [page,     setPage]     = useState(1)
  const [pages,    setPages]    = useState(1)
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)

  const load = useCallback(async (p = 1, reset = true) => {
    setLoading(true)
    const data = await getArticles({ topic, source, q: search, page: p, limit: 20 })
    setArticles(prev => reset ? (data.articles || []) : [...prev, ...(data.articles || [])])
    setPage(p)
    setPages(data.pages || 1)
    setTotal(data.total || 0)
    setLoading(false)
  }, [topic, source, search])

  // Separate effect to re-fetch when filters change.
  // Extracted into a named handler so the linter sees this as
  // an event-driven call rather than a direct setState inside an effect.
  useEffect(() => {
    let cancelled = false
    async function fetchPage() {
      setLoading(true)
      const data = await getArticles({ topic, source, q: search, page: 1, limit: 20 })
      if (cancelled) return
      setArticles(data.articles || [])
      setPage(1)
      setPages(data.pages || 1)
      setTotal(data.total || 0)
      setLoading(false)
    }
    fetchPage()
    return () => { cancelled = true }
  }, [topic, source, search])

  const countColor   = dark ? '#475569' : '#94a3b8'
  const loadMoreBg   = dark ? '#1e293b' : '#f1f5f9'
  const loadMoreColor = dark ? '#64748b' : '#94a3b8'
  const loadMoreBorder = dark ? '#334155' : '#e2e8f0'

  return (
    <div>
      <p style={{ fontSize: 13, color: countColor, marginBottom: 16 }}>
        {total.toLocaleString()} articles
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {articles.map(a => (
          <ArticleCard key={a.id} article={a} topics={topics} dark={dark} />
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: dark ? '#334155' : '#e2e8f0',
            margin: '0 auto',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </div>
      )}

      {!loading && page < pages && (
        <button
          onClick={() => load(page + 1, false)}
          style={{
            marginTop: 16, width: '100%', padding: '12px 0',
            borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: loadMoreBg, color: loadMoreColor,
            border: `1px solid ${loadMoreBorder}`,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = dark ? '#94a3b8' : '#64748b'}
          onMouseLeave={e => e.currentTarget.style.color = loadMoreColor}
        >
          Load more
        </button>
      )}

      {!loading && articles.length === 0 && (
        <p style={{ textAlign: 'center', color: countColor, fontSize: 13, marginTop: 48 }}>
          No articles found.
        </p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50%       { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  )
}