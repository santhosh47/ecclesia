import React, { useState } from 'react';
import { Search, UserPlus, Filter, Phone, Mail, Home, Users, Trash2, Eye } from 'lucide-react';
import { Member } from '../types';

interface MembersViewProps {
  members: Member[];
  isLoading: boolean;
  onSelectMember: (memberId: number) => void;
  onOpenAddMember: () => void;
  onDeleteMember: (memberId: number) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  isLoading,
  onSelectMember,
  onOpenAddMember,
  onDeleteMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.phone && m.phone.includes(searchTerm)) ||
      (m.city && m.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || m.member_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Church Member Directory
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Manage {members.length} registered members, households, and spiritual journey profiles
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenAddMember}>
          <UserPlus size={16} />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div className="nav-search" style={{ width: '360px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name, email, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Status:</label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Regular Attendee">Regular Attendee</option>
            <option value="Visitor">Visitor</option>
            <option value="Clergy">Clergy / Staff</option>
            <option value="Inactive">Inactive</option>
          </select>

          <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginLeft: '8px' }}>Type:</label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Age Groups</option>
            <option value="Adult">Adult</option>
            <option value="Youth">Youth</option>
            <option value="Child">Child</option>
            <option value="Senior">Senior</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Status</th>
                <th>Category</th>
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
                    Loading member directory...
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
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => onSelectMember(m.id)}>
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
                            {m.title ? `${m.title} ` : ''}
                            {m.first_name} {m.last_name}
                          </div>
                          <div className="person-meta">{m.occupation || 'Member'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${m.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{m.member_type}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px' }}>
                        <div>{m.email || 'No email'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>{m.phone || 'No phone'}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: m.household_name ? 'var(--gold-400)' : 'var(--text-muted)' }}>
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
