import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

function rangeStart() {
  return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function SalesHistory({ refreshKey }) {
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSales(rangeStart(), new Date().toISOString().slice(0, 10))
      .then(setSales)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const groups = sales.reduce((acc, s) => {
    (acc[s.sale_date] ||= []).push(s);
    return acc;
  }, {});

  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="page">
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && dates.length === 0 && (
        <div className="card empty-state">
          <p className="muted">No sales recorded yet.</p>
          <p className="muted-small">Tap the + button to log your first sale.</p>
        </div>
      )}

      {dates.map((date) => (
        <section key={date} className="section">
          <div className="section-header">
            <h3>{formatDate(date)}</h3>
            <span className="muted-small">{groups[date].length} sale{groups[date].length !== 1 ? 's' : ''}</span>
          </div>
          <ul className="list">
            {groups[date].map((s) => (
              <li key={s.id} className="list-item sale-item">
                <div>
                  {s.customer_id ? (
                    <Link to={`/customers/${s.customer_id}`} className="list-item-name link-name">
                      {s.customers?.name || 'Unknown customer'}
                    </Link>
                  ) : (
                    <span className="list-item-name">{s.customers?.name || 'Unknown customer'}</span>
                  )}
                  <span className="list-item-sub">
                    {s.item}{s.colour ? ` · ${s.colour}` : ''} · Size {s.size} · Qty {s.quantity}
                  </span>
                </div>
                {s.amount != null && (
                  <span className="sale-amount">{Number(s.amount).toLocaleString()} MWK</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
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