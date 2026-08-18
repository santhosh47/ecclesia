import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  DollarSign,
  Globe,
  Key,
  Layers,
  Lock,
  Plus,
  Save,
  Shield,
  Trash2,
  UserCheck,
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

  // New Custom Role Modal State
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
    await updateChurchProfile(profileForm);
    setSaveSuccess('Church profile updated successfully!');
    setTimeout(() => setSaveSuccess(null), 3000);
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
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const moduleDefinitions = [
    { key: 'double_entry_ledger', label: 'Double-Entry Ledger & Bookkeeping', desc: 'General ledger, balanced journal entries, chart of accounts, and trial balance reports.' },
    { key: 'payroll_staff_ledger', label: 'Clergy & Staff Payroll', desc: 'Monthly payslip calculation, allowances, deductions, and disbursement records.' },
    { key: 'giving_and_pledges', label: 'Giving, Tithes & Pledge Campaigns', desc: 'Online and offline donation tracking, pledge fulfillment gauges, and donor tax statements.' },
    { key: 'church_activities_calendar', label: 'Church Activities & Events Calendar', desc: 'Schedule regular weekly worship services, choir rehearsals, committee meetings, and conferences.' },
    { key: 'pdf_certificates', label: 'Milestone Life Certificates & PDF Generator', desc: 'Baptism, Wedding, Dedication, Confirmation certificates with dynamic gold ornate borders.' },
    { key: 'mass_messaging', label: 'Mass Messaging & WhatsApp Broadcasts', desc: 'TRAI DLT compliant SMS templates and broadcast dispatch to congregation groups.' },
    { key: 'tax_compliance', label: 'Tax Compliance (80G / 501(c)(3) / FCRA)', desc: 'Section 80G tax exemption receipts, Form 10BD export schedule, and foreign inward remittance register.' },
    { key: 'attendance_checkin', label: 'Attendance Roster & Absentee Alerts', desc: 'Live headcount check-in and 3-week consecutive absence alerts for pastoral follow-up.' },
    { key: 'ministries_groups', label: 'Ministries & Department Rosters', desc: 'Organize worship team, youth fellowship, Sunday school, and committee memberships.' },
    { key: 'pastoral_care', label: 'Pastoral Care Notes & Prayer Board', desc: 'Confidential visitation logs, pastoral counseling records, and answered prayer tracking.' },
    { key: 'csv_migration', label: 'CSV Migration Tool (ChurchCRM / Excel)', desc: 'Batch import/export of church membership rosters and family groupings.' },
  ];

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Administration & System Customization</h1>
          <p className="view-subtitle">
            Configure church profile, toggle fine-grained feature modules, and manage role-based access permissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <UserCheck size={16} color="#6366f1" />
            <span>Active Role Tester:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
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
        <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'profile' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'profile' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Building size={18} />
          <span>Church Profile & Branding</span>
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'modules' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'modules' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Layers size={18} />
          <span>Feature Module Toggles</span>
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'rbac' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'rbac' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Shield size={18} />
          <span>Roles & Permissions (RBAC)</span>
        </button>
        <button
          onClick={() => setActiveTab('localization')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'localization' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'localization' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Globe size={18} />
          <span>Localization & Tax Regime</span>
        </button>
      </div>

      {/* Tab 1: Church Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
              Parish & Organization Identity
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>
                  Church Official Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. St. Luke's Ecclesia Church"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>
                  Senior Pastor / Presbyter-in-Charge
                </label>
                <input
                  type="text"
                  value={profileForm.senior_pastor || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, senior_pastor: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Rev. Dr. Samuel Thomas"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>
                  Denomination / Affiliation
                </label>
                <input
                  type="text"
                  value={profileForm.denomination || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, denomination: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Anglican Communion / Ecumenical"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>
                  Motto / Vision Statement
                </label>
                <input
                  type="text"
                  value={profileForm.motto || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, motto: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Worship • Community • Discipleship"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
              Address & Contact Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>Street Address</label>
                <input
                  type="text"
                  value={profileForm.address || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>City</label>
                  <input
                    type="text"
                    value={profileForm.city || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>State</label>
                  <input
                    type="text"
                    value={profileForm.state || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>Postal Code</label>
                  <input
                    type="text"
                    value={profileForm.postal_code || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>Email</label>
                  <input
                    type="email"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
              Tax & Legal Registrations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>
                  India 80G Tax Exemption Reg. No.
                </label>
                <input
                  type="text"
                  value={profileForm.tax_id_in_80g || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, tax_id_in_80g: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="CIT(E)/BLR/80G/2024-25/..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>
                  Church Trust PAN Number
                </label>
                <input
                  type="text"
                  value={profileForm.pan_number || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, pan_number: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. AABTE1234F"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>
                  FCRA Registration No. (MHA)
                </label>
                <input
                  type="text"
                  value={profileForm.fcra_registration_no || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, fcra_registration_no: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. 094421876"
                />
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem' }}>
              <Save size={18} />
              <span>Save Church Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Feature Module Toggles */}
      {activeTab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: '#f8fafc', borderLeft: '4px solid #6366f1' }}>
            <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Fine-Grained System Customization</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Toggle non-essential modules on or off based on your parish workflow requirements. Core congregation management (Members & Households) remains permanently active.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
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
                    border: isEnabled ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                    background: isEnabled ? '#ffffff' : '#f8fafc',
                    opacity: isEnabled ? 1 : 0.75,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontWeight: 600, color: isEnabled ? '#1e293b' : '#64748b', fontSize: '1rem' }}>
                        {mod.label}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          background: isEnabled ? '#ecfdf5' : '#f1f5f9',
                          color: isEnabled ? '#059669' : '#64748b',
                        }}
                      >
                        {isEnabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4, marginBottom: '1rem' }}>
                      {mod.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleModule(mod.key)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: isEnabled ? '#fee2e2' : '#e0e7ff',
                      color: isEnabled ? '#b91c1c' : '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>User Roles & Access Control</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Define security privileges for clergy, elders, treasurers, staff, and ministry coordinators.
              </p>
            </div>
            <button
              onClick={() => handleOpenRoleModal()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              <span>Create Custom Role</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {roles.map((role) => (
              <div key={role.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shield size={18} color="#6366f1" />
                      <h4 style={{ fontWeight: 600, color: '#1e293b' }}>{role.name}</h4>
                    </div>
                    {role.is_system ? (
                      <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        SYSTEM
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                    {role.description}
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Assigned Privileges ({role.permissions.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {role.permissions.map((p) => (
                        <span key={p} style={{ fontSize: '0.7rem', background: '#eef2ff', color: '#4f46e5', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => handleOpenRoleModal(role)}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                  >
                    Edit Permissions
                  </button>
                  {!role.is_system && (
                    <button
                      onClick={() => deleteRole(role.id)}
                      className="btn"
                      style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.4rem 0.6rem' }}
                    >
                      <Trash2 size={16} />
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
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
            Active Jurisdiction & Tax Regime
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div
              onClick={() => toggleMode('IN')}
              style={{
                border: mode === 'IN' ? '2px solid #6366f1' : '1px solid #e2e8f0',
                background: mode === 'IN' ? '#f5f3ff' : '#ffffff',
                padding: '1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🇮🇳</span>
                <h4 style={{ fontWeight: 700, color: '#1e293b' }}>India (IN) Mode</h4>
              </div>
              <ul style={{ fontSize: '0.8rem', color: '#475569', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li>Section 80G Tax Exemption Certificates</li>
                <li>Income Tax Form 10BD Annual Return Statement</li>
                <li>FCRA Foreign Inward Remittance Ledger</li>
                <li>UPI & Razorpay Payment Routing</li>
                <li>TRAI DLT SMS & WhatsApp Compliant Templates</li>
              </ul>
            </div>

            <div
              onClick={() => toggleMode('GLOBAL')}
              style={{
                border: mode === 'GLOBAL' ? '2px solid #6366f1' : '1px solid #e2e8f0',
                background: mode === 'GLOBAL' ? '#f5f3ff' : '#ffffff',
                padding: '1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🌐</span>
                <h4 style={{ fontWeight: 700, color: '#1e293b' }}>Global (US / UK / EU) Mode</h4>
              </div>
              <ul style={{ fontSize: '0.8rem', color: '#475569', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li>IRS 501(c)(3) Donor Contribution Receipts</li>
                <li>UK HMRC Gift Aid 25% Tax Reclaim Schedule</li>
                <li>Stripe & PayPal Multi-Currency Gateway</li>
                <li>Twilio A2P 10DLC Carrier Registered Routing</li>
                <li>GDPR Compliant Privacy & Opt-Out Headers</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Role Edit Modal */}
      {showRoleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
              {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Custom Role'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Configure role metadata and select granular permission checkboxes.
            </p>

            <form onSubmit={handleSaveRole}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    placeholder="e.g. Audit Committee / Youth Coordinator"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    placeholder="Brief summary of duties and responsibilities"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                    Granular Access Privileges:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {availablePermissions.map((perm) => {
                      const isChecked = roleForm.permissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                            color: '#334155',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            borderRadius: '4px',
                            background: isChecked ? '#eef2ff' : 'transparent',
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
                            style={{ marginTop: '0.15rem' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{perm.label}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{perm.category}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Save size={16} />
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
