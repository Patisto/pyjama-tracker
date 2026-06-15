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
  return '2020-01-01'; // Far enough back for all practical purposes
}

function getDateRange(range) {
  const today = new Date().toISOString().slice(0, 10);
  switch (range) {
    case 'month':
      return { from: startOfMonth(), to: today, label: 'This month' };
    case 'all':
      return { from: getAllTimeStart(), to: today, label: 'All time' };
    case 'week':
    default:
      return { from: startOfWeek(), to: today, label: 'This week' };
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export default function Home({ refreshKey }) {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('week');

  const load = useCallback(() => {
    const savedRange = localStorage.getItem('dateRangePreference') || 'week';
    setDateRange(savedRange);
    const { from, to } = getDateRange(savedRange);
    Promise.all([api.getDashboard(from, to), api.getSales(from, to)])
      .then(([dash, sales]) => {
        setData(dash);
        setRecent(sales.slice(0, 5));
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!data) return <div className="page"><p className="muted">Loading…</p></div>;

  const { label } = getDateRange(dateRange);

  return (
    <div className="page">
      <p className="page-greeting">{label}</p>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <Wallet size={16} className="stat-icon" />
          <span className="stat-value">{data.totalRevenue.toLocaleString()}</span>
          <span className="stat-label">Revenue (MWK)</span>
        </div>
        <div className="stat-card">
          <Package size={16} className="stat-icon" />
          <span className="stat-value">{data.totalItems}</span>
          <span className="stat-label">Items sold</span>
        </div>
        <div className="stat-card">
          <TrendingUp size={16} className="stat-icon" />
          <span className="stat-value">{data.totalOrders}</span>
          <span className="stat-label">Orders</span>
        </div>
      </div>

      {/* What's selling */}
      <section className="section">
        <div className="section-header">
          <h3>What's selling</h3>
          <Link to="/insights" className="section-link">
            Full breakdown <ChevronRight size={13} />
          </Link>
        </div>

        <div className="card" style={{ padding: '0 16px' }}>
          <RankRow label="Top item" items={data.topItems} />
          <div className="divider" />
          <RankRow label="Top colour" items={data.topColours} />
          <div className="divider" />
          <RankRow label="Top size" items={data.topSizes} />
        </div>
      </section>

      {/* Recent sales */}
      <section className="section">
        <div className="section-header">
          <h3>Recent sales</h3>
          <Link to="/sales" className="section-link">
            See all <ChevronRight size={13} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="card empty-state">
            <p className="muted">No sales recorded {label.toLowerCase()}.</p>
            <p className="muted-small">Tap the + button to log your first sale.</p>
          </div>
        ) : (
          <ul className="list">
            {recent.map((s) => (
              <li key={s.id} className="list-item sale-item">
                <div>
                  <span className="list-item-name">{s.customers?.name || 'Unknown customer'}</span>
                  <span className="list-item-sub">
                    {s.item}{s.colour ? ` · ${s.colour}` : ''} · Size {s.size}
                  </span>
                </div>
                {s.amount != null && (
                  <span className="sale-amount">
                    {Number(s.amount).toLocaleString()} MWK
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RankRow({ label, items }) {
  const top = items?.[0];
  return (
    <div className="rank-row">
      <span className="rank-label">{label}</span>
      {top ? (
        <span className="rank-value">
          {top.name} <span className="rank-count">×{top.count}</span>
        </span>
      ) : (
        <span className="muted-small">No data yet</span>
      )}
    </div>
  );
}