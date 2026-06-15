import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Users } from 'lucide-react';
import { api } from '../lib/api';

function whatsappLink(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `265${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(), 250);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadCustomers() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCustomers(search);
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="search-wrap">
        <Search size={16} className="search-icon" />
        <input
          type="search"
          className="search-input"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && customers.length === 0 && (
        <div className="card empty-state">
          <Users size={28} className="empty-icon" />
          <p className="muted">No customers found.</p>
          <p className="muted-small">Customers are added automatically when you record a sale.</p>
        </div>
      )}

      <ul className="list">
        {customers.map((c) => (
          <li key={c.id} className="list-item">
            <Link to={`/customers/${c.id}`} className="list-item-main">
              <span className="list-item-name">{c.name}</span>
              <span className="list-item-sub">{c.phone || 'No phone on file'}</span>
              {c.sales_count !== undefined && (
                <span className="list-item-sub" style={{ color: 'var(--color-accent)', fontWeight: '500' }}>
                  {c.sales_count} order{c.sales_count !== 1 ? 's' : ''}
                </span>
              )}
            </Link>
            {c.phone && (
              <a
                href={whatsappLink(c.phone)}
                target="_blank"
                rel="noreferrer"
                className="whatsapp-link"
                aria-label={`Message ${c.name} on WhatsApp`}
              >
                <MessageCircle size={16} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}