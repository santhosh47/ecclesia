import React, { useState } from 'react';
import { Search, UserPlus, Filter, Phone, Mail, Home, Users, Trash2, Eye, ShieldCheck, Edit2 } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { Member } from '../types';

interface MembersViewProps {
  members: Member[];
  isLoading: boolean;
  onSelectMember: (memberId: number) => void;
  onOpenAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (memberId: number) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  isLoading,
  onSelectMember,
  onOpenAddMember,
  onEditMember,
  onDeleteMember,
}) => {
  const { hasPermission } = useLocalization();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [leadershipFilter, setLeadershipFilter] = useState<string>('ALL');

  const getRoleBadgeClass = (role?: string | null) => {
    if (!role) return '';
    const lower = role.toLowerCase();
    if (lower.includes('elder')) return 'badge-elder';
    if (lower.includes('deacon')) return 'badge-deacon';
    if (lower.includes('minister')) return 'badge-minister';
    if (lower.includes('preacher')) return 'badge-preacher';
    if (lower.includes('pastor')) return 'badge-pastor';
    if (lower.includes('evangelist')) return 'badge-evangelist';
    return 'badge-neutral';
  };

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const roleStr = (m.leadership_role || '').toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      roleStr.includes(searchTerm.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.phone && m.phone.includes(searchTerm)) ||
      (m.city && m.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || m.member_type === typeFilter;

    let matchesLeadership = true;
    if (leadershipFilter === 'LEADERS_ONLY') {
      matchesLeadership = !!m.leadership_role && m.leadership_role !== '';
    } else if (leadershipFilter === 'GENERAL_ONLY') {
      matchesLeadership = !m.leadership_role || m.leadership_role === '';
    } else if (leadershipFilter !== 'ALL') {
      matchesLeadership = m.leadership_role === leadershipFilter;
    }

    return matchesSearch && matchesStatus && matchesType && matchesLeadership;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Church Member Directory</span>
            <span style={{ fontSize: '13px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--gold-400)', fontWeight: 600 }}>
              {members.length} Members
            </span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Manage congregation records, leadership roles (Elders, Deacons, Ministers, Preachers), households, and contact profiles
          </p>
        </div>
        {hasPermission('edit_members') && (
          <button className="btn btn-primary" onClick={onOpenAddMember}>
            <UserPlus size={16} />
            <span>Add New Member</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="search-box" style={{ width: '320px', minWidth: '260px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name, role, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--gold-400)" />
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Role:</label>
            <select
              className="form-select"
              value={leadershipFilter}
              onChange={(e) => setLeadershipFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="ALL">All Roles</option>
              <option value="LEADERS_ONLY">★ Church Leaders Only</option>
              <option value="Pastor">Pastor</option>
              <option value="Elder">Elder</option>
              <option value="Deacon">Deacon</option>
              <option value="Minister">Minister</option>
              <option value="Preacher">Preacher</option>
              <option value="Evangelist">Evangelist</option>
              <option value="GENERAL_ONLY">General Members</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Clergy">Clergy</option>
              <option value="Probationary">Probationary</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Type:</label>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="Adult">Adult</option>
              <option value="Youth">Youth</option>
              <option value="Child">Child</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
        </div>
      </div>

      {/* Member Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Leadership & Category</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Household</th>
                <th>Ministries</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading congregation records...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} onClick={() => onSelectMember(m.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            `${m.first_name[0]}${m.last_name[0]}`
                          )}
                        </div>
                        <div>
                          <div className="person-name">
                            {m.title ? `${m.title} ` : ''}{m.first_name} {m.last_name}
                          </div>
                          <div className="person-meta">
                            {m.gender} • {m.marital_status} • {m.occupation || 'Member'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        {m.leadership_role ? (
                          <span className={`status-pill ${getRoleBadgeClass(m.leadership_role)}`}>
                            ★ {m.leadership_role}
                          </span>
                        ) : null}
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {m.member_type}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${m.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px' }}>
                        <div style={{ color: 'var(--text-primary)' }}>{m.email || 'No email'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '2px' }}>{m.phone || 'No phone'}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: m.household_name ? 'var(--gold-400)' : 'var(--text-muted)', fontWeight: m.household_name ? 600 : 400 }}>
                        {m.household_name || 'Independent'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {m.ministries?.length ? m.ministries.join(', ') : 'None'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-icon btn-secondary btn-sm"
                          onClick={() => onSelectMember(m.id)}
                          title="View Full Member Profile"
                        >
                          <Eye size={14} />
                        </button>
                        {hasPermission('edit_members') && (
                          <>
                            <button
                              className="btn btn-icon btn-secondary btn-sm"
                              onClick={() => onEditMember(m)}
                              title="Edit Member Profile"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-icon btn-danger btn-sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${m.first_name} ${m.last_name}?`)) {
                                  onDeleteMember(m.id);
                                }
                              }}
                              title="Delete Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
