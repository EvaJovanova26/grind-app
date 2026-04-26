// src/components/ui.jsx
//
// Shared UI primitives. Every tab imports from here.

import { COLORS, FONTS } from '../utils/theme';

// ============================================================
// WORDMARK
// ============================================================

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
// WIDGET
// ============================================================

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
// WIDGET LABEL
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
// SECTION HEAD
// ============================================================

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
// CHECK
// ============================================================

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
// METRIC CARD
// ============================================================

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
// PERFECT DAY RING — points-driven, with criteria checklist
// ============================================================
//
// Props:
//   points    — number, today's cumulative points
//   threshold — number, the magenta threshold (default 250)
//   criteria  — array of { label, met (boolean), detail (string, optional) }
//   isPerfect — boolean, true when ALL criteria met AND points >= threshold

export function PerfectDayRing({
  points = 0,
  threshold = 250,
  criteria = [],
  isPerfect = false,
}) {
  const overThreshold = points >= threshold;
  const fillFraction = Math.min(1, points / threshold);
  const ringColor = overThreshold ? COLORS.magenta : COLORS.accent;

  const size = 92;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{
      background: isPerfect
        ? `linear-gradient(135deg, ${COLORS.magentaSoft}, ${COLORS.accentSoft})`
        : COLORS.surface,
      border: `1px solid ${isPerfect ? COLORS.magenta + '66' : COLORS.hair}`,
      borderRadius: 16,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
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
              strokeDashoffset={circumference * (1 - fillFraction)}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.6s, stroke 0.3s',
                filter: `drop-shadow(0 0 7px ${ringColor}66)`,
              }}
            />
          </svg>
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
              fontSize: 22,
              color: overThreshold ? COLORS.magenta : COLORS.text,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              transition: 'color 0.3s',
            }}>
              {points}
            </div>
            <div style={{
              fontFamily: FONTS.mono,
              fontSize: 8,
              color: COLORS.textMuted,
              letterSpacing: '0.1em',
              marginTop: 2,
            }}>
              PTS
            </div>
          </div>
        </div>

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
          <div style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: overThreshold ? COLORS.magenta : COLORS.textMuted,
            letterSpacing: '0.06em',
            marginBottom: 10,
          }}>
            {overThreshold
              ? `+${points - threshold} over threshold`
              : `${threshold - points} pts to threshold`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {criteria.map(c => (
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
                  border: `1.5px solid ${c.met ? COLORS.accent : COLORS.hairHot}`,
                  background: c.met ? COLORS.accent : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {c.met && (
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
                  color: c.met ? COLORS.textMuted : COLORS.text,
                }}>
                  {c.label}
                </div>
                {c.detail && (
                  <div style={{
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    color: c.met ? COLORS.accent : COLORS.textMuted,
                  }}>
                    {c.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PENALTY JAR VISUAL
// ============================================================

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

        <path
          d="M 16 38 Q 16 34 20 34 L 76 34 Q 80 34 80 38 L 80 124 Q 80 130 74 130 L 22 130 Q 16 130 16 124 Z"
          fill="none"
          stroke={COLORS.hairHot}
          strokeWidth="1.5"
        />

        <rect
          x="22" y="26" width="52" height="8" rx="1.5"
          fill="none" stroke={COLORS.hairHot} strokeWidth="1.5"
        />

        <rect
          x="18" y="14" width="60" height="14" rx="2"
          fill={COLORS.bg2} stroke={COLORS.hairHot} strokeWidth="1.5"
        />
        <line x1="24" y1="21" x2="72" y2="21" stroke={COLORS.hairBright} strokeWidth="1" />

        <g stroke={COLORS.hairBright} strokeWidth="0.8">
          <line x1="84" y1="46" x2="88" y2="46" />
          <line x1="84" y1="68" x2="88" y2="68" />
          <line x1="84" y1="90" x2="88" y2="90" />
          <line x1="84" y1="112" x2="88" y2="112" />
        </g>

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
