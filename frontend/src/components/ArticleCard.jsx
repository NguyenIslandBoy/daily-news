import { useState } from 'react'
import { getArticle, summarizeArticle } from '../api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const TOPIC_COLORS = {
  'Artificial Intelligence': { bg: 'rgba(79,70,229,0.15)',  color: '#818cf8' },
  'Cybersecurity':           { bg: 'rgba(220,38,38,0.12)',  color: '#f87171' },
  'Startups & Business':     { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
  'Science & Research':      { bg: 'rgba(8,145,178,0.12)',  color: '#22d3ee' },
  'Software & Development':  { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
}
const DEFAULT_COLOR = { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' }

export default function ArticleCard({ article: a, topics = [], dark = true }) {
  const [expanded, setExpanded] = useState(false)
  const [related,  setRelated]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [aiSummary,     setAiSummary]     = useState(null)
  const [summarizing,   setSummarizing]   = useState(false)

  const topic     = topics.find(t => t.id === a.topic_id)
  const topicName = topic ? topic.name : null
  const badge     = TOPIC_COLORS[topicName] || DEFAULT_COLOR
  const label     = topicName || a.category || 'general'

  const cardBg      = dark ? '#1e293b' : '#ffffff'
  const cardBorder  = dark ? '#334155' : '#e2e8f0'
  const cardHover   = dark ? '#475569' : '#cbd5e1'
  const titleColor  = dark ? '#f1f5f9' : '#0f172a'
  const metaColor   = dark ? '#94a3b8' : '#64748b'
  const summaryColor = dark ? '#64748b' : '#94a3b8'

  async function toggleRelated() {
    if (!expanded && related === null) {
      setLoading(true)
      const data = await getArticle(a.id)
      setRelated(data.related || [])
      setLoading(false)
    }
    setExpanded(e => !e)
  }

  async function handleSummarize() {
    setSummarizing(true)
    const data = await summarizeArticle(a.id)
    setAiSummary(data.summary || 'Could not generate summary.')
    setSummarizing(false)
  }

  return (
    <article
      style={{
        background: cardBg, border: `1px solid ${cardBorder}`,
        borderRadius: 12, padding: '18px 20px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = cardHover
        e.currentTarget.style.boxShadow = dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = cardBorder
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            background: badge.bg, color: badge.color, borderRadius: 5, padding: '3px 8px',
          }}>
            {label}
          </span>
          <span style={{ fontSize: 12, color: metaColor, fontWeight: 500 }}>{a.source_name}</span>
          {a.author && (
            <span style={{ fontSize: 11, color: dark ? '#475569' : '#94a3b8' }}>· {a.author}</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: dark ? '#475569' : '#94a3b8', whiteSpace: 'nowrap', marginLeft: 12 }}>
          {dayjs(a.published_at).fromNow()}
        </span>
      </div>

      {/* Title */}
      <a
        href={a.url} target="_blank" rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 6,
          fontSize: 15, fontWeight: 600, color: titleColor,
          lineHeight: 1.45, marginBottom: 6,
          textDecoration: 'none', transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
        onMouseLeave={e => e.currentTarget.style.color = titleColor}
      >
        {a.title}
        <svg style={{ flexShrink: 0, marginTop: 2, opacity: 0.5 }}
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>

      {/* Summary */}
      {a.summary && (
        <p style={{
          fontSize: 13, color: summaryColor, lineHeight: 1.65, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {a.summary.replace(/<[^>]+>/g, '')}
        </p>
      )}

      {/* AI Summary */}
      <div style={{ marginBottom: 10 }}>
        <button
          onClick={handleSummarize}
          disabled={summarizing}
          style={{
            fontSize: 11, fontWeight: 500,
            color: summarizing ? '#475569' : '#34d399',
            background: 'none', border: 'none',
            cursor: summarizing ? 'default' : 'pointer',
            fontFamily: 'inherit', padding: 0,
            transition: 'color 0.15s',
          }}
        >
          {summarizing ? '⏳ Summarizing...' : '✦ AI Summary'}
        </button>

        {aiSummary && (
          <p style={{
            marginTop: 8, fontSize: 13, lineHeight: 1.7,
            color: dark ? '#94a3b8' : '#64748b',
            background: dark ? 'rgba(52,211,153,0.05)' : 'rgba(16,185,129,0.05)',
            border: `1px solid ${dark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.15)'}`,
            borderRadius: 8, padding: '10px 12px',
          }}>
            {aiSummary}
          </p>
        )}
      </div>

      {/* Related toggle */}
      <button
        onClick={toggleRelated}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 500, color: '#818cf8',
          background: 'none', border: 'none', cursor: 'pointer',
          paddingTop: 12, borderTop: `1px solid ${dark ? '#334155' : '#f1f5f9'}`,
          width: '100%', fontFamily: 'inherit', transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
        onMouseLeave={e => e.currentTarget.style.color = '#818cf8'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        {loading ? 'Loading...' : expanded ? 'Hide related' : 'Show related articles'}
      </button>

      {/* Related list */}
      {expanded && related !== null && (
        <div style={{
          paddingTop: 10, paddingLeft: 12,
          borderLeft: `2px solid ${dark ? '#334155' : '#e2e8f0'}`,
          display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8,
        }}>
          {related.length === 0 ? (
            <p style={{ fontSize: 11, color: dark ? '#475569' : '#94a3b8' }}>No related articles yet.</p>
          ) : (
            related.map(r => (
              <RelatedItem key={r.id} article={r} dark={dark} />
            ))
          )}
        </div>
      )}
    </article>
  )
}

function RelatedItem({ article: r, dark }) {
  const [aiSummary,   setAiSummary]   = useState(null)
  const [summarizing, setSummarizing] = useState(false)
  const metaColor = dark ? '#94a3b8' : '#64748b'

  async function handleSummarize() {
    setSummarizing(true)
    const data = await summarizeArticle(r.id)
    setAiSummary(data.summary || 'Could not generate summary.')
    setSummarizing(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: metaColor, textDecoration: 'none', transition: 'color 0.15s', flex: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = dark ? '#f1f5f9' : '#0f172a'}
          onMouseLeave={e => e.currentTarget.style.color = metaColor}
        >
          <span style={{ fontSize: 10, color: dark ? '#475569' : '#94a3b8', marginRight: 6 }}>
            {r.source_name}
          </span>
          {r.title}
        </a>
        <button
          onClick={handleSummarize}
          disabled={summarizing}
          style={{
            fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
            color: summarizing ? '#475569' : '#34d399',
            background: 'none', border: 'none',
            cursor: summarizing ? 'default' : 'pointer',
            fontFamily: 'inherit', padding: 0,
            transition: 'color 0.15s', flexShrink: 0,
          }}
        >
          {summarizing ? '⏳' : '✦'}
        </button>
      </div>

      {aiSummary && (
        <p style={{
          fontSize: 12, lineHeight: 1.65,
          color: dark ? '#94a3b8' : '#64748b',
          background: dark ? 'rgba(52,211,153,0.05)' : 'rgba(16,185,129,0.05)',
          border: `1px solid ${dark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.15)'}`,
          borderRadius: 8, padding: '8px 10px',
        }}>
          {aiSummary}
        </p>
      )}
    </div>
  )
}