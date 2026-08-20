import React, { useEffect, useState } from 'react';
import {
  Building,
  CheckCircle2,
  DollarSign,
  Globe,
  Info,
  Key,
  Layers,
  Lock,
  Plus,
  Save,
  Shield,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { ChurchProfile, RoleDefinition } from '../types';

export const SettingsView: React.FC = () => {
  const {
    churchProfile,
    updateChurchProfile,
    modules,
    toggleModule,
    roles,
    currentRole,
    setCurrentRole,
    saveRole,
    deleteRole,
    mode,
    toggleMode,
  } = useLocalization();

  const [activeTab, setActiveTab] = useState<'profile' | 'modules' | 'rbac' | 'localization'>('profile');
  const [profileForm, setProfileForm] = useState<ChurchProfile>(churchProfile);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync profile form whenever churchProfile is updated/loaded
  useEffect(() => {
    setProfileForm(churchProfile);
  }, [churchProfile]);

  // Role Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState<{ id: string; name: string; description: string; permissions: string[] }>({
    id: '',
    name: '',
    description: '',
    permissions: [],
  });

  const availablePermissions = [
    { key: 'view_members', label: 'View Member Directory & Households', category: 'Congregation' },
    { key: 'edit_members', label: 'Create & Edit Member Records', category: 'Congregation' },
    { key: 'view_finances', label: 'View Giving & Contributions', category: 'Finances' },
    { key: 'manage_finances', label: 'Record Giving, Expenses & Pledges', category: 'Finances' },
    { key: 'view_ledger', label: 'View Double-Entry Ledger & Trial Balance', category: 'Finances' },
    { key: 'manage_ledger', label: 'Post Journal Entries & Staff Payroll', category: 'Finances' },
    { key: 'tax_compliance', label: 'Generate 80G Receipts & Form 10BD', category: 'Finances' },
    { key: 'manage_attendance', label: 'Check-in Attendance & View Absentees', category: 'Operations' },
    { key: 'pastoral_notes', label: 'Pastoral Counseling & Prayer Board', category: 'Pastoral' },
    { key: 'mass_messaging', label: 'Send WhatsApp & SMS Broadcasts', category: 'Communication' },
    { key: 'issue_certificates', label: 'Generate Life Milestone PDF Certificates', category: 'Communication' },
    { key: 'manage_calendar', label: 'Schedule Church Activities & Services', category: 'Operations' },
    { key: 'manage_settings', label: 'Access System Settings & Customization', category: 'Administration' },
    { key: 'manage_roles', label: 'Manage RBAC User Roles & Permissions', category: 'Administration' },
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateChurchProfile(profileForm);
      setSaveSuccess('Church profile and legal details saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save church profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleModule = async (moduleKey: string) => {
    const currentVal = modules[moduleKey] ?? true;
    await toggleModule(moduleKey, !currentVal);
  };

  const handleOpenRoleModal = (role?: RoleDefinition) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        id: `custom_${Date.now()}`,
        name: '',
        description: '',
        permissions: ['view_members', 'manage_attendance', 'manage_calendar'],
      });
    }
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) return;
    await saveRole(roleForm);
    setShowRoleModal(false);
    setSaveSuccess(`Role '${roleForm.name}' saved successfully!`);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const moduleDefinitions = [
    { key: 'double_entry_ledger', label: 'Double-Entry Ledger & Bookkeeping', desc: 'General journal ledger, balanced debit/credit entries, chart of accounts, and trial balance reports.' },
    { key: 'payroll_staff_ledger', label: 'Clergy & Staff Payroll Engine', desc: 'Monthly payslip calculation, allowances, statutory deductions, and ledger disbursement records.' },
    { key: 'giving_and_pledges', label: 'Giving, Tithes & Pledge Campaigns', desc: 'Online and offline donation recording, pledge progress gauges, and annual donor tax statements.' },
    { key: 'church_activities_calendar', label: 'Church Activities & Events Calendar', desc: 'Schedule worship services, weekly prayer meetings, choir rehearsals, committee gatherings, and conferences.' },
    { key: 'pdf_certificates', label: 'Milestone Life Certificates & PDF Generator', desc: 'Baptism, Wedding, Child Dedication, and Confirmation certificates with ornate borders and registration details.' },
    { key: 'mass_messaging', label: 'Mass Messaging & WhatsApp Broadcasts', desc: 'TRAI DLT compliant SMS templates and broadcast dispatch to congregation and ministry groups.' },
    { key: 'tax_compliance', label: 'Tax Compliance (80G / 501(c)(3) / FCRA)', desc: 'Section 80G tax exemption receipts, Form 10BD electronic return exports, and foreign remittance register.' },
    { key: 'attendance_checkin', label: 'Attendance Roster & Absentee Alerts', desc: 'Live headcount check-in and 3-week consecutive absence alerts for proactive pastoral care.' },
    { key: 'ministries_groups', label: 'Ministries & Department Rosters', desc: 'Organize worship team, youth fellowship, Sunday school, and committee memberships.' },
    { key: 'pastoral_care', label: 'Pastoral Care Notes & Prayer Board', desc: 'Confidential visitation logs, pastoral counseling records, and answered prayer tracking.' },
    { key: 'csv_migration', label: 'CSV Migration Tool (ChurchCRM / Excel)', desc: 'Batch import and export of church membership rosters and family household groupings.' },
  ];

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} color="var(--gold-400)" />
            <span>Administration & System Customization</span>
          </h1>
          <p className="view-subtitle">
            Configure church profile, legal registration details, fine-grained feature modules, and role-based access control.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            <UserCheck size={16} color="var(--gold-400)" />
            <span style={{ fontWeight: 600 }}>Active Role Tester:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="form-select"
              style={{
                width: 'auto',
                padding: '4px 8px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          <CheckCircle2 size={20} color="#10b981" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          className="btn"
          style={{
            background: activeTab === 'profile' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'profile' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Building size={16} />
          <span>Church Profile & Branding</span>
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className="btn"
          style={{
            background: activeTab === 'modules' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'modules' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'modules' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Layers size={16} />
          <span>Feature Module Toggles</span>
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className="btn"
          style={{
            background: activeTab === 'rbac' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'rbac' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'rbac' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Shield size={16} />
          <span>Roles & Permissions (RBAC)</span>
        </button>
        <button
          onClick={() => setActiveTab('localization')}
          className="btn"
          style={{
            background: activeTab === 'localization' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'localization' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'localization' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Globe size={16} />
          <span>Localization & Tax Regime</span>
        </button>
      </div>

      {/* Tab 1: Church Profile & Legal Branding */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1: Parish Identity */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Parish & Organization Identity
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Primary name and leadership details displayed on all official reports, receipts, and certificates.
            </p>

            <div className="form-grid">
              <div className="form-group-full">
                <label className="form-label">Church Official Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Grace Community Church"
                />
              </div>

              <div>
                <label className="form-label">Senior Pastor / Presbyter-in-Charge</label>
                <input
                  type="text"
                  value={profileForm.senior_pastor || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, senior_pastor: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Pastor Dr. Samuel Thomas"
                />
              </div>

              <div>
                <label className="form-label">Denomination / Affiliation</label>
                <input
                  type="text"
                  value={profileForm.denomination || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, denomination: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Anglican Communion / Ecumenical"
                />
              </div>

              <div>
                <label className="form-label">Motto / Vision Statement</label>
                <input
                  type="text"
                  value={profileForm.motto || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, motto: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Worship • Community • Discipleship"
                />
              </div>

              <div>
                <label className="form-label">Established Year</label>
                <input
                  type="number"
                  value={profileForm.established_year || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, established_year: Number(e.target.value) || undefined })}
                  className="form-input"
                  placeholder="e.g. 1985"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Address & Contact */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Address & Contact Information
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Official parish headquarters location printed on certificate subheadings and tax filings.
            </p>

            <div className="form-grid">
              <div className="form-group-full">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  value={profileForm.address || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 12 Cathedral Road"
                />
              </div>

              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  value={profileForm.city || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Bangalore"
                />
              </div>

              <div>
                <label className="form-label">State / Province</label>
                <input
                  type="text"
                  value={profileForm.state || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Karnataka"
                />
              </div>

              <div>
                <label className="form-label">Postal / ZIP Code</label>
                <input
                  type="text"
                  value={profileForm.postal_code || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 560001"
                />
              </div>

              <div>
                <label className="form-label">Country</label>
                <input
                  type="text"
                  value={profileForm.country || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  className="form-input"
                  placeholder="e.g. India"
                />
              </div>

              <div>
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  value={profileForm.email || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="form-input"
                  placeholder="office@ecclesia-church.org"
                />
              </div>

              <div>
                <label className="form-label">Official Phone</label>
                <input
                  type="text"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="form-input"
                  placeholder="+91 80 2345 6789"
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Official Website</label>
                <input
                  type="url"
                  value={profileForm.website || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  className="form-input"
                  placeholder="https://ecclesia-church.org"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Tax & Legal Registrations */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Tax & Legal Registrations
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Statutory registration numbers for Section 80G certificates, Form 10BD electronic return, and foreign remittances.
            </p>

            <div className="form-grid">
              <div>
                <label className="form-label">India 80G Tax Exemption Reg. No.</label>
                <input
                  type="text"
                  value={profileForm.tax_id_in_80g || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, tax_id_in_80g: e.target.value })}
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  placeholder="CIT(E)/BLR/80G/2024-25/AABTE1234F"
                />
              </div>

              <div>
                <label className="form-label">Church Trust PAN Number</label>
                <input
                  type="text"
                  value={profileForm.pan_number || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, pan_number: e.target.value })}
                  className="form-input"
                  style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                  placeholder="AABTE1234F"
                />
              </div>

              <div>
                <label className="form-label">FCRA Registration No. (MHA)</label>
                <input
                  type="text"
                  value={profileForm.fcra_registration_no || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, fcra_registration_no: e.target.value })}
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  placeholder="094421876"
                />
              </div>

              <div>
                <label className="form-label">US IRS 501(c)(3) EIN</label>
                <input
                  type="text"
                  value={profileForm.us_ein || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, us_ein: e.target.value })}
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  placeholder="12-3456789"
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">UK Charity Commission Number</label>
                <input
                  type="text"
                  value={profileForm.uk_charity_number || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, uk_charity_number: e.target.value })}
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  placeholder="1198765"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: 700 }}
            >
              <Save size={18} />
              <span>{isSaving ? 'Saving Changes...' : 'Save Church Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Feature Module Toggles */}
      {activeTab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="card"
            style={{
              padding: '16px 20px',
              borderLeft: '4px solid var(--gold-500)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Info size={18} color="var(--gold-400)" />
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
                Fine-Grained System Customization
              </h4>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enable or disable software modules according to your parish requirements. Core congregation management (Members & Households) remains permanently active.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {moduleDefinitions.map((mod) => {
              const isEnabled = modules[mod.key] ?? true;
              return (
                <div
                  key={mod.key}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '20px',
                    border: isEnabled ? '1px solid var(--border-subtle)' : '1px dashed var(--border-subtle)',
                    opacity: isEnabled ? 1 : 0.7,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14.5px', lineHeight: 1.3 }}>
                        {mod.label}
                      </h4>
                      <span className={`status-pill ${isEnabled ? 'badge-emerald' : 'badge-neutral'}`} style={{ whiteSpace: 'nowrap' }}>
                        {isEnabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {mod.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleModule(mod.key)}
                    className={isEnabled ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {isEnabled ? 'Disable Module' : 'Enable Module'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Roles & Permissions (RBAC) */}
      {activeTab === 'rbac' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                User Roles & Access Control
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Define security privileges for clergy, elders, treasurers, staff, and ministry coordinators.
              </p>
            </div>
            <button
              onClick={() => handleOpenRoleModal()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Create Custom Role</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {roles.map((role) => (
              <div
                key={role.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} color="var(--gold-400)" />
                      <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{role.name}</h4>
                    </div>
                    <span className={`status-pill ${role.is_system ? 'badge-indigo' : 'badge-purple'}`}>
                      {role.is_system ? 'SYSTEM' : 'CUSTOM'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                    {role.description}
                  </p>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Assigned Privileges ({role.permissions.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                      {role.permissions.map((p) => (
                        <span key={p} className="status-pill badge-neutral" style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <button
                    onClick={() => handleOpenRoleModal(role)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Edit Permissions
                  </button>
                  {!role.is_system && (
                    <button
                      onClick={() => deleteRole(role.id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '6px 10px' }}
                      title="Delete role"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Localization & Tax Regime */}
      {activeTab === 'localization' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Active Jurisdiction & Statutory Tax Regime
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Toggle between Indian statutory compliance (80G, Form 10BD, FCRA) and Global multi-currency church operations.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* India Mode Card */}
            <div
              onClick={() => toggleMode('IN')}
              style={{
                border: mode === 'IN' ? '2px solid var(--gold-500)' : '1px solid var(--border-subtle)',
                background: mode === 'IN' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                padding: '20px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🇮🇳</span>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '16px' }}>India (IN) Mode</h4>
                </div>
                {mode === 'IN' && <span className="status-pill badge-emerald">ACTIVE</span>}
              </div>
              <ul style={{ fontSize: '12.5px', color: 'var(--text-secondary)', paddingLeft: '18px', lineHeight: 1.8 }}>
                <li>Section 80G Tax Exemption Certificates</li>
                <li>Income Tax Form 10BD Annual Statement</li>
                <li>FCRA Foreign Inward Remittance Ledger</li>
                <li>Indian Rupee (₹) & Lakhs/Crores Formatting</li>
                <li>TRAI DLT SMS & WhatsApp Compliant Templates</li>
              </ul>
            </div>

            {/* Global Mode Card */}
            <div
              onClick={() => toggleMode('GLOBAL')}
              style={{
                border: mode === 'GLOBAL' ? '2px solid var(--gold-500)' : '1px solid var(--border-subtle)',
                background: mode === 'GLOBAL' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                padding: '20px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🌐</span>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '16px' }}>Global (US / UK / EU) Mode</h4>
                </div>
                {mode === 'GLOBAL' && <span className="status-pill badge-emerald">ACTIVE</span>}
              </div>
              <ul style={{ fontSize: '12.5px', color: 'var(--text-secondary)', paddingLeft: '18px', lineHeight: 1.8 }}>
                <li>IRS 501(c)(3) Donor Contribution Receipts</li>
                <li>UK HMRC Gift Aid 25% Tax Reclaim Schedule</li>
                <li>Multi-Currency Ledger (USD $, GBP £, EUR €)</li>
                <li>Twilio A2P 10DLC Carrier Registered Routing</li>
                <li>GDPR Compliant Privacy & Opt-Out Headers</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Role Edit Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Custom Role'}
              </h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowRoleModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole}>
              <div className="modal-content">
                <div className="form-grid">
                  <div>
                    <label className="form-label">Role Name *</label>
                    <input
                      type="text"
                      required
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="form-input"
                      placeholder="e.g. Audit Committee / Youth Coordinator"
                    />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      className="form-input"
                      placeholder="Brief summary of duties and responsibilities"
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label" style={{ marginBottom: '8px' }}>
                      Granular Access Privileges:
                    </label>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '8px',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {availablePermissions.map((perm) => {
                        const isChecked = roleForm.permissions.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              fontSize: '12.5px',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: 'var(--radius-sm)',
                              background: isChecked ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                              border: isChecked ? '1px solid var(--gold-500)' : '1px solid transparent',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRoleForm({ ...roleForm, permissions: [...roleForm.permissions, perm.key] });
                                } else {
                                  setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter((p) => p !== perm.key) });
                                }
                              }}
                              style={{ marginTop: '3px' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{perm.label}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{perm.category}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} />
                  <span>Save Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
