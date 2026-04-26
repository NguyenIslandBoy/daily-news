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

export default function StatsPanel() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [])

  if (!stats) return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-4 text-gray-500 text-sm">
      Loading stats...
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

  const days     = Object.entries(stats.by_day || {}).sort(([a], [b]) => a.localeCompare(b))
  const lineData = {
    labels: days.map(([d]) => d.slice(5)),   // MM-DD
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

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } } } }
  }

  const lineOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: '#1f2937' } },
    }
  }

  return (
    <div className="sticky top-20 flex flex-col gap-4">
      {/* Total */}
      <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Articles</p>
        <p className="text-3xl font-bold text-white">{stats.total_articles.toLocaleString()}</p>
      </div>

      {/* Pie */}
      {categories.length > 0 && (
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">By Category</p>
          <Pie data={pieData} options={chartOptions} />
        </div>
      )}

      {/* Line */}
      {days.length > 0 && (
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Last 30 Days</p>
          <Line data={lineData} options={lineOptions} />
        </div>
      )}
    </div>
  )
}