import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Gift,
  HeartHandshake,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { DashboardData, MilestoneItem } from '../types';

interface DashboardViewProps {
  data: DashboardData | null;
  isLoading: boolean;
  onNavigate: (section: any) => void;
  onSelectMember: (memberId: number) => void;
  onOpenAddMember: () => void;
  onOpenRecordGiving: () => void;
  onOpenCheckIn: () => void;
  onOpenAddPrayer: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  isLoading,
  onNavigate,
  onSelectMember,
  onOpenAddMember,
  onOpenRecordGiving,
  onOpenCheckIn,
  onOpenAddPrayer,
}) => {
  const { formatCurrency, isIndia } = useLocalization();
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  if (isLoading || !data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="church-logo-mark" style={{ margin: '0 auto 16px', animation: 'spin 2s infinite linear' }}>
          •
        </div>
        <h2>Loading Church Dashboard...</h2>
      </div>
    );
  }

  const {
    kpis,
    upcoming_milestones,
    absentee_alerts,
    recent_contributions,
    monthly_finance_trends,
    active_prayer_requests,
  } = data;

  const copyGreeting = (milestone: MilestoneItem) => {
    let msg = `Dear ${milestone.member_name}, grace and peace to you! Wishing you a blessed and joyous ${milestone.milestone_type}! May the Lord continue to guide, protect, and bless you abundantly! - St. Luke's Ecclesia Church`;
    navigator.clipboard.writeText(msg);
    setCopiedId(milestone.member_id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '26px',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Church Executive Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            St. Luke's Ecclesia Community • Live Ministry & Financial Health Dashboard ({isIndia ? '🇮🇳 India' : '🌐 Global'})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={onOpenRecordGiving}>
            <DollarSign size={15} />
            <span>Record Giving</span>
          </button>
          <button className="btn btn-emerald" onClick={onOpenCheckIn}>
            <UserCheck size={15} />
            <span>Live Check-in</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Grid */}
      <div className="kpi-grid">
        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--gold-500)', '--kpi-bg': 'rgba(245, 158, 11, 0.12)' } as any}
        >
          <div className="kpi-info">
            <h3>Total Members</h3>
            <div className="kpi-value">{kpis.total_members}</div>
            <div className="kpi-subtext">
              <strong style={{ color: 'var(--gold-400)' }}>{kpis.active_members}</strong> active congregants •{' '}
              {kpis.total_households} families
            </div>
          </div>
          <div className="kpi-icon-wrap">
            <Users size={24} />
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--emerald)', '--kpi-bg': 'rgba(16, 185, 129, 0.12)' } as any}
        >
          <div className="kpi-info">
            <h3>YTD Contributions</h3>
            <div className="kpi-value">{formatCurrency(kpis.ytd_contributions)}</div>
            <div className="kpi-subtext" style={{ color: kpis.net_operating_cash >= 0 ? '#34d399' : '#fb7185' }}>
              {kpis.net_operating_cash >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(kpis.net_operating_cash))} net operating cash
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: 'var(--emerald)' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--royal-blue)', '--kpi-bg': 'rgba(59, 130, 246, 0.12)' } as any}
        >
          <div className="kpi-info">
            <h3>Avg Sunday Attendance</h3>
            <div className="kpi-value">{kpis.avg_sunday_attendance}</div>
            <div className="kpi-subtext">Last 4 services average headcount</div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: 'var(--royal-blue)' }}>
            <UserCheck size={24} />
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ '--kpi-accent': 'var(--rose)', '--kpi-bg': 'rgba(244, 63, 94, 0.12)' } as any}
        >
          <div className="kpi-info">
            <h3>Upcoming Milestones</h3>
            <div className="kpi-value">{kpis.upcoming_milestones_count}</div>
            <div className="kpi-subtext">Birthdays & anniversaries next 30 days</div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: 'var(--rose)' }}>
            <Gift size={24} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid-2">
        {/* Left Column: Upcoming Milestones & Cash Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Important Dates This Month */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Calendar size={18} color="var(--gold-400)" />
                  <span>Important Dates & Milestones (Next 30 Days)</span>
                </div>
                <div className="card-subtitle">Automated alerts for member birthdays, anniversaries, and baptisms</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('milestones')}>
                View All ({upcoming_milestones.length})
              </button>
            </div>
            <div className="card-body">
              {upcoming_milestones.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  No upcoming milestones in the next 30 days.
                </p>
              ) : (
                upcoming_milestones.slice(0, 5).map((m) => {
                  const isToday = m.days_until === 0;
                  const isSoon = m.days_until <= 7;
                  return (
                    <div
                      key={`${m.member_id}-${m.milestone_type}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-full)',
                            background: m.member_avatar ? `url(${m.member_avatar}) center/cover` : 'var(--bg-card-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: 'var(--gold-400)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {!m.member_avatar && m.member_name.charAt(0)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: '700',
                              fontSize: '14px',
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                            }}
                            onClick={() => onSelectMember(m.member_id)}
                          >
                            {m.member_name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {m.milestone_type} • {m.event_date} {m.years ? `(${m.years} yrs)` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className={`nav-badge ${
                            isToday ? 'badge-rose' : isSoon ? 'badge-gold' : 'badge-neutral'
                          }`}
                        >
                          {isToday ? 'Today! 🎉' : `in ${m.days_until}d`}
                        </span>
                        <button
                          className="btn btn-icon btn-secondary"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          title="Copy Greeting Message"
                          onClick={() => copyGreeting(m)}
                        >
                          {copiedId === m.member_id ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Monthly Finance Trends */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <TrendingUp size={18} color="var(--emerald)" />
                  <span>Monthly Giving vs. Operating Expenses</span>
                </div>
                <div className="card-subtitle">Historical financial health indicator</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('ledger')}>
                View Ledger
              </button>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {monthly_finance_trends.map((item) => (
                  <div key={item.month}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>{item.month}</span>
                      <span>
                        <span style={{ color: '#10b981', fontWeight: '700' }}>+{formatCurrency(item.income)}</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>|</span>
                        <span style={{ color: '#f43f5e', fontWeight: '700' }}>-{formatCurrency(item.expense)}</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>=</span>
                        <strong style={{ color: item.net >= 0 ? '#10b981' : '#f43f5e' }}>
                          {formatCurrency(item.net)}
                        </strong>
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div
                      style={{
                        height: '6px',
                        background: 'var(--bg-card-subtle)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, (item.income / (item.income + item.expense || 1)) * 100)}%`,
                          background: '#10b981',
                        }}
                      />
                      <div
                        style={{
                          width: `${Math.min(100, (item.expense / (item.income + item.expense || 1)) * 100)}%`,
                          background: '#f43f5e',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Absentee Care Alerts & Active Prayers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Absentee Follow-up Alerts */}
          <div className="card" style={{ borderTop: '3px solid #f43f5e' }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <AlertTriangle size={18} color="#f43f5e" />
                  <span>Pastoral Care: Absentee Alerts</span>
                </div>
                <div className="card-subtitle">Congregants absent for 3+ consecutive weeks</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('attendance')}>
                View All
              </button>
            </div>
            <div className="card-body">
              {absentee_alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <CheckCircle size={28} color="#10b981" style={{ margin: '0 auto 8px' }} />
                  <p>All active members have attended in the past 3 weeks!</p>
                </div>
              ) : (
                absentee_alerts.map((a) => (
                  <div
                    key={a.member_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div
                        style={{ fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: 'var(--text-primary)' }}
                        onClick={() => onSelectMember(a.member_id)}
                      >
                        {a.member_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#f43f5e' }}>
                        Absent for {a.weeks_absent ?? a.consecutive_absences_count} weeks • Last seen: {a.last_attended_date || 'None on record'}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectMember(a.member_id)}
                    >
                      Care Note
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Prayer Requests */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <HeartHandshake size={18} color="var(--gold-400)" />
                  <span>Active Prayer & Intercession Requests</span>
                </div>
                <div className="card-subtitle">Requests being prayed for by pastors & intercessors</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('pastoral')}>
                View Pastoral
              </button>
            </div>
            <div className="card-body">
              {active_prayer_requests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active prayer requests.</p>
              ) : (
                active_prayer_requests.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{p.title}</span>
                      <span className="nav-badge badge-gold" style={{ fontSize: '10px' }}>
                        {p.category}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        margin: '4px 0',
                        lineHeight: '1.4',
                      }}
                    >
                      {p.details}
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Requested by: {p.requester_name} • {p.date_requested || (p.created_at ? new Date(p.created_at).toLocaleDateString() : '')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
