import React from 'react'

/**
 * CareerAI Official Brand Logo Component
 * Matches the user-provided stylized ribbon chevron with glowing central star.
 * Colors adapted to CareerAI's signature Royal Blue, Cyan & Indigo palette.
 */
export const CareerAIIcon = ({ size = 28, className = '' }) => {
  const uniqueId = React.useId().replace(/:/g, '')

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="8.5 10 80 80"
      width={size}
      height={size}
      fill="none"
      className={`career-ai-logo-icon ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        {/* Upper Wing Ribbon Gradient (Cyan -> Royal Blue -> Indigo) */}
        <linearGradient id={`upperWing-${uniqueId}`} x1="15%" y1="70%" x2="90%" y2="15%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Lower Wing Ribbon Gradient (Deep Navy -> Royal -> Vibrant Sky Blue) */}
        <linearGradient id={`lowerWing-${uniqueId}`} x1="15%" y1="30%" x2="90%" y2="85%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="42%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Ribbon Fold Shadow / Depth */}
        <linearGradient id={`foldShadow-${uniqueId}`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#0b1329" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>

        {/* Star Radiant Gradient (Glowing Cyan -> Electric Blue) */}
        <linearGradient id={`starGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* Star Neon Glow Filter */}
        <filter id={`starAura-${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.65  0 0 0 0 1  0 0 0 0.85 0" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient Radial Glow Behind Star */}
      <circle cx="60" cy="50" r="16" fill="#38bdf8" opacity="0.38" filter={`url(#starAura-${uniqueId})`} />

      {/* Lower Wing Ribbon */}
      <path
        d="M 16 50 L 48 83 C 51 86 56 88 61 88 L 76 88 C 80 88 81 84 78 81 L 63 62 C 57 55 48 50 38 50 Z"
        fill={`url(#lowerWing-${uniqueId})`}
      />

      {/* Upper Wing Ribbon */}
      <path
        d="M 16 50 L 48 17 C 51 14 56 12 61 12 L 76 12 C 80 12 81 16 78 19 L 63 38 C 57 45 48 50 38 50 Z"
        fill={`url(#upperWing-${uniqueId})`}
      />

      {/* Ribbon Fold Depth & Shadow Overlap */}
      <path d="M 16 50 L 42 50 C 32 46 24 50 16 50 Z" fill={`url(#foldShadow-${uniqueId})`} />

      {/* Glowing Star in the Center Notch */}
      <path
        d="M 60 33 L 63.8 43.5 L 75.5 43.8 L 66.2 50.8 L 69.8 62 L 60 55.2 L 50.2 62 L 53.8 50.8 L 44.5 43.8 L 56.2 43.5 Z"
        fill={`url(#starGrad-${uniqueId})`}
        filter={`url(#starAura-${uniqueId})`}
      />
    </svg>
  )
}

const CareerAILogo = ({
  size = 28,
  textSize,
  withText = true,
  className = '',
  textColor = 'auto', // 'auto' | 'light' | 'dark'
  showBadge = false
}) => {
  if (!withText) {
    return <CareerAIIcon size={size} className={className} />
  }

  // Determine text color based on prop / theme
  const careerColor =
    textColor === 'light'
      ? '#ffffff'
      : textColor === 'dark'
      ? '#0f172a'
      : 'var(--logo-text, inherit)'

  const computedFontSize = textSize
    ? (typeof textSize === 'number' ? `${textSize}px` : textSize)
    : `${Math.round(size * 0.72)}px`

  return (
    <div
      className={`career-ai-brand-group ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size >= 36 ? '11px' : '9px',
        textDecoration: 'none',
        lineHeight: 1
      }}
    >
      <CareerAIIcon size={size} />

      <span
        className="career-ai-brand-typography"
        style={{
          fontSize: computedFontSize,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1px'
        }}
      >
        <span
          className="brand-text-career"
          style={{ color: careerColor, transition: 'color 0.2s ease' }}
        >
          Career
        </span>
        <span
          className="brand-text-ai"
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 8px rgba(56, 189, 248, 0.35))'
          }}
        >
          AI
        </span>
      </span>

      {showBadge && (
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.8px',
            padding: '2px 7px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(139, 92, 246, 0.18))',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            marginLeft: '4px'
          }}
        >
          PRO
        </span>
      )}
    </div>
  )
}

export default CareerAILogo

