export default function Privacy() {
  return (
    <div style={s.page}>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Data collection</h3>
        <p style={s.cardBody}>
          PJ Tracker only stores the data you enter: customer names, phone numbers, sales records,
          and related business information. All data is stored securely in Supabase with row-level
          security to ensure you can only access your own data.
        </p>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Data usage</h3>
        <p style={s.cardBody}>
          Your data is used solely for the purpose of tracking your sales and customers. We do not
          sell, share, or use your data for any other purposes. You can delete your account and all
          associated data at any time from the Account page.
        </p>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Authentication</h3>
        <p style={s.cardBody}>
          Authentication is handled by Supabase Auth. Your email and password are encrypted and
          stored securely. We do not have access to your password.
        </p>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Installing as PWA</h3>
        <p style={{ ...s.cardBody, marginBottom: 12 }}>
          Install PJ Tracker as an app on your device for a better experience:
        </p>
        <div style={s.pwaList}>
          <div style={s.pwaRow}>
            <span style={s.pwaPlatform}>iPhone / iPad</span>
            <span style={s.pwaStep}>Tap Share → Add to Home Screen</span>
          </div>
          <div style={s.divider} />
          <div style={s.pwaRow}>
            <span style={s.pwaPlatform}>Android</span>
            <span style={s.pwaStep}>Tap ⋮ → Install App / Add to Home Screen</span>
          </div>
          <div style={s.divider} />
          <div style={s.pwaRow}>
            <span style={s.pwaPlatform}>Desktop</span>
            <span style={s.pwaStep}>Click install icon in address bar</span>
          </div>
        </div>
      </div>

      {/* Contact — navy hero treatment */}
      <div style={s.contactCard}>
        <span style={s.contactLabel}>Developer</span>
        <p style={s.contactName}>Patrick Solomon</p>
        <p style={s.contactRole}>Software developer · AI engineer</p>
        <p style={s.contactDetail}>Blantyre, Malawi</p>
        <div style={s.contactLinks}>
          <a href="tel:+265894087222" style={s.contactLink}>+265 894 08 72 22</a>
          <span style={s.contactDot}>·</span>
          <a href="tel:+265987229452" style={s.contactLink}>+265 987 22 94 52</a>
        </div>
        <div style={s.heroStripe} />
      </div>

    </div>
  );
}

const s = {
  page: {
    padding: '20px 16px 48px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  card: {
    background: 'var(--color-background-primary, #fff)',
    border: '0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))',
    borderRadius: 14,
    padding: '16px',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-primary, #111)',
    margin: '0 0 8px',
  },
  cardBody: {
    fontSize: 13,
    color: 'var(--color-text-secondary, #666)',
    lineHeight: 1.6,
    margin: 0,
  },

  /* PWA install rows */
  pwaList: {
    background: 'var(--color-background-secondary, #f8f8f8)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pwaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    padding: '10px 12px',
  },
  pwaPlatform: {
    fontSize: 12,
    fontWeight: 600,
    color: '#3C3489',
    flexShrink: 0,
  },
  pwaStep: {
    fontSize: 12,
    color: 'var(--color-text-secondary, #666)',
    textAlign: 'right',
  },
  divider: {
    height: 0.5,
    background: 'var(--color-border-tertiary, rgba(0,0,0,0.08))',
    margin: '0 12px',
  },

  /* Contact card — navy hero */
  contactCard: {
    background: '#0C1A2E',
    borderRadius: 14,
    padding: '18px 16px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  contactLabel: {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: '#378ADD',
    marginBottom: 10,
  },
  contactName: {
    fontSize: 20,
    fontWeight: 600,
    color: '#fff',
    margin: '0 0 4px',
  },
  contactRole: {
    fontSize: 12,
    color: '#378ADD',
    margin: '0 0 8px',
    fontWeight: 500,
  },
  contactDetail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 12px',
  },
  contactLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  contactLink: {
    fontSize: 13,
    fontWeight: 500,
    color: '#fff',
    textDecoration: 'none',
  },
  contactDot: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
  },
  heroStripe: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    background: '#378ADD',
    borderRadius: '0 0 14px 14px',
  },
};