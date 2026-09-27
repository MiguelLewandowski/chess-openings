import { ImageResponse } from 'next/og'

// iOS home-screen icon. Safari does not take the SVG favicon here, so the same 2×2 board mark
// is drawn at 180px. Full-bleed: iOS rounds the corners itself.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const cell = (color: string) => <div style={{ width: 45, height: 45, borderRadius: 8, background: color }} />

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#14161A' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            {cell('#FFFFFF')}
            {cell('#4C515D')}
          </div>
          <div style={{ display: 'flex' }}>
            {cell('#4C515D')}
            {cell('#FFFFFF')}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
