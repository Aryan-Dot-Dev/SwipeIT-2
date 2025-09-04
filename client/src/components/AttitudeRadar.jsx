import React from 'react'

// Simple radar (spider) chart component
// Props:
// - data: object mapping label -> numeric value
// - size: px width/height (default 220)
// - levels: number of concentric grid levels (default 4)
// - maxValue: maximum value to normalize against (optional, inferred from data)

const AttitudeRadar = ({ data = {}, size = 240, levels = 4, maxValue = null }) => {
  const entries = Object.entries(data || {})
  if (!entries || entries.length === 0) return <div className="text-sm text-gray-500">No attitude data</div>

  const n = entries.length
  const S = size
  const cx = S / 2
  const cy = S / 2
  const margin = 36
  const radius = S / 2 - margin

  const values = entries.map((entry) => Number(entry[1]) || 0)
  const max = maxValue && Number(maxValue) > 0 ? Number(maxValue) : Math.max(...values, 1)

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2

  const point = (i, r) => {
    const a = angle(i)
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    return [x, y]
  }

  const polygonPoints = (rScale) => entries.map((_, i) => point(i, radius * rScale).join(',')).join(' ')

  const grid = []
  for (let lev = levels; lev >= 1; lev--) {
    const rScale = lev / levels
    grid.push(<polygon key={`g${lev}`} points={polygonPoints(rScale)} fill="none" stroke="#E5E7EB" strokeWidth={1} />)
  }

  // axis lines
  const axes = entries.map((e, i) => {
    const [x, y] = point(i, radius)
    return <line key={`a${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" strokeWidth={1} />
  })

  // labels
  const labels = entries.map(([label], i) => {
    const [x, y] = point(i, radius + 14)
    // shift labels slightly depending on quadrant
    const anchor = x > cx + 4 ? 'start' : x < cx - 4 ? 'end' : 'middle'
    const dy = y > cy + 6 ? '0.8em' : y < cy - 8 ? '-0.2em' : '0.35em'
    return (
      <text key={`l${i}`} x={x} y={y} fontSize={11} fill="#374151" textAnchor={anchor} dy={dy}>
        {label}
      </text>
    )
  })

  // data polygon
  const dataPoints = entries.map((entry, i) => {
    const val = Number(entry[1]) || 0
    const r = radius * Math.min(val / max, 1)
    return point(i, r).join(',')
  }).join(' ')

  return (
    <div className="flex flex-col items-center">
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <g>
          {grid}
          {axes}
          <polygon points={dataPoints} fill="rgba(59,130,246,0.12)" stroke="rgba(37,99,235,0.9)" strokeWidth={2} />
          {labels}
        </g>
      </svg>
      <div className="mt-2 text-xs text-gray-500">Values normalized to {max}</div>
    </div>
  )
}

export default AttitudeRadar
