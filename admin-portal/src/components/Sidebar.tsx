import React from 'react';
import {
  Award,
  CalendarDays,
  CalendarHeart,
  ClipboardCheck,
  DollarSign,
  FileSpreadsheet,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Scale,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';

export type NavSection =
  | 'dashboard'
  | 'members'
  | 'milestones'
  | 'households'
  | 'calendar'
  | 'attendance'
  | 'ministries'
  | 'pastoral'
  | 'ledger'
  | 'finances'
  | 'compliance'
  | 'certificates'
  | 'messaging'
  | 'settings';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  milestonesCount?: number;
  absenteesCount?: number;
  prayersCount?: number;
  onSeedDemoData: () => void;
  onOpenCsvMigration: () => void;
  isSeeding: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  milestonesCount = 0,
  absenteesCount = 0,
  prayersCount = 0,
  onSeedDemoData,
  onOpenCsvMigration,
  isSeeding,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { isIndia, churchProfile, modules, hasPermission } = useLocalization();

  const handleSelect = (section: NavSection) => {
    onSelectSection(section);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <div className="church-logo-mark" style={{ flexShrink: 0 }}>
              {churchProfile.name.charAt(0) || 'E'}
            </div>
            <div className="church-brand" style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem', fontWeight: 800 }} title={churchProfile.name}>
                {churchProfile.name || 'ECCLESIA'}
              </h1>
              <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', color: 'var(--text-muted)' }} title={churchProfile.senior_pastor}>
                {churchProfile.senior_pastor || 'Enterprise ChMS'}
              </p>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Overview</div>
          <button
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleSelect('dashboard')}
          >
            <div className="nav-item-left">
              <LayoutDashboard size={18} />
              <span>Executive Dashboard</span>
            </div>
          </button>

          <div className="nav-section-title">Congregation & Pastoral</div>
          <button
            className={`nav-item ${activeSection === 'members' ? 'active' : ''}`}
            onClick={() => handleSelect('members')}
          >
            <div className="nav-item-left">
              <Users size={18} />
              <span>Member Directory</span>
            </div>
          </button>

          <button
            className={`nav-item ${activeSection === 'milestones' ? 'active' : ''}`}
            onClick={() => handleSelect('milestones')}
          >
            <div className="nav-item-left">
              <CalendarHeart size={18} />
              <span>Milestone Dates</span>
            </div>
            {milestonesCount > 0 && <span className="nav-badge badge-gold">{milestonesCount}</span>}
          </button>

          <button
            className={`nav-item ${activeSection === 'households' ? 'active' : ''}`}
            onClick={() => handleSelect('households')}
          >
            <div className="nav-item-left">
              <Home size={18} />
              <span>Households & Wards</span>
            </div>
          </button>

          {modules.ministries_groups !== false && (
            <button
              className={`nav-item ${activeSection === 'ministries' ? 'active' : ''}`}
              onClick={() => handleSelect('ministries')}
            >
              <div className="nav-item-left">
                <UsersRound size={18} />
                <span>Ministries & Groups</span>
              </div>
            </button>
          )}

          {modules.pastoral_care !== false && hasPermission('pastoral_notes') && (
            <button
              className={`nav-item ${activeSection === 'pastoral' ? 'active' : ''}`}
              onClick={() => handleSelect('pastoral')}
            >
              <div className="nav-item-left">
                <HeartHandshake size={18} />
                <span>Pastoral Care & Prayer</span>
              </div>
              {prayersCount > 0 && <span className="nav-badge badge-gold">{prayersCount}</span>}
            </button>
          )}

          <div className="nav-section-title">Events & Operations</div>
          {modules.church_activities_calendar !== false && (
            <button
              className={`nav-item ${activeSection === 'calendar' ? 'active' : ''}`}
              onClick={() => handleSelect('calendar')}
            >
              <div className="nav-item-left">
                <CalendarDays size={18} />
                <span>Church Activities</span>
              </div>
            </button>
          )}

          {modules.attendance_checkin !== false && hasPermission('manage_attendance') && (
            <button
              className={`nav-item ${activeSection === 'attendance' ? 'active' : ''}`}
              onClick={() => handleSelect('attendance')}
            >
              <div className="nav-item-left">
                <ClipboardCheck size={18} />
                <span>Attendance Roster</span>
              </div>
              {absenteesCount > 0 && <span className="nav-badge badge-rose">{absenteesCount}</span>}
            </button>
          )}

          {modules.pdf_certificates !== false && hasPermission('issue_certificates') && (
            <button
              className={`nav-item ${activeSection === 'certificates' ? 'active' : ''}`}
              onClick={() => handleSelect('certificates')}
            >
              <div className="nav-item-left">
                <Award size={18} />
                <span>Life Certificates</span>
              </div>
            </button>
          )}

          {modules.mass_messaging !== false && hasPermission('mass_messaging') && (
            <button
              className={`nav-item ${activeSection === 'messaging' ? 'active' : ''}`}
              onClick={() => handleSelect('messaging')}
            >
              <div className="nav-item-left">
                <Smartphone size={18} />
                <span>Mass Messaging & WhatsApp</span>
              </div>
            </button>
          )}

          <div className="nav-section-title">Finance & Bookkeeping</div>
          {modules.double_entry_ledger !== false && hasPermission('view_ledger') && (
            <button
              className={`nav-item ${activeSection === 'ledger' ? 'active' : ''}`}
              onClick={() => handleSelect('ledger')}
            >
              <div className="nav-item-left">
                <Scale size={18} />
                <span>Double-Entry Ledger</span>
              </div>
            </button>
          )}

          {modules.giving_and_pledges !== false && hasPermission('view_finances') && (
            <button
              className={`nav-item ${activeSection === 'finances' ? 'active' : ''}`}
              onClick={() => handleSelect('finances')}
            >
              <div className="nav-item-left">
                <DollarSign size={18} />
                <span>Giving & Pledges</span>
              </div>
            </button>
          )}

          {modules.tax_compliance !== false && hasPermission('tax_compliance') && (
            <button
              className={`nav-item ${activeSection === 'compliance' ? 'active' : ''}`}
              onClick={() => handleSelect('compliance')}
            >
              <div className="nav-item-left">
                <ShieldCheck size={18} />
                <span>{isIndia ? '80G & FCRA Tax' : '501(c)(3) & Gift Aid'}</span>
              </div>
            </button>
          )}

          <div className="nav-section-title">Administration</div>
          {hasPermission('manage_settings') && (
            <button
              className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => handleSelect('settings')}
            >
              <div className="nav-item-left">
                <Settings size={18} />
                <span>System Settings & RBAC</span>
              </div>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          {modules.csv_migration !== false && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', gap: '8px', marginBottom: '6px' }}
              onClick={onOpenCsvMigration}
              title="Import ChurchCRM / Excel CSV files"
            >
              <FileSpreadsheet size={14} color="#6366f1" />
              <span>CSV Data Migration</span>
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', gap: '8px' }}
            onClick={onSeedDemoData}
            disabled={isSeeding}
            title="Reset and populate demo church data"
          >
            <Sparkles size={14} color="#f59e0b" />
            <span>{isSeeding ? 'Seeding Data...' : 'Seed ChMS Data'}</span>
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
            {churchProfile.name} • {isIndia ? '🇮🇳 India' : '🌐 Global'}
          </div>
        </div>
      </aside>
    </>
  );
};
