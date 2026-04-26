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
    setPages(data.pages  || 1)
    setTotal(data.total  || 0)
    setLoading(false)
  }, [topic, source, search])

  // Reset to page 1 when filters change
  useEffect(() => { load(1, true) }, [load])

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">{total} articles</p>

      <div className="flex flex-col gap-3">
        {articles.map(a => (
          <ArticleCard key={a.id} article={a} topics={topics} dark={dark} />
        ))}
      </div>

      {loading && (
        <p className="text-center text-gray-500 text-sm mt-6">Loading...</p>
      )}

      {!loading && page < pages && (
        <button
          onClick={() => load(page + 1, false)}
          className="mt-6 w-full py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-colors"
        >
          Load more
        </button>
      )}

      {!loading && articles.length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-12">No articles found.</p>
      )}
    </div>
  )
}