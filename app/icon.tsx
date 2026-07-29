import { ImageResponse } from 'next/og'

/**
 * Site icon, generated from brand tokens rather than shipped as a binary.
 *
 * The site had no icon at all — /favicon.ico 404'd, and the Smithery listing
 * docked 8 points for a missing icon. This renders at 512×512 so one asset
 * serves every consumer: browsers scale it down for the tab, and registry
 * listings (Smithery, Glama) get a crisp square logo from the same URL
 * (https://legalaimcp.com/icon).
 *
 * The mark: gold section sign (§ — the most legal glyph in Unicode) on the
 * brand navy. § renders in every system font, unlike ⚖️ which is at the mercy
 * of emoji fallback in the OG renderer.
 */
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A', // brand navy
          borderRadius: 96,
        }}
      >
        <div
          style={{
            fontSize: 320,
            fontWeight: 700,
            color: '#B8860B', // gold-display
            // Nudge up: § sits low on its line box.
            marginTop: -24,
          }}
        >
          §
        </div>
      </div>
    ),
    { ...size }
  )
}
