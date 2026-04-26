import { useState } from 'react'
import { getArticle } from '../api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const CATEGORY_COLORS = {
  ai:       'bg-purple-900 text-purple-300',
  tech:     'bg-blue-900 text-blue-300',
  security: 'bg-red-900 text-red-300',
  science:  'bg-green-900 text-green-300',
  default:  'bg-gray-800 text-gray-400',
}

export default function ArticleCard({ article: a, topics = [], dark = true }) {
  const [expanded, setExpanded] = useState(false)
  const [related,  setRelated]  = useState(null)

  const topic = topics.find(t => t.id === a.topic_id)
  const label = topic ? topic.name : (a.category || 'general')
  const color = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.default

  async function toggleRelated() {
    if (!expanded && related === null) {
      const data = await getArticle(a.id)
      setRelated(data.related || [])
    }
    setExpanded(e => !e)
  }

  return (
    <article className={`rounded-lg border p-4 transition-colors
        ${dark
        ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
        : 'bg-white border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
              {label}
            </span>
            <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{a.source_name}</span>
            {a.author && (
              <span className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>· {a.author}</span>
            )}
            <span className={`text-xs ml-auto ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
              {dayjs(a.published_at).fromNow()}
            </span>
          </div>

          {/* Title */}
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-semibold hover:text-blue-400 transition-colors leading-snug block mb-2
                ${dark ? 'text-gray-100' : 'text-gray-900'}`}
          >
            {a.title}
          </a>

          {/* Summary */}
          {a.summary && (
            <p className={`text-xs leading-relaxed line-clamp-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {a.summary.replace(/<[^>]+>/g, '')}
            </p>
          )}

          {/* Related toggle */}
          <button
            onClick={toggleRelated}
            className="mt-2 text-xs text-blue-500 hover:text-blue-400 transition-colors"
          >
            {expanded ? 'Hide related' : 'Show related articles'}
          </button>

          {/* Related list */}
          {expanded && related !== null && (
            <div className="mt-2 pl-3 border-l border-gray-700 flex flex-col gap-1">
              {related.length === 0 ? (
                <p className="text-xs text-gray-600">No related articles yet.</p>
              ) : (
                related.map(r => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    ↳ {r.title}
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}