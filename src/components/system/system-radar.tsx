"use client"

type RadarAxis = { label: string; value: number; color: string }

export function SystemRadar({
  axes,
  size = 240,
}: {
  axes: RadarAxis[]
  size?: number
}) {
  const n = axes.length
  const center = size / 2
  const radius = size * 0.38
  const levels = 4

  const point = (idx: number, r: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    }
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* concentric webs */}
        {Array.from({ length: levels }).map((_, li) => {
          const r = (radius * (li + 1)) / levels
          const pts = axes.map((_, i) => point(i, r))
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
          return (
            <path
              key={li}
              d={d}
              fill="none"
              stroke="rgba(168,85,247,0.18)"
              strokeWidth={1}
            />
          )
        })}
        {/* axes lines */}
        {axes.map((_, i) => {
          const p = point(i, radius)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(168,85,247,0.22)"
              strokeWidth={1}
            />
          )
        })}
        {/* outer glow ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(168,85,247,0.35)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        {/* data polygon */}
        {(() => {
          const pts = axes.map((a, i) => point(i, (a.value / 100) * radius))
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
          return (
            <>
              <path
                d={d}
                fill="rgba(168,85,247,0.22)"
                stroke="rgba(168,85,247,0.95)"
                strokeWidth={1.8}
                className="drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              />
              {/* star core */}
              <circle cx={center} cy={center} r={6} fill="rgba(192,132,252,1)" className="drop-shadow-[0_0_8px_rgba(192,132,252,0.9)]" />
              <circle cx={center} cy={center} r={2} fill="white" />
              {/* points */}
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3.5}
                  fill={axes[i].color}
                  stroke="rgba(168,85,247,1)"
                  strokeWidth={1.2}
                />
              ))}
            </>
          )
        })()}
        {/* labels */}
        {axes.map((a, i) => {
          const p = point(i, radius + 18)
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-violet-300 font-mono text-[7px] font-bold tracking-widest"
              style={{ textShadow: "0 0 6px rgba(168,85,247,0.6)" }}
            >
              {a.label.toUpperCase()}
            </text>
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {axes.map((a) => (
          <span key={a.label} className="inline-flex items-center gap-1 border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.58rem] font-bold tracking-widest text-primary">
            <span className="size-1.5" style={{ background: a.color }} />
            {a.label} {Math.round(a.value)}%
          </span>
        ))}
      </div>
    </div>
  )
}
