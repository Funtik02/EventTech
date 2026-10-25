export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#6366F1" d="M24 3 42 13.5v9L24 12 6 22.5v-9z" />
      <path fill="#818CF8" d="M6 22.5 24 12v12L6 34.5z" />
      <path fill="#A78BFA" d="M24 24 42 34.5 24 45 6 34.5z" />
      <path fill="#4F46E5" d="M42 22.5v12L24 24z" />
    </svg>
  )
}

export function Logo({ size = 32, light = false, tagline = false }) {
  return (
    <span className={`logo${light ? ' logo--light' : ''}`}>
      <LogoMark size={size} />
      <span className="logo__text">
        <span className="logo__name" style={{ fontSize: size * 0.58 }}>
          EventTech
        </span>
        {tagline && <span className="logo__tagline">События. Люди. Результаты.</span>}
      </span>
    </span>
  )
}
