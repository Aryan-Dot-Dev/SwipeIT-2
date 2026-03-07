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
  // Set margin proportional to size so labels have room outside the inner radar
  const margin = Math.max(24, Math.round(size * 0.14))
  // Increase padding to give extra room for labels (helps in narrow modals)
  const pad = margin + 12
  const total = S + pad * 2
  const cx = total / 2
  const cy = total / 2
  // radius of the inner radar stays tied to provided `size`
  const radius = S / 2

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
  // label placement: position labels slightly outside the outer polygon so they don't overlap grid lines
  // increase offset so labels sit clearly outside the data polygon
  const labelOffset = Math.max(20, Math.round(size * 0.14))
  // place labels just outside the outer radius but still inside the SVG canvas
  // ensure they are safely outside the outer grid polygon (rScale=1)
  const labelRadius = Math.min(radius + labelOffset + 10, (total / 2) - pad / 2)
  // adjust font size based on number of labels to avoid overlap
  const baseFontSize = Math.max(9, Math.round(size * 0.038))
  const fontSize = n > 6 ? Math.max(8, Math.round(baseFontSize * 0.85)) : baseFontSize

  const labels = entries.map(([label], i) => {
  // compute raw label position slightly outside the outer polygon
  let [x, y] = point(i, labelRadius)
  
  const normalizedLabel = String(label || '')
  const words = normalizedLabel.split(' ')
  let lines = [normalizedLabel]
  // More aggressive wrapping for longer labels to prevent overlap
  if (normalizedLabel.length > 12 && words.length > 1) {
    const mid = Math.ceil(words.length / 2)
    lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
  } else if (normalizedLabel.length > 16 && words.length === 1) {
    // Force break very long single words
    const breakPoint = Math.ceil(normalizedLabel.length / 2)
    lines = [normalizedLabel.slice(0, breakPoint), normalizedLabel.slice(breakPoint)]
  }
  
  // shift labels depending on position relative to center
  const anchor = x > cx + (size * 0.02) ? 'start' : x < cx - (size * 0.02) ? 'end' : 'middle'
  
  // Calculate dynamic dy based on position and whether label is multi-line
  let dy
  if (lines.length > 1) {
    // Multi-line labels need more space
    dy = y > cy + (size * 0.03) ? '0.8em' : y < cy - (size * 0.03) ? '-1.2em' : '0.3em'
  } else {
    // Single-line labels
    dy = y > cy + (size * 0.03) ? '1.3em' : y < cy - (size * 0.03) ? '-0.4em' : '0.5em'
  }

  // estimate width and clamp x so text doesn't overflow the SVG canvas
  const estCharWidth = fontSize * 0.55
  const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '')
  const estWidth = Math.min(longestLine.length * estCharWidth, total - pad * 2)

  if (anchor === 'start') {
    if (x + estWidth > total - pad) x = total - pad - estWidth
    if (x < pad) x = pad
  } else if (anchor === 'end') {
    if (x - estWidth < pad) x = pad + estWidth
    if (x > total - pad) x = total - pad
  } else {
    const half = estWidth / 2
    if (x - half < pad) x = pad + half
    if (x + half > total - pad) x = total - pad - half
  }

    if (lines.length === 1) {
      return (
        <text key={`l${i}`} x={x} y={y} fontSize={fontSize} fill="#374151" textAnchor={anchor} dy={dy}
          stroke="#fff" strokeWidth={2.5} paintOrder="stroke" strokeLinejoin="round" strokeLinecap="round"
          style={{ fontWeight: 500 }}>
          {lines[0]}
        </text>
      )
    }

    return (
      <text key={`l${i}`} x={x} y={y} fontSize={fontSize} fill="#374151" textAnchor={anchor}
        stroke="#fff" strokeWidth={2.5} paintOrder="stroke" strokeLinejoin="round" strokeLinecap="round"
        style={{ fontWeight: 500 }}>
        <tspan x={x} dy={dy}>{lines[0]}</tspan>
        <tspan x={x} dy={'1.1em'}>{lines[1]}</tspan>
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
      {/* render into a slightly larger canvas so labels are inside the SVG and won't be clipped by ancestor overflow/border-radius */}
      <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`} style={{ overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
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
