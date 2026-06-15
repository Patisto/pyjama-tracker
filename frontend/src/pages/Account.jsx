import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Key, User as UserIcon, Calendar } from 'lucide-react';

const DATE_RANGE_OPTIONS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

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
    if (saved) {
      setDateRange(saved);
    }
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
      const { error } = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      }).then(res => res.json());

      if (error) {
        setMessage(error);
      } else {
        setMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch (err) {
      setMessage('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="account-info">
          <UserIcon size={32} className="account-icon" />
          <div>
            <p className="account-email">{user?.email || 'No email'}</p>
            <p className="muted-small">Signed in</p>
          </div>
        </div>
      </div>

      <section className="section">
        <h3>Overview settings</h3>
        <p className="muted-small" style={{ marginBottom: 12 }}>
          Choose the default date range for your Overview dashboard.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDateRangeChange(option.value)}
              className={dateRange === option.value ? 'primary-button' : 'secondary-button'}
              style={{
                flex: '1',
                minWidth: '80px',
                padding: '10px 16px',
                fontSize: '0.9rem',
              }}
            >
              <Calendar size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h3>Security</h3>
        
        {!showPasswordForm ? (
          <button 
            onClick={() => setShowPasswordForm(true)}
            className="secondary-button full-width"
          >
            <Key size={18} />
            Change password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="form">
            <label>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
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
                {loading ? 'Changing...' : 'Change password'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="section">
        <h3>Danger zone</h3>
        <button 
          onClick={handleSignOut}
          className="secondary-button full-width"
          style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
        >
          <LogOut size={18} />
          Sign out
        </button>
      </section>
    </div>
  );
}
