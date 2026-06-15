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

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCustomer(id).then(setCustomer).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!customer) return <div className="page"><p className="muted">Loading…</p></div>;

  const totalSpent = customer.sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  return (
    <div className="page">
      <h1 style={{ fontSize: '1.6rem', fontWeight: '700', margin: '0 0 12px' }}>{customer.name}</h1>

      {/* Phone / WhatsApp */}
      {customer.phone ? (
        <a
          href={whatsappLink(customer.phone)}
          target="_blank"
          rel="noreferrer"
          className="whatsapp-link inline-link"
          style={{ marginBottom: 16, display: 'inline-flex' }}
        >
          <MessageCircle size={14} /> {customer.phone}
        </a>
      ) : (
        <p className="muted-small" style={{ marginBottom: 16 }}>No phone on file</p>
      )}

      {/* Summary stats */}
      <div className="card stat-row" style={{ marginBottom: 24 }}>
        <div>
          <span className="stat-value">{customer.sales.length}</span>
          <span className="stat-label">Orders</span>
        </div>
        <div>
          <span className="stat-value">{totalSpent.toLocaleString()}</span>
          <span className="stat-label">Total spent (MWK)</span>
        </div>
      </div>

      {/* Order history */}
      <section className="section">
        <div className="section-header">
          <h3>Order history</h3>
          <span className="muted-small">{customer.sales.length} order{customer.sales.length !== 1 ? 's' : ''}</span>
        </div>

        {customer.sales.length === 0 ? (
          <div className="card empty-state">
            <p className="muted">No orders recorded yet.</p>
          </div>
        ) : (
          <ul className="list">
            {customer.sales.map((s) => (
              <li key={s.id} className="list-item sale-item">
                <div>
                  <span className="list-item-name">
                    {s.item}{s.colour ? ` · ${s.colour}` : ''} · Size {s.size}
                  </span>
                  <span className="list-item-sub">
                    {formatDate(s.sale_date)} · Qty {s.quantity}
                  </span>
                </div>
                {s.amount != null && (
                  <span className="sale-amount">{Number(s.amount).toLocaleString()} MWK</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}