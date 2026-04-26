// src/utils/theme.js
//
// The single source of truth for visual tokens.
// Every tab and component imports from here.
//
// Why this file exists:
//   Before this, each tab had its own COLORS object — six near-identical
//   copies of the same palette duplicated across files. That meant every
//   future tweak required editing 5+ files. Now: one edit, applied everywhere.
//
// To change the visual language, edit ONLY this file.

// ============================================================
// COLOR PALETTE — Studio direction with Arcade energy ~60%
// ============================================================

export const COLORS = {
  // Backgrounds (deepest → highest)
  bg: '#0c0c10',           // page background — what you see at the edges
  bg2: '#0f0f14',          // slightly raised — used inside cards for nested elements
  surface: '#16161c',      // standard card background
  surfaceHi: '#1c1c24',    // hovered/elevated card
  surfaceHover: '#20202a', // hover state for clickable rows

  // Lines + borders (subtlest → most visible)
  hair: '#23232c',         // standard divider
  hairBright: '#2e2e38',   // emphasized divider
  hairHot: '#3a3a48',      // visible separator (e.g. border between sections)

  // Text (brightest → faintest)
  text: '#f4f4f5',         // primary
  textMuted: '#8b8b94',    // secondary / labels
  textDim: '#55555f',      // tertiary / disabled
  textFaint: '#3a3a44',    // barely-there

  // Accents
  accent: '#d4ff3d',                    // electric lime — primary brand
  accentSoft: '#d4ff3d22',              // subtle lime tint (backgrounds)
  accentGlow: 'rgba(212,255,61,0.35)',  // glow shadow for the signature checkbox

  magenta: '#ff7ae0',                   // celebratory accent (Perfect Day, commitments)
  magentaSoft: '#ff7ae022',

  amber: '#ffb84d',                     // warnings / carried-over / past-date viewing
  red: '#ff6b6b',                       // penalties / overdue
  redSoft: '#ff6b6b22',
  good: '#7fe5a7',                      // settled / positive confirmation
};

// ============================================================
// FONTS
// ============================================================
//
// These reference families loaded via Google Fonts in index.html.
// Fallbacks are baked in so if the network is slow, the layout doesn't
// reflow drastically when fonts arrive.

export const FONTS = {
  sans: `'Geist', 'Inter', -apple-system, sans-serif`,
  display: `'Fraunces', 'Times New Roman', serif`,
  mono: `'Geist Mono', 'JetBrains Mono', ui-monospace, monospace`,
};

// ============================================================
// SHARED STYLE OBJECTS
// ============================================================
//
// These are the building blocks that used to live duplicated in every
// tab file. Now they're imported once and used everywhere.

export const cardStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.hair}`,
  borderRadius: '14px',
  padding: '1.25rem',
};

export const inputStyle = {
  background: COLORS.bg,
  color: COLORS.text,
  border: `1px solid ${COLORS.hair}`,
  borderRadius: '8px',
  padding: '0.55rem 0.85rem',
  fontSize: '0.9rem',
  fontFamily: FONTS.sans,
  outline: 'none',
};

export const primaryButtonStyle = {
  background: COLORS.accent,
  color: COLORS.bg,
  border: 'none',
  borderRadius: '8px',
  padding: '0.55rem 1rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: FONTS.sans,
  letterSpacing: '-0.01em',
};

export const secondaryButtonStyle = {
  background: 'transparent',
  color: COLORS.text,
  border: `1px solid ${COLORS.hair}`,
  borderRadius: '8px',
  padding: '0.55rem 1rem',
  fontSize: '0.9rem',
  cursor: 'pointer',
  fontFamily: FONTS.sans,
};

export const ghostButtonStyle = {
  background: 'transparent',
  color: COLORS.accent,
  border: `1px solid ${COLORS.hair}`,
  padding: '0.4rem 0.85rem',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: FONTS.sans,
};

// ============================================================
// LABEL STYLE — small uppercase mono caption
// ============================================================
//
// Used everywhere a section needs a tiny categorical label
// (e.g. "POINTS", "TODAY", "DAILY HABITS").

export const labelStyle = {
  fontFamily: FONTS.mono,
  fontSize: '0.7rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: COLORS.textMuted,
};
