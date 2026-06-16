import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Key, ChevronRight, CalendarDays, CalendarRange, Infinity } from 'lucide-react';

const DATE_RANGE_OPTIONS = [
  { value: 'week', label: 'This week', icon: CalendarDays },
  { value: 'month', label: 'This month', icon: CalendarRange },
  { value: 'all', label: 'All time', icon: Infinity },
];

function getInitials(email) {
  if (!email) return '?';
  return email.slice(0, 2).toUpperCase();
}

export default function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    const saved = localStorage.getItem('dateRangePreference');
    if (saved) setDateRange(saved);
  }, []);

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    localStorage.setItem('dateRangePreference', value);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch {
      setMessage('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '2rem' }}>

      {/* Profile card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.25rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--color-surface-2, #f0ede8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 500, fontSize: 18, color: 'var(--color-text-secondary)',
          flexShrink: 0,
        }}>
          {getInitials(user?.email)}
        </div>
        <div>
          <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>{user?.email || 'No email'}</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e', marginRight: 5, verticalAlign: 'middle',
            }} />
            Signed in
          </p>
        </div>
      </div>

      {/* Overview settings */}
      <section className="section">
        <p className="section-label">Overview</p>
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '13px 16px 6px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Default date range
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '8px 16px 14px' }}>
            {DATE_RANGE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleDateRangeChange(value)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '8px 6px',
                  fontSize: 13,
                  borderRadius: 'var(--border-radius-md)',
                  border: dateRange === value
                    ? '1.5px solid var(--color-border-primary, #aaa)'
                    : '0.5px solid var(--color-border-tertiary)',
                  background: dateRange === value
                    ? 'var(--color-background-primary)'
                    : 'var(--color-background-secondary)',
                  color: dateRange === value
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  fontWeight: dateRange === value ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="section">
        <p className="section-label">Security</p>
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          {!showPasswordForm ? (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 14, color: 'var(--color-text-primary)',
                textAlign: 'left',
              }}
            >
              <Key size={17} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              Change password
              <ChevronRight size={15} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} style={{ padding: '14px 16px' }}>
              <div className="form" style={{ gap: 10 }}>
                <label>
                  Current password
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </label>
                <label>
                  New password
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                </label>
                <label>
                  Confirm new password
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                </label>
                {message && (
                  <p className={message.includes('success') ? 'success-text' : 'error-text'}>
                    {message}
                  </p>
                )}
                <div className="form-row">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setMessage('');
                    }}
                    className="secondary-button full-width"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="full-width">
                    {loading ? 'Saving…' : 'Save password'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Account / sign out */}
      <section className="section">
        <p className="section-label">Account</p>
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 16px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14,
              color: 'var(--color-error)',
              textAlign: 'left',
            }}
          >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            Sign out
          </button>
        </div>
      </section>

    </div>
  );
}