import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';

const SIZES = ['XS', 'Small', 'Medium', 'Large', 'XL', 'XXL'];

const COLOURS = [
  { name: 'Black',  hex: '#1a1a1a' },
  { name: 'White',  hex: '#f0f0f0' },
  { name: 'Navy',   hex: '#1B3A6B' },
  { name: 'Red',    hex: '#C0392B' },
  { name: 'Green',  hex: '#27500A' },
  { name: 'Pink',   hex: '#ED93B1' },
  { name: 'Grey',   hex: '#888780' },
  { name: 'Brown',  hex: '#6B3A2A' },
  { name: 'Yellow', hex: '#EF9F27' },
  { name: 'Purple', hex: '#534AB7' },
];

export default function AddSaleSheet({ onClose, onSaved }) {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    item: '',
    size: 'Medium',
    colour: '',
    quantity: 1,
    unitPrice: '',
    saleDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [showDate, setShowDate] = useState(false);
  const searchTimeoutRef = useRef(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    clearTimeout(searchTimeoutRef.current);
    if (form.customerName.trim().length < 2) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.getCustomers(form.customerName);
        setCustomerResults(results);
        setShowDropdown(results.length > 0);
      } catch {}
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [form.customerName]);

  function selectCustomer(customer) {
    setForm((f) => ({ ...f, customerName: customer.name, customerPhone: customer.phone || '' }));
    setShowDropdown(false);
  }

  async function handleSubmit() {
    if (!form.customerName.trim()) { setError('Customer name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.recordSale(form);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <style>{`
        @keyframes sheet-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        .colour-dot { width:32px;height:32px;border-radius:50%;cursor:pointer;flex-shrink:0;transition:transform 0.1s;border:none;padding:0; }
        .colour-dot:active { transform:scale(0.88) }
        .chip { padding:9px 16px;border-radius:20px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.12s }
        .nudge-btn { background:none;border:none;color:var(--color-text-tertiary,#aaa);font-size:12px;padding:8px 0 0;cursor:pointer;font-family:inherit;text-align:left; }
        .nudge-btn:active { opacity:0.6 }
      `}</style>

      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>

        <div style={s.handleWrap}><div style={s.handle} /></div>

        <div style={s.header}>
          <span style={s.title}>New sale</span>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div style={s.body}>

          {/* Customer */}
          <div style={s.section}>
            <p style={s.label}>Customer</p>
            <div style={s.row}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Name"
                  value={form.customerName}
                  onChange={(e) => update('customerName', e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
                {showDropdown && customerResults.length > 0 && (
                  <div style={s.dropdown}>
                    {customerResults.map((c, i) => (
                      <div
                        key={c.id}
                        style={{ ...s.dropdownItem, background: hoveredIndex === i ? 'var(--color-background-secondary)' : 'transparent' }}
                        onClick={() => selectCustomer(c)}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(-1)}
                      >
                        <div style={s.dropName}>{c.name}</div>
                        {c.phone && <div style={s.dropPhone}>{c.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                style={{ ...s.input, flex: '0 0 38%' }}
                type="tel"
                placeholder="Phone"
                inputMode="tel"
                value={form.customerPhone}
                onChange={(e) => update('customerPhone', e.target.value)}
              />
            </div>
          </div>

          {/* Item */}
          <div style={s.section}>
            <p style={s.label}>Item</p>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. PJ Set, Dress, Top…"
              value={form.item}
              onChange={(e) => update('item', e.target.value)}
            />
          </div>

          {/* Size */}
          <div style={s.section}>
            <p style={s.label}>Size</p>
            <div style={s.chipRow}>
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className="chip"
                  style={form.size === sz ? s.chipActive : s.chip}
                  onClick={() => update('size', sz)}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Colour */}
          <div style={s.section}>
            <p style={s.label}>Colour</p>
            <div style={s.dotRow}>
              {COLOURS.map((c) => {
                const active = form.colour === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    className="colour-dot"
                    title={c.name}
                    aria-label={c.name}
                    style={{
                      background: c.hex,
                      outline: active ? `3px solid #3C3489` : '3px solid transparent',
                      outlineOffset: 2,
                      boxShadow: c.name === 'White' ? 'inset 0 0 0 1.5px #ccc' : 'none',
                    }}
                    onClick={() => update('colour', active ? '' : c.name)}
                  />
                );
              })}
            </div>
            <input
              style={{ ...s.input, marginTop: 10 }}
              type="text"
              placeholder="Or type a colour…"
              value={form.colour}
              onChange={(e) => update('colour', e.target.value)}
            />
          </div>

          {/* Price + Qty */}
          <div style={{ ...s.section, borderBottom: 'none' }}>
            <div style={s.row}>
              <div style={{ flex: 1 }}>
                <p style={s.label}>Price (MWK)</p>
                <input
                  style={s.input}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="optional"
                  value={form.unitPrice}
                  onChange={(e) => update('unitPrice', e.target.value)}
                />
              </div>
              <div style={{ flex: '0 0 30%' }}>
                <p style={s.label}>Qty</p>
                <input
                  style={{ ...s.input, textAlign: 'center' }}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => update('quantity', e.target.value)}
                />
              </div>
            </div>

            {/* Date — hidden by default */}
            {showDate ? (
              <div style={{ marginTop: 14 }}>
                <p style={s.label}>Date</p>
                <input
                  style={s.input}
                  type="date"
                  value={form.saleDate}
                  onChange={(e) => update('saleDate', e.target.value)}
                />
              </div>
            ) : (
              <button
                type="button"
                className="nudge-btn"
                onClick={() => setShowDate(true)}
              >
                Sale date: today — change?
              </button>
            )}
          </div>

          {error && <p style={s.error}>{error}</p>}

        </div>

        <div style={s.footer}>
          <button
            type="button"
            style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save sale'}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(12,26,46,0.55)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 50,
  },
  sheet: {
    background: 'var(--color-background-primary, #fff)',
    borderRadius: '20px 20px 0 0',
    width: '100%',
    maxWidth: 480,
    height: '92vh',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'sheet-up 0.25s cubic-bezier(0.32,0.72,0,1)',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  handleWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 0 4px',
    flexShrink: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: 'var(--color-border-tertiary, #ddd)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 12px',
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--color-text-primary, #111)',
  },
  closeBtn: {
    background: 'var(--color-background-secondary, #f5f5f5)',
    border: 'none',
    padding: 6,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: 'var(--color-text-tertiary, #aaa)',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    WebkitOverflowScrolling: 'touch',
  },
  section: {
    paddingBottom: 16,
    borderBottom: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--color-text-tertiary, #aaa)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '0 0 8px',
  },
  row: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    width: '100%',
    fontFamily: 'inherit',
    fontSize: 15,
    padding: '10px 12px',
    border: '0.5px solid var(--color-border-secondary, rgba(0,0,0,0.15))',
    borderRadius: 10,
    background: 'var(--color-background-secondary, #f8f8f8)',
    color: 'var(--color-text-primary, #111)',
    boxSizing: 'border-box',
    outline: 'none',
    WebkitAppearance: 'none',
  },

  /* Size chips */
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    border: '0.5px solid var(--color-border-secondary, rgba(0,0,0,0.15))',
    background: 'var(--color-background-secondary, #f8f8f8)',
    color: 'var(--color-text-secondary, #666)',
  },
  chipActive: {
    border: '1.5px solid #3C3489',
    background: '#EEEDFE',
    color: '#3C3489',
    fontWeight: 600,
  },

  /* Colour dots */
  dotRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },

  /* Footer — clears the 64px NavBar + safe area */
  footer: {
    padding: '12px 16px',
    paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)',
    borderTop: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))',
    flexShrink: 0,
    background: 'var(--color-background-primary, #fff)',
  },
  saveBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    background: '#0C1A2E',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  },

  /* Customer dropdown */
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--color-background-primary, #fff)',
    border: '0.5px solid var(--color-border-secondary, rgba(0,0,0,0.15))',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 200,
    overflowY: 'auto',
    zIndex: 10,
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))',
  },
  dropName:  { fontWeight: 500, fontSize: 14, color: 'var(--color-text-primary, #111)' },
  dropPhone: { fontSize: 12, color: 'var(--color-text-tertiary, #aaa)', marginTop: 2 },

  error: { color: '#A32D2D', fontSize: 13, margin: '4px 0 0' },
};