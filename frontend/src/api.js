const BASE = '/api'

export async function getArticles(params = {}) {
  const query = new URLSearchParams()
  if (params.topic)  query.set('topic',  params.topic)
  if (params.source) query.set('source', params.source)
  if (params.q)      query.set('q',      params.q)
  if (params.page)   query.set('page',   params.page)
  if (params.limit)  query.set('limit',  params.limit)

  const res = await fetch(`${BASE}/articles?${query}`)
  return res.json()
}

export async function getArticle(id) {
  const res = await fetch(`${BASE}/articles/${id}`)
  return res.json()
}

export async function getTopics() {
  const res = await fetch(`${BASE}/topics`)
  return res.json()
}

export async function getSources() {
  const res = await fetch(`${BASE}/sources`)
  return res.json()
}

export async function getStats() {
  const res = await fetch(`${BASE}/stats`)
  return res.json()
}

export async function summarizeArticle(id) {
  const res = await fetch(`/api/articles/${id}/summarize`, { method: 'POST' })
  return res.json()
}