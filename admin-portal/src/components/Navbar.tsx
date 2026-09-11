import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  DollarSign,
  HeartHandshake,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  User as UserIcon,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { InAppNotification } from '../types';
import { NavSection } from './Sidebar';

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
  onNavigate?: (section: NavSection) => void;
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
  onNavigate,
}) => {
  const { isIndia, toggleMode, churchProfile, currentRole, setCurrentRole, roles, hasPermission } = useLocalization();
  const { user, isSuperAdmin, activeRole, setActiveRoleOverride, logout } = useAuth();

  // Role-specific pastoral alerts: restricted to pastors and admins
  const userRole = (user?.role || activeRole || currentRole || '').toLowerCase();
  const isPastoralOrAdmin = ['super_admin', 'admin', 'pastor'].includes(userRole);

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isPastoralOrAdmin) return;
    try {
      const items = await api.getInboxNotifications(30);
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.is_read).length);
    } catch (err) {
      // Graceful background silent catch
    }
  };

  useEffect(() => {
    if (isPastoralOrAdmin) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [isPastoralOrAdmin, userRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleEvaluateTriggers = async () => {
    try {
      setEvaluating(true);
      await api.evaluateNotificationTriggers();
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to evaluate triggers:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }
    setShowNotifications(false);
    if (notif.action_url && onNavigate) {
      if (notif.action_url.startsWith('/pastoral')) {
        onNavigate('pastoral');
      } else if (notif.action_url.startsWith('/attendance')) {
        onNavigate('attendance');
      } else if (notif.action_url.startsWith('/members')) {
        onNavigate('members');
      }
    }
  };

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

        {/* Role-Specific Pastoral & Leader Notifications */}
        {isPastoralOrAdmin && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              className="btn btn-icon btn-secondary"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Pastoral & Absence Alerts"
              style={{ position: 'relative' }}
            >
              <Bell size={16} color={unreadCount > 0 ? '#f59e0b' : 'var(--text-secondary)'} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '360px',
                  maxWidth: '90vw',
                  background: 'var(--bg-card, #121827)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  borderRadius: 'var(--radius-lg, 12px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={15} color="var(--gold-400)" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Pastoral Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="badge badge-amber" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {unreadCount} unread
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={handleEvaluateTriggers}
                      disabled={evaluating}
                      className="btn-icon"
                      title="Evaluate Absence & Urgent Rules Now"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <RefreshCw size={13} className={evaluating ? 'spin' : ''} />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="btn-link"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--gold-400)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      <CheckCheck size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>No active alerts for pastoral team.</p>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>All member follow-ups are up to date.</span>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: notif.is_read ? 'transparent' : 'rgba(245, 158, 11, 0.06)',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(245, 158, 11, 0.06)')
                        }
                      >
                        <div style={{ marginTop: '2px', flexShrink: 0 }}>
                          {notif.notification_type === 'absence_alert' ? (
                            <AlertTriangle size={15} color="#f59e0b" />
                          ) : notif.notification_type === 'answered_prayer' ? (
                            <Sparkles size={15} color="#10b981" />
                          ) : (
                            <HeartHandshake size={15} color="#818cf8" />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
                            <span
                              style={{
                                fontSize: '12.5px',
                                fontWeight: notif.is_read ? 600 : 700,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {notif.title}
                            </span>
                            {!notif.is_read && (
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: 'var(--gold-400)',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--text-secondary)',
                              margin: 0,
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notif.message}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--gold-400)', textTransform: 'capitalize' }}>
                              via {notif.channels_dispatched.replace(/,/g, ', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '8px 16px',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Role: {userRole}
                  </span>
                  {onNavigate && (
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate('settings');
                      }}
                      className="btn-link"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--gold-400)',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Configure Alert Rules →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
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

