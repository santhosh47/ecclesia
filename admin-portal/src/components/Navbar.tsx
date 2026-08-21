import React from 'react';
import {
  DollarSign,
  HeartHandshake,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User as UserIcon,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddMember: () => void;
  onOpenRecordGiving: () => void;
  onOpenCheckIn: () => void;
  onOpenAddPrayer: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddMember,
  onOpenRecordGiving,
  onOpenCheckIn,
  onOpenAddPrayer,
  theme,
  onToggleTheme,
  onToggleMobileMenu,
}) => {
  const { isIndia, toggleMode, churchProfile, currentRole, setCurrentRole, roles, hasPermission } = useLocalization();
  const { user, isSuperAdmin, activeRole, setActiveRoleOverride, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleDisplayName = (roleId: string) => {
    const found = roles.find((r) => r.id === roleId);
    return found ? found.name : roleId.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '480px' }}>
        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          title="Open Menu"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <div className="nav-search" style={{ flex: 1 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search congregation, ledger..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="top-actions">
        {/* Role: Only Super Admin gets the dropdown switcher. Other roles see their fixed role badge */}
        {isSuperAdmin ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Role:</span>
            <select
              value={activeRole}
              onChange={(e) => {
                setActiveRoleOverride(e.target.value);
                setCurrentRole(e.target.value);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                color: 'var(--gold-400)',
                cursor: 'pointer',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#818cf8',
            }}
          >
            <span>★ {getRoleDisplayName(user?.role || currentRole)}</span>
          </div>
        )}

        {/* Localization Switcher Pill */}
        <button
          onClick={() => toggleMode()}
          className="btn btn-secondary btn-sm"
          title={`Switch between India (80G, FCRA, Razorpay, UPI) and Global (501c3, Gift Aid, Stripe)`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: isIndia ? '1px solid #f59e0b' : '1px solid #6366f1',
            background: isIndia ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
            fontWeight: '600',
            fontSize: '12px',
          }}
        >
          <span>{isIndia ? '🇮🇳 India' : '🌐 Global'}</span>
        </button>

        {/* Quick Action Shortcuts (Protected by Permissions) */}
        {hasPermission('edit_members') && (
          <button className="btn btn-secondary btn-sm nav-action-btn" onClick={onOpenAddMember} title="Add Member">
            <UserPlus size={14} />
            <span className="hide-on-mobile">New Member</span>
          </button>
        )}

        {hasPermission('manage_finances') && (
          <button className="btn btn-secondary btn-sm nav-action-btn" onClick={onOpenRecordGiving} title="Record Giving">
            <DollarSign size={14} color="#10b981" />
            <span className="hide-on-mobile">Giving</span>
          </button>
        )}

        {hasPermission('manage_attendance') && (
          <button className="btn btn-secondary btn-sm nav-action-btn" onClick={onOpenCheckIn} title="Check In">
            <UserCheck size={14} color="#60a5fa" />
            <span className="hide-on-mobile">Check-in</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          className="btn btn-icon btn-secondary"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#475569" />}
        </button>

        {/* User Profile & Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
              }}
              className="hide-on-mobile"
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  background: isSuperAdmin ? 'var(--gold-gradient)' : 'rgba(99, 102, 241, 0.2)',
                  color: isSuperAdmin ? '#090d16' : '#818cf8',
                  fontWeight: '700',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.full_name || user.username}
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={logout}
              title="Sign Out"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '12px' }}
            >
              <LogOut size={13} color="#f43f5e" />
              <span className="hide-on-mobile">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

