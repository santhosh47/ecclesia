import React, { useState } from 'react';
import {
  Church,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  DollarSign,
  HeartHandshake,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';

export const LoginView: React.FC = () => {
  const { login, loginAsDemoRole } = useAuth();
  const { churchProfile, modules } = useLocalization();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTestUsers, setShowTestUsers] = useState<boolean>(() => {
    const saved = localStorage.getItem('ecclesia_show_test_users');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleTestUsers = () => {
    setShowTestUsers((prev) => {
      const next = !prev;
      localStorage.setItem('ecclesia_show_test_users', String(next));
      return next;
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoUsername: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginAsDemoRole(demoUsername, `${demoUsername}123`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to login with demo role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 15%, #1e1b4b 0%, #090d16 65%, #05070c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 80%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px 32px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.08)',
          borderRadius: 'var(--radius-lg)',
          zIndex: 2,
        }}
      >
        {/* Church Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)',
            }}
          >
            <Church size={34} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {churchProfile?.name || 'Ecclesia ChMS'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Enterprise Church Management & Accounting System
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '12.5px' }}>
                Username or Email
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. admin or pastor"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '12.5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Quick Demo Logins Section with Toggle (Super Admin Feature Toggle Controlled) */}
        {modules.quick_test_logins === true && (
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
            <div
              onClick={toggleTestUsers}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                padding: '6px 4px',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s ease',
              }}
              title={showTestUsers ? 'Hide Test Role Logins' : 'Show Test Role Logins'}
            >
              <div
                style={{
                  fontSize: '11.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '700',
                  color: 'var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={13} />
                <span>Quick Test Logins</span>
                <span
                  style={{
                    fontSize: '10px',
                    background: showTestUsers ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: showTestUsers ? 'var(--gold-400)' : 'var(--text-muted)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    marginLeft: '4px',
                  }}
                >
                  {showTestUsers ? '6 Roles' : 'Hidden (Click to expand)'}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-icon btn-secondary btn-sm"
                style={{ width: '26px', height: '26px', padding: 0, borderRadius: '4px' }}
                aria-label={showTestUsers ? 'Hide Test Logins' : 'Show Test Logins'}
              >
                {showTestUsers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showTestUsers && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  marginTop: '12px',
                  animation: 'fadeIn 0.25s ease-out',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isLoading}
                  style={{ justifyContent: 'flex-start', fontSize: '12px', padding: '8px 10px' }}
                >
                  <ShieldCheck size={14} color="var(--gold-400)" />
                  <span>Super Admin</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickLogin('pastor')}
                  disabled={isLoading}
                  style={{ justifyContent: 'flex-start', fontSize: '12px', padding: '8px 10px' }}
                >
                  <HeartHandshake size={14} color="#38bdf8" />
                  <span>Pastor / Clergy</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickLogin('treasurer')}
                  disabled={isLoading}
                  style={{ justifyContent: 'flex-start', fontSize: '12px', padding: '8px 10px' }}
                >
                  <DollarSign size={14} color="var(--emerald)" />
                  <span>Treasurer</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickLogin('elder')}
                  disabled={isLoading}
                  style={{ justifyContent: 'flex-start', fontSize: '12px', padding: '8px 10px' }}
                >
                  <BookOpen size={14} color="#a855f7" />
                  <span>Elder / Council</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickLogin('staff')}
                  disabled={isLoading}
                  style={{ justifyContent: 'flex-start', fontSize: '12px', padding: '8px 10px' }}
                >
                  <Users size={14} color="#fb7185" />
                  <span>Sub-Admin</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickLogin('leader')}
                  disabled={isLoading}
                  style={{ justifyContent: 'flex-start', fontSize: '12px', padding: '8px 10px' }}
                >
                  <Users size={14} color="#f97316" />
                  <span>Ministry Leader</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
