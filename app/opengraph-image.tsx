import { ImageResponse } from 'next/og'

export const alt = 'LegalAIMCP — AI Integrations for Law Firms'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Brand colors from tailwind.config.ts (navy / gold-display / gold-text /
// warm-white). No next/font or remote asset fetch here — the sandbox blocks
// network access for next/font, and ImageResponse's default system font
// renders fine without one.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0F172A',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: '#B8860B',
            }}
          />
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: '#FAFAF8',
              letterSpacing: '-0.02em',
            }}
          >
            LegalAIMCP
          </div>
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#FAFAF8',
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: '900px',
          }}
        >
          AI Integrations for Law Firms
        </div>
        <div
          style={{
            marginTop: '32px',
            fontSize: 28,
            color: '#B8860B',
            textAlign: 'center',
          }}
        >
          The curated directory of MCP servers for contract review, case management &amp; legal research
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
