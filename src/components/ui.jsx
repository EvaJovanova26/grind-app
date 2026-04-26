// src/components/ui.jsx
//
// Shared UI primitives. Every tab imports from here.
//
// Components in this file:
//   Wordmark           — the "nudge." logotype
//   Widget             — generic card wrapper
//   WidgetLabel        — small uppercase mono caption
//   SectionHead        — Fraunces title + subtitle
//   Check              — 3-state checkbox (empty/partial/full) with lime glow
//   MetricCard         — dashboard metric tile (label + big number)
//   PerfectDayRing     — circular progress ring tracking daily completion
//   PenaltyJarVisual   — SVG jar that fills with red liquid as fines accrue

import { COLORS, FONTS } from '../utils/theme';

// ============================================================
// WORDMARK
// ============================================================
//
// The "nudge." logotype. Geist 600, tight letter-spacing, lime dot.
// Used in the App header and anywhere we need to display the brand.

export function Wordmark({ size = 26 }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'baseline',
      fontFamily: FONTS.sans,
      fontSize: size,
      lineHeight: 1,
      color: COLORS.text,
      letterSpacing: '-0.055em',
      fontWeight: 600,
    }}>
      <span>nudge</span>
      <span style={{ color: COLORS.accent }}>.</span>
    </div>
  );
}

// ============================================================
// WIDGET — generic card wrapper
// ============================================================
//
// The standard card treatment used across the app. An optional `accent`
// prop tints the border (used for "viewing past" amber, etc.). An optional
// `onClick` makes it interactive with a hover state.

