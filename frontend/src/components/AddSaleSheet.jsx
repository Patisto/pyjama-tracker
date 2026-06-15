import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';

const SIZES = ['XS', 'Small', 'Medium', 'Large', 'XL', 'XXL'];

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
  const searchTimeoutRef = useRef(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Search customers when name changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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
      } catch (err) {
        console.error('Failed to search customers:', err);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [form.customerName]);

  function selectCustomer(customer) {
    setForm((f) => ({
      ...f,
      customerName: customer.name,
      customerPhone: customer.phone || '',
    }));
    setShowDropdown(false);
  }

  async function handleSubmit() {
    if (!form.customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.page} onClick={(e) => e.stopPropagation()}>

        {/* Handle bar */}
        <div style={styles.handleWrap}>
          <div style={styles.handle} />
        </div>

        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>New sale</span>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} color="var(--color-muted)" />
          </button>
        </div>

        {/* Scrollable fields */}
        <div style={styles.body}>

          {/* Customer */}
          <div style={styles.section}>
            <p style={styles.sectionLabel}>Customer</p>
            <div style={styles.row}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Name"
                  value={form.customerName}
                  onChange={(e) => update('customerName', e.target.value)}
                  autoFocus
                />
                {showDropdown && customerResults.length > 0 && (
                  <div style={styles.dropdown}>
                    {customerResults.map((customer, index) => (
                      <div
                        key={customer.id}
                        style={{
                          ...styles.dropdownItem,
                          background: hoveredIndex === index ? 'var(--color-bg)' : 'transparent',
                        }}
                        onClick={() => selectCustomer(customer)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(-1)}
                      >
                        <div style={styles.customerName}>{customer.name}</div>
                        {customer.phone && (
                          <div style={styles.customerPhone}>{customer.phone}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                style={{ ...styles.input, flex: '0 0 38%' }}
                type="tel"
                placeholder="Phone"
                inputMode="tel"
                value={form.customerPhone}
                onChange={(e) => update('customerPhone', e.target.value)}
              />
            </div>
          </div>

          {/* Item */}
          <div style={styles.section}>
            <p style={styles.sectionLabel}>Item</p>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. PJ Set, Dress, Top…"
              value={form.item}
              onChange={(e) => update('item', e.target.value)}
            />
          </div>

          {/* Size */}
          <div style={styles.section}>
            <p style={styles.sectionLabel}>Size</p>
            <div style={styles.chipRow}>
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  style={form.size === s ? styles.chipActive : styles.chip}
                  onClick={() => update('size', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colour + Qty */}
          <div style={styles.section}>
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <p style={styles.sectionLabel}>Colour</p>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Blue"
                  value={form.colour}
                  onChange={(e) => update('colour', e.target.value)}
                />
              </div>
              <div style={{ flex: '0 0 80px' }}>
                <p style={styles.sectionLabel}>Qty</p>
                <input
                  style={{ ...styles.input, textAlign: 'center' }}
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => update('quantity', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Price + Date */}
          <div style={styles.section}>
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <p style={styles.sectionLabel}>Price (MWK)</p>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  placeholder="optional"
                  value={form.unitPrice}
                  onChange={(e) => update('unitPrice', e.target.value)}
                />
              </div>
              <div style={{ flex: '0 0 48%' }}>
                <p style={styles.sectionLabel}>Date</p>
                <input
                  style={styles.input}
                  type="date"
                  value={form.saleDate}
                  onChange={(e) => update('saleDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* Save button */}
        <div style={styles.footer}>
          <button
            type="button"
            style={saving ? { ...styles.saveBtn, opacity: 0.6 } : styles.saveBtn}
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

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(43, 42, 40, 0.45)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 50,
  },
  page: {
    background: 'var(--color-bg)',
    borderRadius: '20px 20px 0 0',
    width: '100%',
    maxWidth: '480px',
    height: '78vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'sheet-up 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
    overflow: 'hidden',
  },
  handleWrap: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '10px',
    paddingBottom: '4px',
    flexShrink: 0,
  },
  handle: {
    width: '36px',
    height: '4px',
    borderRadius: '2px',
    background: 'var(--color-border)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 12px',
    flexShrink: 0,
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  section: {
    paddingBottom: '16px',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '4px',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 8px',
  },
  row: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    width: '100%',
    fontFamily: 'inherit',
    fontSize: '1rem',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    boxSizing: 'border-box',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    padding: '7px 14px',
    borderRadius: '20px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-muted)',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  chipActive: {
    padding: '7px 14px',
    borderRadius: '20px',
    border: '1px solid var(--color-accent)',
    background: 'var(--color-accent-soft)',
    color: 'var(--color-accent)',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  error: {
    color: 'var(--color-error)',
    fontSize: '0.85rem',
    margin: '4px 0 0',
  },
  footer: {
    padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
    borderTop: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  saveBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'var(--color-accent)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--color-border)',
    transition: 'background 0.15s ease',
  },
  customerName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: 'var(--color-text)',
  },
  customerPhone: {
    fontSize: '0.8rem',
    color: 'var(--color-muted)',
    marginTop: '2px',
  },
};