import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#2D2D2D',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 512 512"
          width="140"
          height="140"
        >
          <polygon points="256,75 176,155 336,155" fill="#F8F5F0" />
          <rect x="146" y="185" width="54" height="222" fill="#F8F5F0" />
          <rect x="312" y="185" width="54" height="222" fill="#F8F5F0" />
          <rect x="146" y="273" width="220" height="46" fill="#F8F5F0" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
