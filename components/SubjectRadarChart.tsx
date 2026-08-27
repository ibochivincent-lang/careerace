'use client'

import { useMemo } from 'react'
import { cn } from './ui/utils'
import type { Subject } from '@/lib/types'

interface SubjectScore {
  subject: Subject
  label: string
  score: number // 0-1
  color: string
}

interface SubjectRadarChartProps {
  subjects: SubjectScore[]
  size?: number
  className?: string
}

const SUBJECT_COLORS: Record<Subject, string> = {
  biology:     '#22c55e',
  chemistry:   '#3b82f6',
  physics:     '#a855f7',
  mathematics: '#f97316',
  english:     '#ec4899',
  economics:   '#eab308',
}

export function SubjectRadarChart({
  subjects,
  size = 240,
  className,
}: SubjectRadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.36

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  // Angles: start at top (-90°), go clockwise
  const angleStep = (2 * Math.PI) / subjects.length
  const startAngle = -Math.PI / 2

  const getPoint = (index: number, radius: number) => {
    const angle = startAngle + index * angleStep
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  const gridPolygons = useMemo(() =>
    gridLevels.map(level => {
      const pts = subjects.map((_, i) => getPoint(i, maxR * level))
      return pts.map(p => `${p.x},${p.y}`).join(' ')
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [subjects.length, maxR])

  const dataPolygon = useMemo(() => {
    const pts = subjects.map((s, i) => getPoint(i, maxR * Math.max(0.05, s.score)))
    return pts.map(p => `${p.x},${p.y}`).join(' ')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, maxR])

  const axes = subjects.map((_, i) => ({
    start: { x: cx, y: cy },
    end: getPoint(i, maxR),
  }))

  const labelPad = 18
  const labels = subjects.map((s, i) => {
    const pt = getPoint(i, maxR + labelPad)
    return { ...s, x: pt.x, y: pt.y }
  })

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="Subject confidence radar chart"
      >
        {/* Grid polygons */}
        {gridPolygons.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
            className="text-foreground"
          />
        ))}

        {/* Axis lines */}
        {axes.map((ax, i) => (
          <line
            key={i}
            x1={ax.start.x} y1={ax.start.y}
            x2={ax.end.x}   y2={ax.end.y}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={1}
            className="text-foreground"
          />
        ))}

        {/* Data polygon fill */}
        <polygon
          points={dataPolygon}
          fill="var(--color-primary)"
          fillOpacity={0.15}
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeOpacity={0.8}
        />

        {/* Data points */}
        {subjects.map((s, i) => {
          const pt = getPoint(i, maxR * Math.max(0.05, s.score))
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={SUBJECT_COLORS[s.subject] ?? 'var(--color-primary)'}
              stroke="white"
              strokeWidth={1.5}
            />
          )
        })}

        {/* Labels */}
        {labels.map((l, i) => (
          <g key={i}>
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fontWeight={500}
              fill="currentColor"
              className="text-muted-foreground"
              opacity={0.75}
            >
              {l.label}
            </text>
          </g>
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="var(--color-primary)" fillOpacity={0.5} />
      </svg>
    </div>
  )
}
