import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '../lib/api';

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export default function Insights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [from, setFrom] = useState(startOfWeek());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    api.getDashboard(from, to).then(setData).catch((err) => setError(err.message));
  }, [from, to]);

  function handleExport() {
    api.getSales(from, to).then((sales) => {
      const headers = ['Date', 'Customer', 'Phone', 'Item', 'Size', 'Colour', 'Quantity', 'Amount'];
      const rows = sales.map((s) => [
        s.sale_date,
        s.customers?.name || '',
        s.customers?.phone || '',
        s.item,
        s.size || '',
        s.colour || '',
        s.quantity,
        s.amount || '',
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales_${from}_to_${to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }).catch((err) => setError(err.message));
  }

  return (
    <div className="page">
      <div className="date-range">
        <label>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {error && <p className="error-text">{error}</p>}

      {data && (
        <>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <span className="stat-value">{data.totalRevenue.toLocaleString()}</span>
              <span className="stat-label">Revenue (MWK)</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.totalItems}</span>
              <span className="stat-label">Items sold</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.totalOrders}</span>
              <span className="stat-label">Orders</span>
            </div>
          </div>

          <div className="insight-grid">
            <RankList title="Top items" items={data.topItems} />
            <RankList title="Top colours" items={data.topColours} />
            <RankList title="Top sizes" items={data.topSizes} />
          </div>

          <button onClick={handleExport} className="secondary-button full-width" style={{ marginTop: 8 }}>
            <Download size={16} /> Export as CSV
          </button>
        </>
      )}
    </div>
  );
}

function RankList({ title, items }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted-small">No data yet</p>
      ) : (
        <ol className="rank-list">
          {items.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <span className="rank-count">{item.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}