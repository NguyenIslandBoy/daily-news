import { useState, useEffect } from 'react'
import { getTopics, getSources, createTopic } from './api'
import ArticleList from './components/ArticleList'
import StatsPanel  from './components/StatsPanel'

export default function App() {
  const [topics,         setTopics]         = useState([])
  const [sources,        setSources]        = useState([])
  const [selectedTopic,  setSelectedTopic]  = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [search,         setSearch]         = useState('')
  const [searchInput,    setSearchInput]    = useState('')
  const [dark,           setDark]           = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newKws,    setNewKws]    = useState('')  // comma-separated
  const [apiKey,    setApiKey]    = useState('')
  const [saving,    setSaving]    = useState(false)

  async function handleAddTopic() {
    if (!newName || !newKws) return
    setSaving(true)
    const keywords = newKws.split(',').map(k => k.trim()).filter(Boolean)
    const data = await createTopic(newName, keywords)
    if (data.topic) {
      setTopics(prev => [...prev, { ...data.topic, article_count: 0 }])
      setNewName(''); setNewKws(''); setShowModal(false)
    }
    setSaving(false)
  }

  useEffect(() => {
    getTopics().then(d  => setTopics(d.topics   || []))
    getSources().then(d => setSources(d.sources || []))
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const bg      = dark ? '#0f172a' : '#f8fafc'
  const navBg   = dark ? 'rgba(15,23,42,0.90)' : 'rgba(248,250,252,0.90)'
  const border  = dark ? '#1e293b' : '#e2e8f0'
  const text     = dark ? '#cbd5e1' : '#334155'
  const subtext  = dark ? '#64748b' : '#94a3b8'
  const chipIdle = dark ? { bg: '#1e293b', color: '#94a3b8', borderColor: '#334155' }
                        : { bg: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0' }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'background 0.2s, color 0.2s' }}>

      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: `1px solid ${border}`,
        background: navBg,
        backdropFilter: 'blur(12px)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px'
          }}>DN</div>
          <span style={{ fontSize: 17, fontWeight: 600, color: dark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.4px' }}>
            Daily News
          </span>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 340, margin: '0 auto', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              background: dark ? '#1e293b' : '#f1f5f9',
              border: `1px solid ${border}`,
              borderRadius: 999,
              padding: '8px 14px 8px 36px',
              fontSize: 13,
              color: text,
              outline: 'none',
            }}
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setDark(d => !d)}
          style={{
            marginLeft: 'auto',
            background: dark ? '#1e293b' : '#f1f5f9',
            border: `1px solid ${border}`,
            borderRadius: 8, padding: '6px 12px',
            fontSize: 15, cursor: 'pointer', color: subtext,
            transition: 'all 0.15s'
          }}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </nav>

      {/* Filter bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: `1px solid ${border}`,
        background: dark ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.8)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8
      }}>
        {/* Topic chips */}
        <Chip
          label="All Topics"
          active={selectedTopic === null}
          dark={dark}
          accent="indigo"
          onClick={() => setSelectedTopic(null)}
          chipIdle={chipIdle}
        />
        {topics.map(t => (
          <Chip
            key={t.id}
            label={t.name}
            active={selectedTopic === t.id}
            dark={dark}
            accent="indigo"
            onClick={() => setSelectedTopic(selectedTopic === t.id ? null : t.id)}
            chipIdle={chipIdle}
          />
        ))}

        {/* Add topics */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '5px 13px', borderRadius: 999,
            fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            background: 'none',
            border: `1px dashed ${dark ? '#334155' : '#cbd5e1'}`,
            color: dark ? '#475569' : '#94a3b8',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.color = '#818cf8' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#334155' : '#cbd5e1'; e.currentTarget.style.color = dark ? '#475569' : '#94a3b8' }}
        >
          + New Topic
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: border, margin: '0 4px' }} />

        {/* Source chips */}
        <Chip
          label="All Sources"
          active={selectedSource === null}
          dark={dark}
          accent="violet"
          onClick={() => setSelectedSource(null)}
          chipIdle={chipIdle}
        />
        {sources.map(s => (
          <Chip
            key={s.id}
            label={s.name}
            active={selectedSource === s.id}
            dark={dark}
            accent="violet"
            onClick={() => setSelectedSource(selectedSource === s.id ? null : s.id)}
            chipIdle={chipIdle}
          />
        ))}
      </div>

      {/* Main */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 288px',
        gap: 24,
        padding: '24px 28px',
        maxWidth: 1400,
        margin: '0 auto'
      }}>
        <main style={{ minWidth: 0 }}>
          <ArticleList
            topic={selectedTopic}
            source={selectedSource}
            search={search}
            topics={topics}
            dark={dark}
          />
        </main>
        <aside>
          <StatsPanel dark={dark} topics={topics} />
        </aside>
      </div>
      {/* Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: dark ? '#1e293b' : '#ffffff',
              border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
              borderRadius: 14, padding: 24, width: 360,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: dark ? '#f1f5f9' : '#0f172a', margin: 0 }}>
              Add New Topic
            </h3>

            {[
              { label: 'Topic Name', value: newName, setter: setNewName, placeholder: 'e.g. DevOps' },
              { label: 'Keywords (comma separated)', value: newKws, setter: setNewKws, placeholder: 'e.g. devops, kubernetes, ci/cd' },
              // { label: 'API Key', value: apiKey, setter: setApiKey, placeholder: 'Your X-API-Key', type: 'password' },
            ].map(({ label, value, setter, placeholder, type }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', fontWeight: 500 }}>{label}</label>
                <input
                  type={type || 'text'}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  style={{
                    background: dark ? '#0f172a' : '#f8fafc',
                    border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: 8, padding: '8px 10px',
                    fontSize: 13, color: dark ? '#cbd5e1' : '#334155',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  fontSize: 13, fontWeight: 500, background: 'none',
                  border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
                  color: dark ? '#64748b' : '#94a3b8',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTopic}
                disabled={saving}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  background: saving ? '#334155' : '#4f46e5',
                  border: 'none', color: '#fff',
                  cursor: saving ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {saving ? 'Saving...' : 'Add Topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ label, active, dark, accent, onClick, chipIdle }) {
  const accentMap = {
    indigo: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
    violet: { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
  }
  const a = accentMap[accent]
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        border: `1px solid ${active ? a.border : chipIdle.borderColor}`,
        background: active ? a.bg : chipIdle.bg,
        color: active ? a.color : chipIdle.color,
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}