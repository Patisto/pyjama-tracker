import { useEffect, useState } from 'react';
import { Download, TrendingUp, ShoppingBag, Receipt, Users, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
function today()       { return new Date().toISOString().slice(0, 10); }
function daysAgo(n)    { return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10); }
function monthStart()  {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function fmtDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PRESETS = [
  { label: 'This week',    getRange: () => ({ from: startOfWeek(), to: today() }) },
  { label: 'This month',   getRange: () => ({ from: monthStart(),  to: today() }) },
  { label: 'Last 30 days', getRange: () => ({ from: daysAgo(30),   to: today() }) },
  { label: 'Last 90 days', getRange: () => ({ from: daysAgo(90),   to: today() }) },
];

/* ── Palette aligned to Home ── */
const C = {
  revenue:      { bg: '#0C1A2E', num: '#ffffff', label: '#378ADD', stripe: '#378ADD' },
  items:        { bg: '#EAF3DE', num: '#27500A', label: '#3B6D11' },
  orders:       { bg: '#EEEDFE', num: '#3C3489', label: '#534AB7' },
  avg:          { bg: '#FAECE7', num: '#712B13', label: '#993C1D' },
  topItems:     { bar: '#378ADD', track: '#B5D4F4', accent: '#185FA5' },
  topColours:   { bar: '#27500A', track: '#C0DD97', accent: '#3B6D11' },
  topSizes:     { bar: '#3C3489', track: '#CECBF6', accent: '#534AB7' },
  topCustomers: { bar: '#712B13', track: '#F5C4B3', accent: '#993C1D' },
};

function BarChart({ items, palette }) {
  if (!items?.length)
    return <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', padding: '4px 0' }}>No data</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, idx) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', width: 14, textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', width: 76, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          <div style={{ flex: 1, background: palette.track, borderRadius: 99, height: 7, overflow: 'hidden' }}>
            <div style={{ width: `${(item.count / max) * 100}%`, height: '100%', background: palette.bar, borderRadius: 99, transition: 'width 0.6s ease' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', width: 22, textAlign: 'right', flexShrink: 0 }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, palette }) {
  const isRevenue = palette === C.revenue;
  return (
    <div style={{
      background: palette.bg,
      borderRadius: 14,
      padding: '16px 14px 14px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Icon size={14} style={{ color: palette.label, display: 'block', marginBottom: 10 }} />
      <span style={{ display: 'block', fontSize: isRevenue ? 26 : 26, fontWeight: 500, color: palette.num, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 5 }}>
        {value}
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: palette.label }}>
        {sub ? `${label} (${sub})` : label}
      </span>
      {isRevenue && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: palette.stripe, borderRadius: '0 0 14px 14px' }} />}
    </div>
  );
}

function InsightCard({ title, palette, children }) {
  return (
    <div style={{
      background: 'var(--color-background-primary, #fff)',
      border: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))',
      borderRadius: 14,
      padding: '14px 16px',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <div style={{ width: 3, height: 14, background: palette.bar, borderRadius: 99 }} />
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function SkeletonBar({ w, h = 7 }) {
  return <div style={{ width: w, height: h, borderRadius: 99, background: 'var(--color-border-tertiary)', animation: 'ins-pulse 1.4s ease-in-out infinite' }} />;
}

/* ══════════════════════════════════════════════════════
   PDF GENERATOR
══════════════════════════════════════════════════════ */
async function generatePDF({ data, from, to, topCustomers }) {
  const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1');
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw   = doc.internal.pageSize.getWidth();   // 210
  const ph   = doc.internal.pageSize.getHeight();  // 297
  const ml   = 14;
  const mr   = pw - 14;
  const cw   = mr - ml;                            // content width

  // ── helpers ──────────────────────────────────────────
  const navy   = [12, 26, 46];
  const blue   = [55, 138, 221];
  const white  = [255, 255, 255];
  const offW   = [245, 247, 250];
  const ink    = [17, 17, 24];
  const mid    = [100, 105, 115];
  const faint  = [210, 215, 225];

  function setColor(rgb, type = 'fill') {
    if (type === 'fill') doc.setFillColor(...rgb);
    else doc.setTextColor(...rgb);
  }

  function text(str, x, y, opts = {}) {
    doc.text(String(str), x, y, opts);
  }

  function hline(y, lx = ml, rx = mr, rgb = faint) {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(0.2);
    doc.line(lx, y, rx, y);
  }

  // ── COVER HEADER ─────────────────────────────────────
  // Navy band
  setColor(navy);
  doc.rect(0, 0, pw, 42, 'F');

  // Blue accent stripe at top
  setColor(blue);
  doc.rect(0, 0, pw, 2, 'F');

  // App name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(blue, 'text');
  text('PJ TRACKER', ml, 13);

  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setColor(white, 'text');
  text('Sales Insights', ml, 26);

  // Date range
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor([120, 160, 210], 'text');
  text(`${fmtDate(from)}  –  ${fmtDate(to)}`, ml, 35);

  // Generated date (right-aligned)
  const genDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  text(`Generated ${genDate}`, mr, 35, { align: 'right' });

  let y = 56;

  // ── STAT CARDS ───────────────────────────────────────
  const avgOrder = data.totalOrders > 0
    ? Math.round(data.totalRevenue / data.totalOrders).toLocaleString()
    : '—';

  const stats = [
    { label: 'Revenue',   value: data.totalRevenue.toLocaleString(), sub: 'MWK', rgb: navy,          labelRgb: blue },
    { label: 'Items sold', value: String(data.totalItems),           sub: null,  rgb: [234,243,222],  labelRgb: [39,80,10] },
    { label: 'Orders',     value: String(data.totalOrders),          sub: null,  rgb: [238,237,254],  labelRgb: [60,52,137] },
    { label: 'Avg order',  value: avgOrder,                          sub: 'MWK', rgb: [250,236,231],  labelRgb: [113,43,19] },
  ];

  const cardW = (cw - 9) / 4;  // 4 cards, 3 gaps of 3mm
  stats.forEach((stat, i) => {
    const cx = ml + i * (cardW + 3);
    const isRevenue = i === 0;

    setColor(stat.rgb);
    doc.roundedRect(cx, y, cardW, 24, 2, 2, 'F');

    // Blue stripe on revenue card
    if (isRevenue) {
      setColor(blue);
      doc.roundedRect(cx, y + 21, cardW, 3, 1, 1, 'F');
    }

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setColor(stat.labelRgb, 'text');
    text(stat.sub ? `${stat.label} (${stat.sub})` : stat.label, cx + 4, y + 8);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isRevenue ? 12 : 11);
    setColor(isRevenue ? white : stat.labelRgb, 'text');
    text(stat.value, cx + 4, y + 18);
  });

  y += 32;

  // ── SECTION RENDERER ─────────────────────────────────
  function renderBarSection(title, items, barRgb, trackRgb) {
    if (!items?.length) return;
    if (y > 240) { doc.addPage(); y = 20; }

    // Section title with left accent bar
    setColor(barRgb);
    doc.roundedRect(ml, y, 2.5, 10, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(ink, 'text');
    text(title, ml + 6, y + 7);
    y += 16;

    const maxCount = Math.max(...items.map((i) => i.count), 1);
    const barStart = ml + 48;
    const barEnd   = mr - 12;
    const barW     = barEnd - barStart;

    items.forEach((item, idx) => {
      if (y > 262) { doc.addPage(); y = 20; }

      // Row bg (alternating)
      if (idx % 2 === 0) {
        setColor(offW);
        doc.roundedRect(ml, y - 1, cw, 7.5, 1, 1, 'F');
      }

      // Rank
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setColor(mid, 'text');
      text(String(idx + 1), ml + 4, y + 4.5, { align: 'right' });

      // Name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor(ink, 'text');
      const name = String(item.name).slice(0, 18);
      text(name, ml + 8, y + 4.5);

      // Track
      setColor(trackRgb);
      doc.roundedRect(barStart, y + 1, barW, 4, 1, 1, 'F');

      // Fill
      const fillW = Math.max((item.count / maxCount) * barW, 2);
      setColor(barRgb);
      doc.roundedRect(barStart, y + 1, fillW, 4, 1, 1, 'F');

      // Count
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setColor(ink, 'text');
      text(String(item.count), mr, y + 4.5, { align: 'right' });

      y += 8;
    });

    y += 6;
  }

  renderBarSection('Top items',   data.topItems,   [55,138,221],  [181,212,244]);
  renderBarSection('Top colours', data.topColours, [39,80,10],    [192,221,151]);
  renderBarSection('Top sizes',   data.topSizes,   [60,52,137],   [206,203,246]);

  // ── TOP CUSTOMERS ─────────────────────────────────────
  if (topCustomers?.length) {
    if (y > 220) { doc.addPage(); y = 20; }

    setColor([113, 43, 19]);
    doc.roundedRect(ml, y, 2.5, 10, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(ink, 'text');
    text('Top customers', ml + 6, y + 7);
    y += 16;

    topCustomers.slice(0, 5).forEach((c, idx) => {
      if (y > 262) { doc.addPage(); y = 20; }

      if (idx % 2 === 0) {
        setColor(offW);
        doc.roundedRect(ml, y - 1, cw, 9, 1, 1, 'F');
      }

      // Avatar circle
      setColor([250, 236, 231]);
      doc.circle(ml + 5, y + 3.5, 3.5, 'F');
      const initials = (c.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      setColor([113, 43, 19], 'text');
      text(initials, ml + 5, y + 5, { align: 'center' });

      // Name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setColor(ink, 'text');
      text(String(c.name || ''), ml + 11, y + 4);

      // Orders
      const orders = c.order_count ?? c.orders ?? null;
      if (orders != null) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setColor(mid, 'text');
        text(`${orders} order${orders !== 1 ? 's' : ''}`, ml + 11, y + 8);
      }

      // Spent
      const spent = c.total_spent ?? c.total ?? null;
      if (spent != null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        setColor(ink, 'text');
        text(`${Number(spent).toLocaleString()} MWK`, mr, y + 4, { align: 'right' });
      }

      y += 10;
    });
  }

  // ── FOOTER ───────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    hline(ph - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(mid, 'text');
    text('PJ Tracker  ·  Sales Report', ml, ph - 7);
    text(`Page ${p} of ${totalPages}`, mr, ph - 7, { align: 'right' });
  }

  doc.save(`pj_insights_${from}_to_${to}.pdf`);
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function Insights() {
  const [data, setData]           = useState(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [from, setFrom]           = useState(startOfWeek());
  const [to, setTo]               = useState(today());
  const [activePreset, setActivePreset] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    api.getDashboard(from, to)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [from, to]);

  function applyPreset(idx) {
    setActivePreset(idx);
    const { from: f, to: t } = PRESETS[idx].getRange();
    setFrom(f); setTo(t);
  }

  function handleExportCSV() {
    api.getSales(from, to).then((sales) => {
      const headers = ['Date','Customer','Phone','Item','Size','Colour','Quantity','Amount'];
      const rows = sales.map((s) => [
        s.sale_date, s.customers?.name||'', s.customers?.phone||'',
        s.item, s.size||'', s.colour||'', s.quantity, s.amount||'',
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g,'""')}"`).join(','))
        .join('\n');
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
        download: `sales_${from}_to_${to}.csv`,
      });
      a.click();
    }).catch((err) => setError(err.message));
  }

  async function handleExportPDF() {
    if (!data) return;
    setExporting(true);
    try {
      await generatePDF({ data, from, to, topCustomers: data.topCustomers ?? [] });
    } catch (e) {
      setError('PDF export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  const avgOrder = data && data.totalOrders > 0
    ? Math.round(data.totalRevenue / data.totalOrders).toLocaleString()
    : null;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes ins-pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .ins-chip{padding:7px 14px;border-radius:99px;font-size:13px;border:.5px solid var(--color-border-tertiary);background:var(--color-background-primary);color:var(--color-text-secondary);cursor:pointer;white-space:nowrap;flex-shrink:0;font-family:inherit;transition:all .15s}
        .ins-chip.active{border-color:#3C3489;color:#3C3489;background:#EEEDFE;font-weight:600}
        .ins-date-field input[type="date"]{border:none;background:transparent;font-size:13px;color:var(--color-text-primary);padding:0;width:100%;outline:none;box-shadow:none}
      `}</style>

      {/* Preset chips */}
      <div style={s.presets}>
        {PRESETS.map((p, i) => (
          <button key={p.label} type="button" className={`ins-chip${activePreset === i ? ' active' : ''}`} onClick={() => applyPreset(i)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div style={s.dateRow}>
        <div style={s.dateField}>
          <span style={s.dateLabel}>From</span>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setActivePreset(-1); }} />
        </div>
        <div style={{ ...s.dateField, borderLeft: '0.5px solid var(--color-border-tertiary)' }}>
          <span style={s.dateLabel}>To</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setActivePreset(-1); }} />
        </div>
      </div>

      {error && <p style={s.errorText}>{error}</p>}

      {/* Skeleton */}
      {loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: 'var(--color-background-secondary)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SkeletonBar w={60} /><SkeletonBar w={80} h={18} />
              </div>
            ))}
          </div>
          {[...Array(3)].map((_, i) => (
            <InsightCard key={i} title="" palette={C.topItems}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(3)].map((_, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <SkeletonBar w={80} /><SkeletonBar w="100%" /><SkeletonBar w={20} />
                  </div>
                ))}
              </div>
            </InsightCard>
          ))}
        </>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <StatCard icon={TrendingUp} label="Revenue"   value={data.totalRevenue.toLocaleString()} sub="MWK" palette={C.revenue} />
            <StatCard icon={ShoppingBag} label="Items sold" value={data.totalItems} palette={C.items} />
            <StatCard icon={Receipt}    label="Orders"    value={data.totalOrders}  palette={C.orders} />
            {avgOrder && <StatCard icon={BarChart2} label="Avg. order" value={avgOrder} sub="MWK" palette={C.avg} />}
          </div>

          <InsightCard title="Top items"   palette={C.topItems}>
            <BarChart items={data.topItems}   palette={C.topItems} />
          </InsightCard>
          <InsightCard title="Top colours" palette={C.topColours}>
            <BarChart items={data.topColours} palette={C.topColours} />
          </InsightCard>
          <InsightCard title="Top sizes"   palette={C.topSizes}>
            <BarChart items={data.topSizes}   palette={C.topSizes} />
          </InsightCard>

          {data.topCustomers?.length > 0 && (
            <InsightCard title="Top customers" palette={C.topCustomers}>
              {data.topCustomers.slice(0, 5).map((c, idx) => {
                const initials = (c.name||'?').split(' ').map((w)=>w[0]).join('').slice(0,2).toUpperCase();
                const spent  = c.total_spent ?? c.total ?? null;
                const orders = c.order_count ?? c.orders ?? null;
                return (
                  <div key={c.id||c.name} style={s.custRow}>
                    <span style={s.custRank}>{idx+1}</span>
                    <div style={s.custAvatar}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {c.id ? (
                        <Link to={`/customers/${c.id}`} style={s.custName}>{c.name}</Link>
                      ) : (
                        <span style={s.custName}>{c.name}</span>
                      )}
                      {orders != null && <span style={s.custSub}>{orders} order{orders!==1?'s':''}</span>}
                    </div>
                    {spent != null && (
                      <span style={s.custSpent}>
                        {Number(spent).toLocaleString()} <span style={s.custCurrency}>MWK</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </InsightCard>
          )}

          {/* Export buttons */}
          <div style={s.exportRow}>
            <button type="button" style={s.btnCSV} onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
            <button type="button" style={{ ...s.btnPDF, opacity: exporting ? 0.6 : 1 }} onClick={handleExportPDF} disabled={exporting}>
              <Download size={14} /> {exporting ? 'Generating…' : 'Export PDF'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = {
  page: {
    padding: '20px 16px 48px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  presets: {
    display: 'flex',
    gap: 6,
    marginBottom: 14,
    overflowX: 'auto',
    paddingBottom: 2,
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
  },
  dateRow: {
    display: 'flex',
    background: 'var(--color-background-primary, #fff)',
    border: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  dateField: {
    flex: 1,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--color-text-tertiary, #aaa)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },

  /* ── Customer rows ── */
  custRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 0',
    borderBottom: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))',
  },
  custRank: { fontSize: 11, color: '#993C1D', width: 14, textAlign: 'right', flexShrink: 0, fontWeight: 600 },
  custAvatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: '#FAECE7', border: '0.5px solid #F5C4B3',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600, color: '#712B13', flexShrink: 0,
  },
  custName: {
    fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #111)',
    textDecoration: 'none', display: 'block',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  custSub:      { fontSize: 11, color: '#993C1D' },
  custSpent:    { fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary, #111)', flexShrink: 0 },
  custCurrency: { fontWeight: 400, color: '#993C1D', fontSize: 10 },

  /* ── Export ── */
  exportRow: { display: 'flex', gap: 8, marginTop: 4 },
  btnCSV: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 16px', fontSize: 13, fontWeight: 500,
    borderRadius: 10, border: '0.5px solid #C0DD97',
    background: '#EAF3DE', color: '#27500A',
    cursor: 'pointer', flex: 1, fontFamily: 'inherit',
  },
  btnPDF: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 16px', fontSize: 13, fontWeight: 500,
    borderRadius: 10, border: '0.5px solid #B5D4F4',
    background: '#E6F1FB', color: '#0C447C',
    cursor: 'pointer', flex: 1, fontFamily: 'inherit',
  },

  errorText: { fontSize: 13, color: '#A32D2D' },
};