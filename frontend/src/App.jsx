import { useState, useEffect } from 'react'
import { getTopics, getSources } from './api'
import ArticleList from './components/ArticleList'
import StatsPanel  from './components/StatsPanel'

export default function App() {
  const [topics,       setTopics]       = useState([])
  const [sources,      setSources]      = useState([])
  const [selectedTopic,  setSelectedTopic]  = useState(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [search,       setSearch]       = useState('')
  const [searchInput,  setSearchInput]  = useState('')

  useEffect(() => {
    getTopics().then(d  => setTopics(d.topics   || []))
    getSources().then(d => setSources(d.sources  || []))
  }, [])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-4">
        <h1 className="text-lg font-bold tracking-tight text-white">🗞 Daily News</h1>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="ml-auto w-64 rounded-md bg-gray-800 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </header>

      {/* Filter chips */}
      <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-gray-800 bg-gray-900">
        {/* Topic filters */}
        <button
          onClick={() => setSelectedTopic(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
            ${selectedTopic === null ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          All Topics
        </button>
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(selectedTopic === t.id ? null : t.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${selectedTopic === t.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {t.name}
          </button>
        ))}

        {/* Divider */}
        {sources.length > 0 && (
          <span className="w-px bg-gray-700 mx-1" />
        )}

        {/* Source filters */}
        <button
          onClick={() => setSelectedSource(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
            ${selectedSource === null ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          All Sources
        </button>
        {sources.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSource(selectedSource === s.id ? null : s.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${selectedSource === s.id ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-6 px-6 py-6 max-w-screen-xl mx-auto">
        <main className="flex-1 min-w-0">
          <ArticleList
            topic={selectedTopic}
            source={selectedSource}
            search={search}
            topics={topics}
          />
        </main>
        <aside className="w-80 shrink-0 hidden lg:block">
          <StatsPanel />
        </aside>
      </div>
    </div>
  )
}