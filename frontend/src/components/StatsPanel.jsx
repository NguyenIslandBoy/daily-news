import { useState, useEffect } from 'react'
import { getStats } from '../api'
import { Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler)

const COLORS = ['#4f46e5','#7c3aed','#0891b2','#0f766e','#d97706','#dc2626']

export default function StatsPanel({ dark = true, topics = [] }) {
  const [stats, setStats] = useState(null)

  useEffect(() => { getStats().then(setStats) }, [])

  const panelBg     = dark ? '#1e293b' : '#ffffff'
  const panelBorder = dark ? '#334155' : '#e2e8f0'
  const statBg      = dark ? '#0f172a' : '#f8fafc'
  const statBorder  = dark ? 'rgba(51,65,85,0.5)' : '#e2e8f0'
  const labelColor  = dark ? '#475569' : '#94a3b8'
  const titleColor  = dark ? '#f1f5f9' : '#0f172a'
  const numColor    = dark ? '#ffffff' : '#0f172a'
  const tickColor   = dark ? '#475569' : '#94a3b8'
  const gridColor   = dark ? 'rgba(51,65,85,0.4)' : '#f1f5f9'

  const panel = {
    background: panelBg, border: `1px solid ${panelBorder}`,
    borderRadius: 12, padding: 18,
  }

  const sectionTitle = {
    fontSize: 11, fontWeight: 600, color: titleColor,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: 6,
    marginBottom: 12,
  }

  if (!stats) return (
    <div style={{ ...panel, color: labelColor, fontSize: 12 }}>
      Loading stats...
    </div>
  )

  const categories = Object.entries(stats.by_category || {})
  const days = Object.entries(stats.by_day || {}).sort(([a], [b]) => a.localeCompare(b))

  const pieData = {
    labels: categories.map(([k]) => k),
    datasets: [{
      data: categories.map(([, v]) => v),
      backgroundColor: COLORS,
      borderWidth: 0,
      hoverOffset: 4,
    }]
  }

  const lineData = {
    labels: days.map(([d]) => d.slice(5)),
    datasets: [{
      label: 'Articles',
      data: days.map(([, v]) => v),
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79,70,229,0.1)',
      borderWidth: 1.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }]
  }

  const pieOptions = {
    responsive: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: tickColor, font: { size: 10 }, padding: 8, boxWidth: 8 }
      }
    }
  }

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: tickColor, font: { size: 9 }, maxTicksLimit: 6 }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor, font: { size: 9 }, maxTicksLimit: 4 }, grid: { color: gridColor } },
    }
  }

  return (
    <div style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Stats panel */}
      <div style={panel}>
        <div style={sectionTitle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          System Stats
        </div>

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={{ background: statBg, border: `1px solid ${statBorder}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: numColor, lineHeight: 1 }}>
              {stats.total_articles.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: labelColor, marginTop: 4 }}>Total Articles</div>
          </div>
          <div style={{ background: statBg, border: `1px solid ${statBorder}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: numColor, lineHeight: 1 }}>
              {categories.length}
            </div>
            <div style={{ fontSize: 11, color: labelColor, marginTop: 4 }}>Categories</div>
          </div>
        </div>

        {/* Pie chart */}
        {categories.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: labelColor, marginBottom: 6, marginTop: 4 }}>
              Articles by Category
            </div>
            <Doughnut data={pieData} options={pieOptions} width={252} height={100} />
          </>
        )}

        {/* Line chart */}
        {days.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: labelColor, marginBottom: 6, marginTop: 14 }}>
              30-Day Volume
            </div>
            <Line data={lineData} options={lineOptions} />
          </>
        )}
      </div>

      {/* Topics panel */}
      {topics.length > 0 && (
        <div style={panel}>
          <div style={{ ...sectionTitle, marginBottom: 10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            Your Topics
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topics.map(t => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 8,
                border: '1px solid transparent',
                cursor: 'default', transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = dark ? 'rgba(30,41,59,0.5)' : '#f8fafc'
                e.currentTarget.style.borderColor = panelBorder
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
              }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#64748b' }}>
                  # {t.name}
                </span>
                <span style={{
                  fontSize: 11, color: labelColor,
                  background: statBg, padding: '2px 8px', borderRadius: 6,
                }}>
                  {(t.article_count || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}