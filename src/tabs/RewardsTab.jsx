// src/tabs/RewardsTab.jsx
//
// Rewards tab: rewards grid + penalty jar + claim history.
// Points are earned on Today/Week, spent here.

import { useState } from 'react';
import { todayISO, currentMonthKey, formatShort } from '../utils/dates';
import { currentBalance, currentMonthPenalties } from '../utils/points';
import {
  COLORS,
  FONTS,
  cardStyle,
  inputStyle,
  primaryButtonStyle,
  ghostButtonStyle,
} from '../utils/theme';
import {
  MetricCard,
  SectionHead,
  Widget,
  WidgetLabel,
  PenaltyJarVisual,
} from '../components/ui';

// Visual fill cap for the jar — matches design's default
const JAR_VISUAL_CAP = 50;

// ============================================================
// MAIN
// ============================================================

export default function RewardsTab({ data, setData }) {
  const balance = currentBalance(data);
  const monthKey = currentMonthKey();
  const jarAmount = currentMonthPenalties(data, monthKey);
  const paidThisMonth = (data.penaltyPaidMonths || []).includes(monthKey);

  return (
    <div style={{
      padding: '1.5rem 2rem 4rem',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Balance + jar row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <MetricCard
          label="Point Balance"
          value={balance.toLocaleString()}
          color={COLORS.accent}
          caption="Available to spend"
        />
        <JarCard
          amount={jarAmount}
          monthKey={monthKey}
          paid={paidThisMonth}
          onMarkPaid={() => markPaid(data, setData, monthKey)}
        />
      </div>

      <RewardsGrid data={data} setData={setData} balance={balance} />
      <PenaltyLog data={data} monthKey={monthKey} />
      <ClaimHistory data={data} />
    </div>
  );
}

// ============================================================
// JAR CARD with SVG visualization
// ============================================================

function JarCard({ amount, monthKey, paid, onMarkPaid }) {
  return (
    <Widget
      padding="14px 16px"
      accent={paid ? COLORS.good : (amount > 0 ? COLORS.red : null)}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
        <PenaltyJarVisual total={amount} cap={JAR_VISUAL_CAP} />

        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '0.5rem',
            }}>
              <WidgetLabel color={paid ? COLORS.good : null}>
                {paid ? `Jar · ${monthKey} · paid` : `Penalty Jar · ${monthKey}`}
              </WidgetLabel>
              {paid && (
                <span style={{
                  fontSize: '0.7rem',
                  color: COLORS.good,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}>
                  ✓
                </span>
              )}
            </div>
            <div style={{
              fontFamily: FONTS.display,
              fontSize: '2.25rem',
              fontWeight: 400,
              color: paid ? COLORS.good : (amount > 0 ? COLORS.red : COLORS.textMuted),
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              £{amount.toFixed(2)}
            </div>
            <div style={{
              fontFamily: FONTS.mono,
              fontSize: '0.7rem',
              color: COLORS.textMuted,
              marginTop: '0.4rem',
              letterSpacing: '0.06em',
            }}>
              cap £{JAR_VISUAL_CAP} · {paid ? 'settled' : amount > 0 ? 'open' : 'empty'}
            </div>
          </div>

          {!paid && amount > 0 && (
            <button
              onClick={onMarkPaid}
              style={{
                ...primaryButtonStyle,
                marginTop: '0.75rem',
                alignSelf: 'flex-start',
                padding: '0.4rem 1rem',
                fontSize: '0.8rem',
              }}
            >
              Mark as paid
            </button>
          )}
          {paid && (
            <div style={{
              fontSize: '0.78rem',
              color: COLORS.textMuted,
              marginTop: '0.5rem',
              fontFamily: FONTS.sans,
              fontStyle: 'italic',
            }}>
              Good. Fresh slate next month.
            </div>
          )}
        </div>
      </div>
    </Widget>
  );
}

function markPaid(data, setData, monthKey) {
  setData(prev => ({
    ...prev,
    penaltyPaidMonths: [...(prev.penaltyPaidMonths || []), monthKey],
  }));
}

// ============================================================
// REWARDS GRID with progress rings
// ============================================================

function RewardsGrid({ data, setData, balance }) {
  const [showAdd, setShowAdd] = useState(false);
  const sorted = [...data.rewards].sort((a, b) => a.cost - b.cost);

  const claim = (reward) => {
    if (balance < reward.cost) {
      alert(`You need ${reward.cost - balance} more points.`);
      return;
    }
    if (!confirm(`Claim "${reward.name}" for ${reward.cost} pts?`)) return;

    setData(prev => ({
      ...prev,
      totalSpent: (prev.totalSpent || 0) + reward.cost,
      rewardLog: [
        ...prev.rewardLog,
        {
          id: reward.id,
          name: reward.name,
          cost: reward.cost,
          date: todayISO(),
          logId: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        },
      ],
    }));
  };

  const deleteReward = (id) => {
    if (!confirm('Remove this reward type? (History preserved.)')) return;
    setData(prev => ({
      ...prev,
      rewards: prev.rewards.filter(r => r.id !== id),
    }));
  };

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHead
        title="Rewards"
        sub={`${data.rewards.length} types · ${balance.toLocaleString()} pts available`}
        right={
          <button onClick={() => setShowAdd(!showAdd)} style={ghostButtonStyle}>
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        }
      />

      {showAdd && (
        <AddRewardForm
          data={data}
          setData={setData}
          onDone={() => setShowAdd(false)}
        />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '0.75rem',
      }}>
        {sorted.map(reward => (
          <RewardCard
            key={reward.id}
            reward={reward}
            balance={balance}
            onClaim={() => claim(reward)}
            onDelete={() => deleteReward(reward.id)}
          />
        ))}
      </div>
    </section>
  );
}

function RewardCard({ reward, balance, onClaim, onDelete }) {
  const progress = Math.min(1, balance / reward.cost);
  const affordable = balance >= reward.cost;
  const deficit = reward.cost - balance;

  // Ring SVG geometry
  const size = 52;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ringColor = affordable ? COLORS.accent : COLORS.textMuted;

  return (
    <div
      onClick={() => affordable && onClaim()}
      style={{
        background: affordable
          ? `linear-gradient(135deg, ${COLORS.surface}, ${COLORS.accentSoft})`
          : COLORS.surface,
        border: `1px solid ${affordable ? COLORS.accent + '66' : COLORS.hair}`,
        borderRadius: 14,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        cursor: affordable ? 'pointer' : 'default',
        transition: 'transform 0.1s, border-color 0.15s',
        position: 'relative',
        boxShadow: affordable ? `0 0 16px ${COLORS.accentGlow}` : 'none',
      }}
      onMouseEnter={(e) => {
        if (affordable) e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
        {/* Progress ring */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={COLORS.hair}
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
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{
                transition: 'stroke-dashoffset 0.5s',
                filter: affordable ? `drop-shadow(0 0 5px ${COLORS.accentGlow})` : 'none',
              }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.mono,
            fontSize: '0.7rem',
            color: ringColor,
            fontWeight: 600,
          }}>
            {Math.round(progress * 100)}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.95rem',
            color: COLORS.text,
            letterSpacing: '-0.005em',
            marginBottom: '0.25rem',
          }}>
            {reward.name}
          </div>
          <div style={{
            color: COLORS.accent,
            fontSize: '0.85rem',
            fontFamily: FONTS.mono,
          }}>
            {reward.cost.toLocaleString()} pts
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.textFaint,
            fontSize: '1.05rem',
            cursor: 'pointer',
            padding: '0 0.25rem',
            lineHeight: 1,
            alignSelf: 'flex-start',
          }}
          aria-label="Delete reward"
        >
          ×
        </button>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.5rem',
        borderTop: `1px solid ${COLORS.hair}`,
      }}>
        {affordable ? (
          <>
            <span style={{
              fontSize: '0.78rem',
              color: COLORS.accent,
              fontFamily: FONTS.mono,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              Ready to claim
            </span>
            <span style={{
              fontSize: '0.78rem',
              color: COLORS.accent,
              fontFamily: FONTS.mono,
              fontWeight: 600,
            }}>
              CLAIM →
            </span>
          </>
        ) : (
          <>
            <span style={{
              fontSize: '0.75rem',
              color: COLORS.textMuted,
              fontFamily: FONTS.mono,
            }}>
              {deficit.toLocaleString()} pts to go
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function AddRewardForm({ data, setData, onDone }) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState(500);

  const submit = () => {
    if (!name.trim()) return;
    setData(prev => ({
      ...prev,
      rewards: [
        ...prev.rewards,
        {
          id: `reward_${Date.now()}`,
          name: name.trim(),
          cost: Number(cost),
        },
      ],
    }));
    onDone();
  };

  return (
    <div style={{ ...cardStyle, marginBottom: '0.75rem', padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '0.5rem' }}>
        <input
          id="reward-name"
          name="reward-name"
          type="text"
          placeholder="Reward name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          id="reward-cost"
          name="reward-cost"
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          style={inputStyle}
        />
        <button onClick={submit} style={primaryButtonStyle}>Add</button>
      </div>
    </div>
  );
}

// ============================================================
// PENALTY LOG (current month)
// ============================================================

function PenaltyLog({ data, monthKey }) {
  const thisMonthPenalties = (data.penaltyLog || [])
    .filter(p => p.date && p.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (thisMonthPenalties.length === 0) return null;

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHead
        title="Recent Penalties"
        sub={`${thisMonthPenalties.length} this month`}
      />
      <div style={{ ...cardStyle, padding: 0 }}>
        {thisMonthPenalties.slice(0, 15).map((p, idx) => (
          <div
            key={p.logId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.7rem 1rem',
              borderBottom: idx === Math.min(thisMonthPenalties.length, 15) - 1
                ? 'none'
                : `1px solid ${COLORS.hair}`,
              fontSize: '0.9rem',
            }}
          >
            <div style={{
              flex: 1,
              color: COLORS.text,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginRight: '1rem',
            }}>
              {p.name}
            </div>
            <div style={{
              color: COLORS.textMuted,
              fontSize: '0.78rem',
              marginRight: '1rem',
              fontFamily: FONTS.mono,
            }}>
              {formatShort(p.date)}
            </div>
            <div style={{
              color: COLORS.red,
              fontWeight: 600,
              fontFamily: FONTS.mono,
              minWidth: '3rem',
              textAlign: 'right',
            }}>
              £{p.amount.toFixed(2)}
            </div>
          </div>
        ))}
        {thisMonthPenalties.length > 15 && (
          <div style={{
            padding: '0.75rem 1rem',
            color: COLORS.textMuted,
            fontSize: '0.78rem',
            textAlign: 'center',
            fontFamily: FONTS.mono,
            borderTop: `1px solid ${COLORS.hair}`,
          }}>
            + {thisMonthPenalties.length - 15} more earlier this month
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// CLAIM HISTORY (all-time)
// ============================================================

function ClaimHistory({ data }) {
  const history = [...(data.rewardLog || [])].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  if (history.length === 0) return null;

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHead
        title="Claim History"
        sub={`${history.length} claimed · ${(data.totalSpent || 0).toLocaleString()} pts spent`}
      />
      <div style={{ ...cardStyle, padding: 0 }}>
        {history.slice(0, 20).map((r, idx) => (
          <div
            key={r.logId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.7rem 1rem',
              borderBottom: idx === Math.min(history.length, 20) - 1
                ? 'none'
                : `1px solid ${COLORS.hair}`,
              fontSize: '0.9rem',
            }}
          >
            <div style={{
              flex: 1,
              color: COLORS.text,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginRight: '1rem',
            }}>
              {r.name}
            </div>
            <div style={{
              color: COLORS.textMuted,
              fontSize: '0.78rem',
              marginRight: '1rem',
              fontFamily: FONTS.mono,
            }}>
              {formatShort(r.date)}
            </div>
            <div style={{
              color: COLORS.accent,
              fontWeight: 600,
              fontFamily: FONTS.mono,
              minWidth: '4rem',
              textAlign: 'right',
            }}>
              {r.cost.toLocaleString()} pts
            </div>
          </div>
        ))}
        {history.length > 20 && (
          <div style={{
            padding: '0.75rem 1rem',
            color: COLORS.textMuted,
            fontSize: '0.78rem',
            textAlign: 'center',
            fontFamily: FONTS.mono,
            borderTop: `1px solid ${COLORS.hair}`,
          }}>
            + {history.length - 20} older claims
          </div>
        )}
      </div>
    </section>
  );
}
