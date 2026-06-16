import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { api } from '../lib/api';

function whatsappLink(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `265${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.getCustomer(id).then(setCustomer).catch((err) => setError(err.message));
  }, [id]);

  if (error)    return <div style={s.page}><p style={s.errorText}>{error}</p></div>;
  if (!customer) return <div style={s.page}><p style={s.muted}>Loading…</p></div>;

  const totalSpent = customer.sales.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
  const initials   = customer.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const waLink     = whatsappLink(customer.phone);

  return (
    <div style={s.page}>

      {/* Avatar + name */}
      <div style={s.heroRow}>
        <div style={s.avatar}>{initials}</div>
        <div>
          <h1 style={s.name}>{customer.name}</h1>
          {customer.phone ? (
            <a href={waLink} target="_blank" rel="noreferrer" style={s.waLink}>
              <MessageCircle size={13} style={{ flexShrink: 0 }} />
              {customer.phone}
            </a>
          ) : (
            <p style={s.noPhone}>No phone on file</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={s.statGrid}>
        <div style={{ ...s.statCard, ...s.statPurple }}>
          <span style={{ ...s.statNum, ...s.statNumPurple }}>{customer.sales.length}</span>
          <span style={{ ...s.statLabel, ...s.statLabelPurple }}>Orders</span>
        </div>
        <div style={s.heroCard}>
          <span style={s.heroNum}>{totalSpent.toLocaleString()}</span>
          <span style={s.heroLabel}>Total spent (MWK)</span>
          <div style={s.heroStripe} />
        </div>
      </div>

      {/* Order history */}
      <section>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Order history</h3>
          <span style={s.mutedSmall}>
            {customer.sales.length} order{customer.sales.length !== 1 ? 's' : ''}
          </span>
        </div>

        {customer.sales.length === 0 ? (
          <div style={{ ...s.card, ...s.emptyState }}>
            <p style={s.muted}>No orders recorded yet.</p>
          </div>
        ) : (
          <ul style={s.list}>
            {customer.sales.map((sale, i) => (
              <li
                key={sale.id}
                style={{
                  ...s.listItem,
                  ...(i === customer.sales.length - 1 ? s.listItemLast : {}),
                }}
              >
                <div>
                  <span style={s.listName}>
                    {sale.item}{sale.colour ? ` · ${sale.colour}` : ''} · Size {sale.size}
                  </span>
                  <span style={s.listSub}>
                    {formatDate(sale.sale_date)} · Qty {sale.quantity}
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

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = {
  page: {
    padding: '20px 16px 48px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  /* ── Hero row ── */
  heroRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: '#EEEDFE',
    color: '#3C3489',
    fontSize: 18,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--color-text-primary, #111)',
    margin: '0 0 4px',
  },
  waLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 13,
    color: '#0F6E56',
    textDecoration: 'none',
    fontWeight: 500,
  },
  noPhone: {
    fontSize: 12,
    color: 'var(--color-text-tertiary, #aaa)',
    margin: 0,
  },

  /* ── Stat grid ── */
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 14,
    padding: '16px 14px 14px',
  },
  statPurple: { background: '#EEEDFE' },
  statNum: {
    display: 'block',
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1,
    marginBottom: 5,
    fontVariantNumeric: 'tabular-nums',
  },
  statNumPurple: { color: '#3C3489' },
  statLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  statLabelPurple: { color: '#534AB7' },

  /* Revenue hero card */
  heroCard: {
    background: '#0C1A2E',
    borderRadius: 14,
    padding: '16px 14px 14px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroNum: {
    display: 'block',
    fontSize: 24,
    fontWeight: 500,
    color: '#fff',
    letterSpacing: '-0.02em',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    marginBottom: 5,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#378ADD',
  },
  heroStripe: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    background: '#378ADD',
    borderRadius: '0 0 14px 14px',
  },

  /* ── Section ── */
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

  /* ── List ── */
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
  mutedSmall: { fontSize: 11, color: 'var(--color-text-tertiary, #aaa)' },
  errorText:  { fontSize: 13, color: '#A32D2D' },
};