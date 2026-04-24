// src/tabs/RewardsTab.jsx
//
// Rewards tab: rewards grid + penalty jar + claim history.
// Points are earned on Today/Week, spent here.

import { useState } from 'react';
import { todayISO, currentMonthKey, formatShort } from '../utils/dates';
import { currentBalance, currentMonthPenalties } from '../utils/points';

const COLORS = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1a1a1a',
  border: '#222',
  text: '#e8e8e8',
  textDim: '#888',
  textFaint: '#555',
  accent: '#d9f66f',
  danger: '#ef4444',
  warning: '#f59e0b',
};

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '1.25rem',
};

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
      {/* Balance + jar summary row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <BalanceCard balance={balance} />
        <JarCard
          amount={jarAmount}
          monthKey={monthKey}
          paid={paidThisMonth}
          onMarkPaid={() => markPaid(data, setData, monthKey)}
        />
      </div>

      {/* Rewards grid */}
      <RewardsGrid data={data} setData={setData} balance={balance} />

      {/* Penalty log */}
      <PenaltyLog data={data} monthKey={monthKey} />

      {/* Claim history */}
      <ClaimHistory data={data} />
    </div>
  );
}

// ============================================================
// BALANCE + JAR
// ============================================================

function BalanceCard({ balance }) {
  return (
    <div style={cardStyle}>
      <div style={{
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        color: COLORS.textDim,
        marginBottom: '0.5rem',
      }}>
        POINT BALANCE
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: COLORS.accent }}>
        {balance.toLocaleString()}
      </div>
      <div style={{ fontSize: '0.8rem', color: COLORS.textFaint, marginTop: '0.25rem' }}>
        Available to spend
      </div>
    </div>
  );
}

function JarCard({ amount, monthKey, paid, onMarkPaid }) {
  return (
    <div style={cardStyle}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.5rem',
      }}>
        <div style={{
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          color: COLORS.textDim,
        }}>
          PENALTY JAR · {monthKey}
        </div>
        {paid && (
          <span style={{
            fontSize: '0.7rem',
            color: COLORS.accent,
            fontWeight: 600,
          }}>
            ✓ PAID
          </span>
        )}
      </div>
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: amount > 0 ? COLORS.danger : COLORS.textFaint,
      }}>
        £{amount.toFixed(2)}
      </div>
      {!paid && amount > 0 && (
        <button
          onClick={onMarkPaid}
          style={{
            marginTop: '0.75rem',
            background: COLORS.accent,
            color: '#000',
            border: 'none',
            padding: '0.4rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Mark as paid
        </button>
      )}
      {paid && (
        <div style={{ fontSize: '0.8rem', color: COLORS.textFaint, marginTop: '0.25rem' }}>
          Good. Fresh slate when month rolls over.
        </div>
      )}
    </div>
  );
}

function markPaid(data, setData, monthKey) {
  setData(prev => ({
    ...prev,
    penaltyPaidMonths: [...(prev.penaltyPaidMonths || []), monthKey],
  }));
}

// ============================================================
// REWARDS GRID
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
      <SectionHeader
        title="Rewards"
        count={`${data.rewards.length} types · ${balance.toLocaleString()} pts available`}
        action={
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={addButtonStyle}
          >
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '0.75rem',
      }}>
        {sorted.map(reward => {
          const affordable = balance >= reward.cost;
          const deficit = reward.cost - balance;

          return (
            <div
              key={reward.id}
              style={{
                ...cardStyle,
                padding: '1rem',
                opacity: affordable ? 1 : 0.5,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: affordable ? 'pointer' : 'default',
                transition: 'transform 0.1s',
                position: 'relative',
              }}
              onClick={() => affordable && claim(reward)}
              onMouseEnter={(e) => {
                if (affordable) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}>
                <div style={{ fontSize: '0.95rem', color: COLORS.text, flex: 1 }}>
                  {reward.name}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteReward(reward.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.textFaint,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    padding: '0 0.25rem',
                    lineHeight: 1,
                  }}
                  aria-label="Delete reward"
                >
                  ×
                </button>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  color: COLORS.accent,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {reward.cost.toLocaleString()} pts
                </span>
                {!affordable && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: COLORS.textFaint,
                  }}>
                    need {deficit.toLocaleString()} more
                  </span>
                )}
                {affordable && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: COLORS.accent,
                    fontWeight: 600,
                  }}>
                    CLAIM →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  if (thisMonthPenalties.length === 0) return null;

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHeader
        title="Recent Penalties"
        count={`${thisMonthPenalties.length} this month`}
      />
      <div style={{ ...cardStyle, padding: '0' }}>
        {thisMonthPenalties.slice(0, 15).map((p, idx) => (
          <div
            key={p.logId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 1rem',
              borderBottom: idx === Math.min(thisMonthPenalties.length, 15) - 1
                ? 'none'
                : `1px solid ${COLORS.border}`,
              fontSize: '0.9rem',
            }}
          >
            <div style={{ flex: 1, color: COLORS.text }}>{p.name}</div>
            <div style={{ color: COLORS.textFaint, fontSize: '0.8rem', marginRight: '1rem' }}>
              {formatShort(p.date)}
            </div>
            <div style={{ color: COLORS.danger, fontWeight: 600 }}>
              £{p.amount.toFixed(2)}
            </div>
          </div>
        ))}
        {thisMonthPenalties.length > 15 && (
          <div style={{
            padding: '0.75rem 1rem',
            color: COLORS.textFaint,
            fontSize: '0.8rem',
            textAlign: 'center',
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
  const history = [...(data.rewardLog || [])].sort((a, b) => b.date.localeCompare(a.date));

  if (history.length === 0) return null;

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHeader
        title="Claim History"
        count={`${history.length} claimed · ${(data.totalSpent || 0).toLocaleString()} pts spent`}
      />
      <div style={{ ...cardStyle, padding: '0' }}>
        {history.slice(0, 20).map((r, idx) => (
          <div
            key={r.logId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 1rem',
              borderBottom: idx === Math.min(history.length, 20) - 1
                ? 'none'
                : `1px solid ${COLORS.border}`,
              fontSize: '0.9rem',
            }}
          >
            <div style={{ flex: 1, color: COLORS.text }}>{r.name}</div>
            <div style={{ color: COLORS.textFaint, fontSize: '0.8rem', marginRight: '1rem' }}>
              {formatShort(r.date)}
            </div>
            <div style={{ color: COLORS.accent, fontWeight: 600 }}>
              {r.cost.toLocaleString()} pts
            </div>
          </div>
        ))}
        {history.length > 20 && (
          <div style={{
            padding: '0.75rem 1rem',
            color: COLORS.textFaint,
            fontSize: '0.8rem',
            textAlign: 'center',
          }}>
            + {history.length - 20} older claims
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// SHARED
// ============================================================

function SectionHeader({ title, count, action }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: COLORS.text }}>
          {title}
        </h2>
        {count && (
          <span style={{ color: COLORS.textFaint, fontSize: '0.85rem' }}>
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

const inputStyle = {
  background: COLORS.bg,
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.9rem',
};

const addButtonStyle = {
  background: 'transparent',
  color: COLORS.accent,
  border: `1px solid ${COLORS.border}`,
  padding: '0.35rem 0.85rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
};

const primaryButtonStyle = {
  background: COLORS.accent,
  color: '#000',
  border: 'none',
  borderRadius: '6px',
  padding: '0.5rem 1rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
};