export function Widget({ children, padding = '1rem 1.1rem', accent, onClick, style = {} }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.surface,
        border: `1px solid ${accent ? accent + '44' : COLORS.hair}`,
        borderRadius: 16,
        padding,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = COLORS.surfaceHi;
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.background = COLORS.surface;
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// WIDGET LABEL — small uppercase mono caption
// ============================================================

export function WidgetLabel({ children, color }) {
  return (
    <div style={{
      fontFamily: FONTS.mono,
      fontSize: '0.7rem',
      letterSpacing: '0.14em',
      color: color || COLORS.textMuted,
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}

// ============================================================
// SECTION HEAD — Fraunces title + mono sub
// ============================================================
//
// The standard "title with progress count" pattern used in every tab.
// `title` renders in Fraunces serif. `sub` is mono and dim by default,
// but takes an `accent` color when something celebratory should pop
// (e.g. lime when a section is fully complete).

export function SectionHead({ title, sub, accent, right }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h2 style={{
          fontFamily: FONTS.display,
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: 0,
          color: COLORS.text,
        }}>
          {title}
        </h2>
        {sub && (
          <span style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: accent || COLORS.textMuted,
          }}>
            {sub}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

// ============================================================
// CHECK — 3-state checkbox with lime glow
// ============================================================
//
// The signature interactive element. Three visual states:
//   'empty'   → outline only, dim border
//   'partial' → soft lime tint with "½" mark (for 2x-tap rituals at 1 tap)
//   'full'    → solid lime fill with checkmark and glow
//
// For water rituals (which cycle through 4 levels), pass 'partial' for
// any non-zero/non-full state — the user reads the actual progress from
// the points label next to the row, not the checkbox.

export function Check({ state = 'empty', onClick, size = 18 }) {
  const isFull = state === 'full';
  const isPartial = state === 'partial';

  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        flexShrink: 0,
        border: `1.5px solid ${isFull || isPartial ? COLORS.accent : COLORS.hairHot}`,
        background: isFull
          ? COLORS.accent
          : isPartial
          ? COLORS.accentSoft
          : 'transparent',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        boxShadow: isFull ? `0 0 16px ${COLORS.accentGlow}` : 'none',
      }}
    >
      {isFull && (
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10">
          <path
            d="M2 5 L4.2 7 L8 3"
            stroke={COLORS.bg}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {isPartial && (
        <span style={{
          color: COLORS.accent,
          fontSize: size * 0.55,
          fontWeight: 700,
          lineHeight: 1,
        }}>
          ½
        </span>
      )}
    </button>
  );
}

// ============================================================
// METRIC CARD — dashboard-strip tile
// ============================================================
//
// The "POINTS / 0" pattern. Mono label on top, Fraunces big number below,
// optional caption underneath. Used for Today's score row, Week summary,
// Rewards balance/jar.

export function MetricCard({ label, value, caption, color, accent }) {
  return (
    <Widget padding="14px 16px" accent={accent}>
      <WidgetLabel color={accent}>{label}</WidgetLabel>
      <div style={{
        fontFamily: FONTS.display,
        fontSize: 34,
        fontWeight: 400,
        color: color || COLORS.text,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        marginTop: 6,
      }}>
        {value}
      </div>
      {caption && (
        <div style={{
          fontFamily: FONTS.mono,
          fontSize: 11,
          color: COLORS.textMuted,
          marginTop: 4,
        }}>
          {caption}
        </div>
      )}
    </Widget>
  );
}

// ============================================================
// PERFECT DAY RING — circular progress visualization
// ============================================================
//
// Takes an array of criteria, each shaped { label, val, target }.
// Renders a circular ring whose fill = average completion across criteria.
// When ALL criteria hit their target, ring goes magenta with "Perfect" badge.
//
// Used on TodayTab, beneath the score cards.

export function PerfectDayRing({ criteria }) {
  const progress = criteria.length > 0
    ? criteria.reduce((s, c) => s + Math.min(1, c.val / c.target), 0) / criteria.length
    : 0;
  const isPerfect = criteria.length > 0 && criteria.every(c => c.val >= c.target);

  const size = 88;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ringColor = isPerfect ? COLORS.magenta : COLORS.accent;

  return (
    <div style={{
      background: isPerfect
        ? `linear-gradient(135deg, ${COLORS.magentaSoft}, ${COLORS.accentSoft})`
        : COLORS.surface,
      border: `1px solid ${isPerfect ? COLORS.magenta + '66' : COLORS.hair}`,
      borderRadius: 16,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* The ring itself */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={COLORS.hairBright}
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={ringColor}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.6s',
                filter: `drop-shadow(0 0 6px ${ringColor}66)`,
              }}
            />
          </svg>
          {/* Centered number */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            fontFamily: FONTS.display,
          }}>
            <div style={{
              fontSize: 24,
              color: COLORS.text,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              {Math.round(progress * 100)}
            </div>
            <div style={{
              fontFamily: FONTS.mono,
              fontSize: 8,
              color: COLORS.textMuted,
              letterSpacing: '0.1em',
            }}>
              PCT
            </div>
          </div>
        </div>

        {/* Right side: title + criteria checklist */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 8,
          }}>
            <h3 style={{
              margin: 0,
              fontFamily: FONTS.display,
              fontSize: 18,
              fontWeight: 400,
              color: COLORS.text,
              letterSpacing: '-0.02em',
            }}>
              {isPerfect
                ? <><span style={{ color: COLORS.magenta }}>Perfect</span> day</>
                : 'Perfect day'}
            </h3>
            {isPerfect && (
              <span style={{
                fontFamily: FONTS.mono,
                fontSize: 8.5,
                color: COLORS.magenta,
                padding: '2px 6px',
                border: `1px solid ${COLORS.magenta}66`,
                borderRadius: 3,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}>
                Claimed
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {criteria.map(c => {
              const done = c.val >= c.target;
              return (
                <div key={c.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    flexShrink: 0,
                    border: `1.5px solid ${done ? COLORS.accent : COLORS.hairHot}`,
                    background: done ? COLORS.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {done && (
                      <svg width="7" height="7" viewBox="0 0 10 10">
                        <path
                          d="M2 5 L4.2 7 L8 3"
                          stroke={COLORS.bg}
                          strokeWidth="2.2"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div style={{
                    flex: 1,
                    color: done ? COLORS.textMuted : COLORS.text,
                  }}>
                    {c.label}
                  </div>
                  <div style={{
                    fontFamily: FONTS.mono,
                    fontSize: 10.5,
                    color: done ? COLORS.accent : COLORS.textMuted,
                  }}>
                    {c.val}/{c.target}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PENALTY JAR VISUAL — SVG jar that fills with red liquid
// ============================================================
//
// Renders an SVG jar showing penalty accumulation visually.
// `total` = current £ in jar. `cap` = the visual fill ceiling
// (jar visualizes fullness relative to this; default £50).
//
// Used on RewardsTab in place of (or alongside) the JarCard.

export function PenaltyJarVisual({ total = 0, cap = 50 }) {
  const fillPct = Math.min(1, total / cap);
  const fillTopY = 130 - (130 - 38) * fillPct;

  return (
    <div style={{
      width: 96,
      height: 140,
      flexShrink: 0,
      position: 'relative',
    }}>
      <svg viewBox="0 0 96 140" width="96" height="140">
        <defs>
          <linearGradient id="jarFill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={COLORS.red} stopOpacity="0.85" />
            <stop offset="1" stopColor={COLORS.red} stopOpacity="0.45" />
          </linearGradient>
          <clipPath id="jarBody">
            <path d="M 16 38 Q 16 34 20 34 L 76 34 Q 80 34 80 38 L 80 124 Q 80 130 74 130 L 22 130 Q 16 130 16 124 Z" />
          </clipPath>
        </defs>

        {/* Liquid fill (clipped to jar shape) */}
        <g clipPath="url(#jarBody)">
          <rect
            x="0"
            y={fillTopY}
            width="96"
            height={(130 - 38) * fillPct}
            fill="url(#jarFill)"
          />
          {fillPct > 0 && (
            <path
              d={`M 16 ${fillTopY} Q 36 ${fillTopY - 3} 56 ${fillTopY} T 96 ${fillTopY}`}
              stroke={COLORS.red}
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
          )}
        </g>

        {/* Jar outline */}
        <path
          d="M 16 38 Q 16 34 20 34 L 76 34 Q 80 34 80 38 L 80 124 Q 80 130 74 130 L 22 130 Q 16 130 16 124 Z"
          fill="none"
          stroke={COLORS.hairHot}
          strokeWidth="1.5"
        />

        {/* Neck */}
        <rect
          x="22" y="26" width="52" height="8" rx="1.5"
          fill="none" stroke={COLORS.hairHot} strokeWidth="1.5"
        />

        {/* Lid */}
        <rect
          x="18" y="14" width="60" height="14" rx="2"
          fill={COLORS.bg2} stroke={COLORS.hairHot} strokeWidth="1.5"
        />
        <line x1="24" y1="21" x2="72" y2="21" stroke={COLORS.hairBright} strokeWidth="1" />

        {/* Tick marks on right */}
        <g stroke={COLORS.hairBright} strokeWidth="0.8">
          <line x1="84" y1="46" x2="88" y2="46" />
          <line x1="84" y1="68" x2="88" y2="68" />
          <line x1="84" y1="90" x2="88" y2="90" />
          <line x1="84" y1="112" x2="88" y2="112" />
        </g>

        {/* Label area on jar front */}
        <rect
          x="24" y="60" width="48" height="42" rx="1.5"
          fill={COLORS.bg} stroke={COLORS.hairBright} strokeWidth="0.8"
        />
        <text
          x="48" y="75"
          textAnchor="middle"
          fontFamily={FONTS.mono}
          fontSize="6"
          fill={COLORS.textMuted}
          letterSpacing="1"
        >
          PENALTY
        </text>
        <text
          x="48" y="92"
          textAnchor="middle"
          fontFamily={FONTS.display}
          fontSize="14"
          fill={COLORS.text}
        >
          £{Math.round(total)}
        </text>
      </svg>
    </div>
  );
}
