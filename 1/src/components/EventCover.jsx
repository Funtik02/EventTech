export function EventCover({ title }) {
  const crowd = Array.from({ length: 34 }, (_, i) => ({
    x: 6 + (i % 17) * 18 + (i >= 17 ? 9 : 0),
    y: i >= 17 ? 176 : 160,
    r: i >= 17 ? 9 : 7.5,
  }))

  return (
    <svg className="event-cover" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid slice" role="img" aria-label={title}>
      <defs>
        <linearGradient id="cover-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E1B4B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="cover-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A78BFA" stopOpacity="0.75" />
          <stop offset="1" stopColor="#6366F1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cover-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <rect width="320" height="190" fill="url(#cover-bg)" />
      <path d="M40 0 70 0 130 150 60 150z" fill="url(#cover-beam)" opacity="0.6" />
      <path d="M250 0 280 0 260 150 190 150z" fill="url(#cover-beam)" opacity="0.6" />
      <path d="M150 0 170 0 200 150 120 150z" fill="url(#cover-beam)" opacity="0.35" />
      <rect x="92" y="38" width="136" height="70" rx="4" fill="url(#cover-screen)" />
      <rect x="104" y="58" width="72" height="8" rx="4" fill="#fff" opacity="0.9" />
      <rect x="104" y="72" width="104" height="5" rx="2.5" fill="#fff" opacity="0.55" />
      <rect x="104" y="82" width="86" height="5" rx="2.5" fill="#fff" opacity="0.55" />
      <rect x="20" y="118" width="280" height="10" rx="2" fill="#312E81" />
      {[30, 90, 230, 290].map((x) => (
        <circle key={x} cx={x} cy="10" r="4" fill="#E0E7FF" />
      ))}
      {crowd.map((p, i) => (
        <g key={i} fill="#020617">
          <circle cx={p.x} cy={p.y - p.r * 1.7} r={p.r * 0.7} />
          <rect x={p.x - p.r} y={p.y - p.r * 0.9} width={p.r * 2} height={p.r * 3} rx={p.r} />
        </g>
      ))}
    </svg>
  )
}
