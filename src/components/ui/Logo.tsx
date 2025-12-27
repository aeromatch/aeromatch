'use client'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  // Size configurations - hero is 20-30% larger for landing page
  const sizes = {
    sm: { width: 100, height: 31 },    // Secondary pages, sidebar
    md: { width: 140, height: 43 },    // Dashboard header
    lg: { width: 180, height: 56 },    // Larger header
    xl: { width: 220, height: 68 },    // Large branding
    hero: { width: 280, height: 87 },  // Landing page hero - 20-30% larger than xl
  }

  const { width, height } = sizes[size]

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 396 122.95"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AeroMatch"
      >
        {/* "A" Icon - Gold */}
        <path
          fill="#C2A359"
          d="M34.98,70.43c-.05.54-.03,1.39.48,2.08.95,1.28,3.08,1.4,4.12,1.14,17.79-4.42,30.7-8.02,32.82-9.11,1.21-.63,2.06-1.54,2.06-1.54,1.04-1.13,1.47-2.37,1.72-3.2,1.28-4.34.61-7.84,1.19-7.96.42-.09,1.05,1.68,2.25,4.53,1.26,2.99,3.85,7.53,4.21,9.32.75,2.81.26,3.95,0,4.42-.45.81-1.11,1.25-1.43,1.45-6.57,4.21-12.19,7.08-12.19,7.08-7.89,4.2-23.23,11.94-32.85,16.72-4.08,2-6.43,3.1-9.72,5.26-1.19.78-10.51,6.88-9.55,9.03.35.79,1.78.3,9.43.34,5.02.11,10.26.18,14.98-.18,16.59-11.37,50.94-20.74,63.23.29,1.72-.2,14.97-.16,15.39-.12,6.51.08,7.98.19,8.57-.81.54-.91,0-2.06-1.47-5.41-14.48-32.46-26.14-60.23-43.61-92.4-4.27-.81-11.5-.73-15.71.17"
        />
        
        {/* "aero" text - Gold */}
        <text
          fill="#BFA058"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="48"
          fontWeight="700"
          x="126.06"
          y="83.55"
        >
          <tspan>aero</tspan>
        </text>
        
        {/* "Match" text - White */}
        <text
          fill="#FFFFFF"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="48"
          fontWeight="700"
          x="232.97"
          y="83.55"
        >
          <tspan>Match</tspan>
        </text>
      </svg>
    </div>
  )
}

// Icon-only version for very small spaces (e.g., favicon, mobile collapsed menu)
export function LogoIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 90 110"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AeroMatch"
    >
      <path
        fill="#C2A359"
        d="M34.98,70.43c-.05.54-.03,1.39.48,2.08.95,1.28,3.08,1.4,4.12,1.14,17.79-4.42,30.7-8.02,32.82-9.11,1.21-.63,2.06-1.54,2.06-1.54,1.04-1.13,1.47-2.37,1.72-3.2,1.28-4.34.61-7.84,1.19-7.96.42-.09,1.05,1.68,2.25,4.53,1.26,2.99,3.85,7.53,4.21,9.32.75,2.81.26,3.95,0,4.42-.45.81-1.11,1.25-1.43,1.45-6.57,4.21-12.19,7.08-12.19,7.08-7.89,4.2-23.23,11.94-32.85,16.72-4.08,2-6.43,3.1-9.72,5.26-1.19.78-10.51,6.88-9.55,9.03.35.79,1.78.3,9.43.34,5.02.11,10.26.18,14.98-.18,16.59-11.37,50.94-20.74,63.23.29,1.72-.2,14.97-.16,15.39-.12,6.51.08,7.98.19,8.57-.81.54-.91,0-2.06-1.47-5.41-14.48-32.46-26.14-60.23-43.61-92.4-4.27-.81-11.5-.73-15.71.17"
      />
    </svg>
  )
}
