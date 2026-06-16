import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowDownUp, X } from 'lucide-react';
import { api } from '../lib/api';

const SORT_OPTIONS = [
  { value: 'date_desc',   label: 'Newest first'   },
  { value: 'date_asc',    label: 'Oldest first'    },
  { value: 'amount_desc', label: 'Highest amount'  },
  { value: 'amount_asc',  label: 'Lowest amount'   },
];

function rangeStart() {
  return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function SkeletonItem() {
  return (
    <li style={s.skeletonItem}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...s.skeletonBar, width: 120, height: 13 }} />
        <div style={{ ...s.skeletonBar, width: 180, height: 11, animationDelay: '0.2s' }} />
      </div>
      <div style={{ ...s.skeletonBar, width: 70, height: 13, animationDelay: '0.1s' }} />
    </li>
  );
}

export default function SalesHistory({ refreshKey }) {
  const [sales, setSales]   = useState([]);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortIdx, setSortIdx] = useState(0);

  const sort = SORT_OPTIONS[sortIdx];

  function cycleSort() {
    setSortIdx((i) => (i + 1) % SORT_OPTIONS.length);
  }

  useEffect(() => {
    setLoading(true);
    api.getSales(rangeStart(), new Date().toISOString().slice(0, 10))
      .then(setSales)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? sales.filter((s) => {
          const dateLabel = formatDate(s.sale_date).toLowerCase();
          return (
            (s.customers?.name || '').toLowerCase().includes(q) ||
            (s.item || '').toLowerCase().includes(q) ||
            (s.colour || '').toLowerCase().includes(q) ||
            (s.size || '').toLowerCase().includes(q) ||
            dateLabel.includes(q) ||
            s.sale_date.includes(q)
          );
        })
      : sales;

    return [...list].sort((a, b) => {
      if (sort.value === 'date_desc')   return b.sale_date.localeCompare(a.sale_date);
      if (sort.value === 'date_asc')    return a.sale_date.localeCompare(b.sale_date);
      if (sort.value === 'amount_desc') return (b.amount ?? 0) - (a.amount ?? 0);
      if (sort.value === 'amount_asc')  return (a.amount ?? 0) - (b.amount ?? 0);
      return 0;
    });
  }, [sales, search, sort]);

  const groups = useMemo(() => {
    if (sort.value === 'amount_desc' || sort.value === 'amount_asc') return { _all: filtered };
    return filtered.reduce((acc, s) => {
      (acc[s.sale_date] ||= []).push(s);
      return acc;
    }, {});
  }, [filtered, sort]);

  const dates = useMemo(() => {
    if (sort.value === 'amount_desc' || sort.value === 'amount_asc') return ['_all'];
    return Object.keys(groups).sort((a, b) =>
      sort.value === 'date_asc' ? a.localeCompare(b) : b.localeCompare(a)
    );
  }, [groups, sort]);

  return (
    <div style={s.page}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Search + Sort bar */}
      <div style={s.bar}>
        <div style={s.searchWrap}>
          <Search size={15} style={s.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, item, date…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} style={s.clearBtn}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Cycling sort chip */}
        <button type="button" onClick={cycleSort} style={s.sortChip}>
          <ArrowDownUp size={13} style={{ flexShrink: 0 }} />
          <span>{sort.label}</span>
        </button>
      </div>

      {error && <p style={s.errorText}>{error}</p>}

      {loading && (
        <div style={s.card}>
          {[...Array(5)].map((_, i) => <SkeletonItem key={i} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ ...s.card, ...s.emptyState }}>
          {search ? (
            <>
              <p style={s.muted}>No results for "{search}"</p>
              <p style={s.mutedSmall}>Try a name, item, colour, size, or date like "jun" or "yesterday".</p>
            </>
          ) : (
            <>
              <p style={s.muted}>No sales recorded yet.</p>
              <p style={s.mutedSmall}>Tap + to log your first sale.</p>
            </>
          )}
        </div>
      )}

      {!loading && dates.map((date) => (
        <section key={date} style={s.section}>
          {date !== '_all' && (
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>{formatDate(date)}</h3>
              <span style={s.mutedSmall}>
                {groups[date].length} sale{groups[date].length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <ul style={s.list}>
            {groups[date].map((sale, i) => (
              <li
                key={sale.id}
                style={{
                  ...s.listItem,
                  ...(i === groups[date].length - 1 ? s.listItemLast : {}),
                }}
              >
                <div>
                  {sale.customer_id ? (
                    <Link to={`/customers/${sale.customer_id}`} style={s.listName}>
                      {sale.customers?.name || 'Unknown customer'}
                    </Link>
                  ) : (
                    <span style={s.listName}>{sale.customers?.name || 'Unknown customer'}</span>
                  )}
                  <span style={s.listSub}>
                    {sale.item}{sale.colour ? ` · ${sale.colour}` : ''} · Size {sale.size} · Qty {sale.quantity}
                  </span>
                </div>
                {sale.amount != null && (
                  <span style={s.listAmt}>{Number(sale.amount).toLocaleString()} MWK</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = {
  page: {
    padding: '20px 16px 48px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  /* ── Top bar ── */
  bar: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 11,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-tertiary)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    paddingLeft: 32,
    paddingRight: 30,
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-tertiary)',
    display: 'flex',
    padding: 2,
  },

  /* ── Cycling sort chip — purple to match Home orders card ── */
  sortChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
    padding: '0 11px',
    height: 36,
    borderRadius: 99,
    border: 'none',
    cursor: 'pointer',
    background: '#EEEDFE',
    color: '#3C3489',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s',
  },

  /* ── Section ── */
  section: { marginBottom: 20 },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: '0 2px',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary, #666)',
    margin: 0,
  },

  /* ── Card / list ── */
  card: {
    background: 'var(--color-background-primary, #fff)',
    border: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))',
    borderRadius: 14,
    overflow: 'hidden',
  },
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
    textDecoration: 'none',
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

  /* ── Skeleton ── */
  skeletonItem: {
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
  },
  skeletonBar: {
    borderRadius: 4,
    background: 'var(--color-border-tertiary)',
    animation: 'pulse 1.4s ease-in-out infinite',
  },

  /* ── Utility ── */
  emptyState: { padding: '24px 16px', textAlign: 'center' },
  muted:      { fontSize: 13, color: 'var(--color-text-tertiary, #aaa)' },
  mutedSmall: { fontSize: 11, color: 'var(--color-text-tertiary, #aaa)', marginTop: 4 },
  errorText:  { fontSize: 13, color: 'var(--color-danger, #c00)' },
};