import { useState, useEffect } from 'react'
import { getStats } from '../api'
import { Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler)

const COLORS = ['#7c3aed','#2563eb','#dc2626','#16a34a','#d97706','#0891b2']

export default function StatsPanel({ dark = true }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [])

  const card  = `rounded-lg border p-4 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`
  const label = `text-xs uppercase tracking-wider mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`
  const value = `text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`

  if (!stats) return (
    <div className={card}>
      <p className={label}>Loading stats...</p>
    </div>
  )

  const categories = Object.entries(stats.by_category || {})
  const pieData = {
    labels: categories.map(([k]) => k),
    datasets: [{
      data:            categories.map(([, v]) => v),
      backgroundColor: COLORS,
      borderWidth:     0,
    }]
  }

  const days = Object.entries(stats.by_day || {}).sort(([a], [b]) => a.localeCompare(b))
  const lineData = {
    labels: days.map(([d]) => d.slice(5)),
    datasets: [{
      label:           'Articles',
      data:            days.map(([, v]) => v),
      borderColor:     '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.1)',
      fill:            true,
      tension:         0.3,
      pointRadius:     2,
    }]
  }

  const legendColor  = dark ? '#9ca3af' : '#6b7280'
  const tickColor    = dark ? '#6b7280' : '#9ca3af'
  const gridColor    = dark ? '#1f2937' : '#f3f4f6'

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: legendColor, boxWidth: 12, font: { size: 11 } } } }
  }

  const lineOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
    }
  }

  return (
    <div className="sticky top-20 flex flex-col gap-4">
      {/* Total */}
      <div className={card}>
        <p className={label}>Total Articles</p>
        <p className={value}>{stats.total_articles.toLocaleString()}</p>
      </div>

      {/* Pie */}
      {categories.length > 0 && (
        <div className={card}>
          <p className={label}>By Category</p>
          <Pie data={pieData} options={chartOptions} />
        </div>
      )}

      {/* Line */}
      {days.length > 0 && (
        <div className={card}>
          <p className={label}>Last 30 Days</p>
          <Line data={lineData} options={lineOptions} />
        </div>
      )}
    </div>
  )
}