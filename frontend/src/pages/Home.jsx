import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, Wallet, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function getAllTimeStart() {
  return '2020-01-01';
}

function getDateRange(range) {
  const today = new Date().toISOString().slice(0, 10);
  switch (range) {
    case 'month': return { from: startOfMonth(), to: today, label: 'This month' };
    case 'all':   return { from: getAllTimeStart(), to: today, label: 'All time' };
    case 'week':
    default:      return { from: startOfWeek(), to: today, label: 'This week' };
  }
}

export default function Home({ refreshKey }) {
  const [data, setData]       = useState(null);
  const [recent, setRecent]   = useState([]);
  const [error, setError]     = useState('');
  const [dateRange, setDateRange] = useState('week');

  const load = useCallback(() => {
    const savedRange = localStorage.getItem('dateRangePreference') || 'week';
    setDateRange(savedRange);
    const { from, to } = getDateRange(savedRange);
    Promise.all([api.getDashboard(from, to), api.getSales(from, to)])
      .then(([dash, sales]) => { setData(dash); setRecent(sales.slice(0, 5)); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (error) return <div style={s.page}><p style={s.errorText}>{error}</p></div>;
  if (!data)  return <div style={s.page}><p style={s.muted}>Loading…</p></div>;

  const { label } = getDateRange(dateRange);

  return (
    <div style={s.page}>
      <span style={s.periodLabel}>{label}</span>

      {/* Revenue hero */}
      <div style={s.hero}>
        <Wallet size={15} style={s.heroIcon} />
        <span style={s.heroNum}>{data.totalRevenue.toLocaleString()}</span>
        <span style={s.heroLabel}>Revenue (MWK)</span>
        <div style={s.heroStripe} />
      </div>

      {/* Items + Orders */}
      <div style={s.statRow}>
        <div style={{ ...s.statCard, ...s.statGreen }}>
          <Package size={15} style={s.scIconGreen} />
          <span style={{ ...s.statNum, ...s.statNumGreen }}>{data.totalItems}</span>
          <span style={{ ...s.statLabel, ...s.statLabelGreen }}>Items sold</span>
        </div>
        <div style={{ ...s.statCard, ...s.statPurple }}>
          <TrendingUp size={15} style={s.scIconPurple} />
          <span style={{ ...s.statNum, ...s.statNumPurple }}>{data.totalOrders}</span>
          <span style={{ ...s.statLabel, ...s.statLabelPurple }}>Orders</span>
        </div>
      </div>

      {/* What's selling */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>What's selling</h3>
          <Link to="/insights" style={s.sectionLink}>
            Full breakdown <ChevronRight size={12} style={{ verticalAlign: -2 }} />
          </Link>
        </div>
        <div style={s.card}>
          <RankRow label="Top item"   items={data.topItems}   badge="amber" />
          <div style={s.divider} />
          <RankRow label="Top colour" items={data.topColours} badge="teal"  />
          <div style={s.divider} />
          <RankRow label="Top size"   items={data.topSizes}   badge="coral" />
        </div>
      </section>

      {/* Recent sales */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Recent sales</h3>
          <Link to="/sales" style={s.sectionLink}>
            See all <ChevronRight size={12} style={{ verticalAlign: -2 }} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ ...s.card, ...s.emptyState }}>
            <p style={s.muted}>No sales recorded {label.toLowerCase()}.</p>
            <p style={s.mutedSmall}>Tap + to log your first sale.</p>
          </div>
        ) : (
          <ul style={s.list}>
            {recent.map((sale, i) => (
              <li
                key={sale.id}
                style={{ ...s.listItem, ...(i === recent.length - 1 ? s.listItemLast : {}) }}
              >
                <div>
                  <span style={s.listName}>{sale.customers?.name || 'Unknown customer'}</span>
                  <span style={s.listSub}>
                    {sale.item}{sale.colour ? ` · ${sale.colour}` : ''} · Size {sale.size}
                  </span>
                </div>
                {sale.amount != null && (
                  <span style={s.listAmt}>{Number(sale.amount).toLocaleString()} MWK</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const BADGE = {
  amber:  { background: '#FAEEDA', color: '#633806' },
  teal:   { background: '#E1F5EE', color: '#085041' },
  coral:  { background: '#FAECE7', color: '#712B13' },
};

function RankRow({ label, items, badge }) {
  const top = items?.[0];
  return (
    <div style={s.rankRow}>
      <span style={s.rankLabel}>{label}</span>
      {top ? (
        <span style={s.rankValue}>
          {top.name}
          <span style={{ ...s.rankBadge, ...BADGE[badge] }}>×{top.count}</span>
        </span>
      ) : (
        <span style={s.mutedSmall}>No data yet</span>
      )}
    </div>
  );
}

/* ─── Style tokens ───────────────────────────────────────────────────────── */

const s = {
  page: {
    padding: '20px 16px 48px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  periodLabel: {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: 'var(--color-text-tertiary, #999)',
    marginBottom: 16,
  },

  /* ── Revenue hero ── */
  hero: {
    background: '#0C1A2E',
    borderRadius: 18,
    padding: '22px 20px 20px',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  heroIcon: {
    color: '#378ADD',
    display: 'block',
    marginBottom: 12,
  },
  heroNum: {
    display: 'block',
    fontSize: 38,
    fontWeight: 500,
    color: '#ffffff',
    letterSpacing: '-0.03em',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#378ADD',
  },
  heroStripe: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    background: '#378ADD',
    borderRadius: '0 0 18px 18px',
  },

  /* ── Stat cards ── */
  statRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 14,
    padding: '16px 14px 14px',
  },
  statGreen:  { background: '#EAF3DE' },
  statPurple: { background: '#EEEDFE' },
  scIconGreen:  { color: '#3B6D11', display: 'block', marginBottom: 10 },
  scIconPurple: { color: '#534AB7', display: 'block', marginBottom: 10 },
  statNum: {
    display: 'block',
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1,
    marginBottom: 5,
    fontVariantNumeric: 'tabular-nums',
  },
  statNumGreen:  { color: '#27500A' },
  statNumPurple: { color: '#3C3489' },
  statLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  statLabelGreen:  { color: '#3B6D11' },
  statLabelPurple: { color: '#534AB7' },

  /* ── Section ── */
  section: { marginBottom: 24 },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary, #666)',
    margin: 0,
  },
  sectionLink: {
    fontSize: 12,
    color: 'var(--color-text-tertiary, #aaa)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
  },

  /* ── Card ── */
  card: {
    background: 'var(--color-background-primary, #fff)',
    border: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))',
    borderRadius: 14,
    overflow: 'hidden',
  },

  /* ── Rank rows ── */
  rankRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '13px 16px',
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--color-text-tertiary, #aaa)',
  },
  rankValue: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text-primary, #111)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
  },
  rankBadge: {
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 9px',
    borderRadius: 99,
  },
  divider: {
    height: 0.5,
    background: 'var(--color-border-tertiary, rgba(0,0,0,0.08))',
    margin: '0 16px',
  },

  /* ── Sales list ── */
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    background: 'var(--color-background-primary, #fff)',
    border: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))',
    borderRadius: 14,
    overflow: 'hidden',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '13px 16px',
    borderBottom: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))',
  },
  listItemLast: { borderBottom: 'none' },
  listName: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text-primary, #111)',
    marginBottom: 2,
  },
  listSub: {
    fontSize: 11,
    color: 'var(--color-text-tertiary, #aaa)',
  },
  listAmt: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text-primary, #111)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    marginLeft: 12,
    flexShrink: 0,
  },

  /* ── Utility ── */
  emptyState: { padding: '24px 16px', textAlign: 'center' },
  muted:      { fontSize: 13, color: 'var(--color-text-tertiary, #aaa)' },
  mutedSmall: { fontSize: 11, color: 'var(--color-text-tertiary, #aaa)', marginTop: 4 },
  errorText:  { fontSize: 13, color: 'var(--color-danger, #c00)' },
};