import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Filter,
  Phone,
  Mail,
  Home,
  Users,
  Trash2,
  Eye,
  ShieldCheck,
  Edit2,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../api/client';
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
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [maritalFilter, setMaritalFilter] = useState<string>('ALL');
  const [baptismLocationFilter, setBaptismLocationFilter] = useState<string>('');
  const [hasBaptismFilter, setHasBaptismFilter] = useState<string>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setLeadershipFilter('ALL');
    setGenderFilter('ALL');
    setMaritalFilter('ALL');
    setBaptismLocationFilter('');
    setHasBaptismFilter('ALL');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    leadershipFilter !== 'ALL' ||
    genderFilter !== 'ALL' ||
    maritalFilter !== 'ALL' ||
    baptismLocationFilter !== '' ||
    hasBaptismFilter !== 'ALL';

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const roleStr = (m.leadership_role || '').toLowerCase();
    const matchesSearch =
      !searchTerm ||
      fullName.includes(searchTerm.toLowerCase()) ||
      roleStr.includes(searchTerm.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.phone && m.phone.includes(searchTerm)) ||
      (m.city && m.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.household_name && m.household_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || m.member_type === typeFilter;
    const matchesGender = genderFilter === 'ALL' || m.gender === genderFilter;
    const matchesMarital = maritalFilter === 'ALL' || m.marital_status === maritalFilter;

    let matchesLeadership = true;
    if (leadershipFilter === 'LEADERS_ONLY') {
      matchesLeadership = !!m.leadership_role && m.leadership_role !== '';
    } else if (leadershipFilter === 'GENERAL_ONLY') {
      matchesLeadership = !m.leadership_role || m.leadership_role === '';
    } else if (leadershipFilter !== 'ALL') {
      matchesLeadership = m.leadership_role === leadershipFilter;
    }

    const matchesBaptismLoc =
      !baptismLocationFilter ||
      (m.baptism_location && m.baptism_location.toLowerCase().includes(baptismLocationFilter.toLowerCase()));

    let matchesHasBaptism = true;
    if (hasBaptismFilter === 'YES') {
      matchesHasBaptism = !!m.baptism_date;
    } else if (hasBaptismFilter === 'NO') {
      matchesHasBaptism = !m.baptism_date;
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesLeadership &&
      matchesGender &&
      matchesMarital &&
      matchesBaptismLoc &&
      matchesHasBaptism
    );
  });

  // Client-side sorting on filtered results
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name' || sortBy === 'last_name') {
      const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
      const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
      comparison = nameA.localeCompare(nameB);
    } else if (sortBy === 'first_name') {
      comparison = a.first_name.localeCompare(b.first_name);
    } else if (sortBy === 'status') {
      comparison = (a.status || '').localeCompare(b.status || '');
    } else if (sortBy === 'member_type') {
      comparison = (a.member_type || '').localeCompare(b.member_type || '');
    } else if (sortBy === 'gender') {
      comparison = (a.gender || '').localeCompare(b.gender || '');
    } else if (sortBy === 'household_name') {
      comparison = (a.household_name || '').localeCompare(b.household_name || '');
    } else if (sortBy === 'joined_date') {
      const dateA = a.joined_date ? new Date(a.joined_date).getTime() : 0;
      const dateB = b.joined_date ? new Date(b.joined_date).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortBy === 'baptism_date') {
      const dateA = a.baptism_date ? new Date(a.baptism_date).getTime() : 0;
      const dateB = b.baptism_date ? new Date(b.baptism_date).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortBy === 'age' || sortBy === 'date_of_birth') {
      const dobA = a.date_of_birth ? new Date(a.date_of_birth).getTime() : 0;
      const dobB = b.date_of_birth ? new Date(b.date_of_birth).getTime() : 0;
      comparison = dobA - dobB;
    } else if (sortBy === 'leadership_role') {
      comparison = (a.leadership_role || '').localeCompare(b.leadership_role || '');
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleExportCsv = () => {
    const url = api.getExportMembersCsvUrl({
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      member_type: typeFilter !== 'ALL' ? typeFilter : undefined,
      gender: genderFilter !== 'ALL' ? genderFilter : undefined,
      marital_status: maritalFilter !== 'ALL' ? maritalFilter : undefined,
      leadership_role: leadershipFilter !== 'ALL' ? leadershipFilter : undefined,
    });
    window.open(url, '_blank');
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.35, marginLeft: '4px' }} />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} style={{ color: 'var(--gold-400)', marginLeft: '4px' }} />
    ) : (
      <ArrowDown size={13} style={{ color: 'var(--gold-400)', marginLeft: '4px' }} />
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Church Member Directory</span>
            <span style={{ fontSize: '13px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--gold-400)', fontWeight: 600 }}>
              {sortedMembers.length} of {members.length} Members
            </span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Manage congregation records, leadership roles (Elders, Deacons, Ministers, Preachers), households, and contact profiles
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCsv}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            title="Download CSV report of church members"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {hasPermission('edit_members') && (
            <button className="btn btn-primary" onClick={onOpenAddMember}>
              <UserPlus size={16} />
              <span>Add New Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-box" style={{ width: '320px', minWidth: '260px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name, role, email, phone, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
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
                <option value="Visitor">Visitor</option>
                <option value="Regular Attendee">Regular Attendee</option>
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

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`btn btn-sm ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <SlidersHorizontal size={13} />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Gender:</label>
              <select
                className="form-select"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
              >
                <option value="ALL">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Marital:</label>
              <select
                className="form-select"
                value={maritalFilter}
                onChange={(e) => setMaritalFilter(e.target.value)}
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
              >
                <option value="ALL">All Marital Statuses</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Baptism Record:</label>
              <select
                className="form-select"
                value={hasBaptismFilter}
                onChange={(e) => setHasBaptismFilter(e.target.value)}
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
              >
                <option value="ALL">All Records</option>
                <option value="YES">Baptized Only</option>
                <option value="NO">Not Recorded</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Baptism Location:</label>
              <input
                type="text"
                placeholder="e.g. Cathedral, River, Parish"
                className="form-input"
                value={baptismLocationFilter}
                onChange={(e) => setBaptismLocationFilter(e.target.value)}
                style={{ width: '180px', padding: '5px 10px', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort Column:</label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
              >
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="member_type">Category</option>
                <option value="leadership_role">Role</option>
                <option value="household_name">Household</option>
                <option value="joined_date">Joined Date</option>
                <option value="baptism_date">Baptism Date</option>
                <option value="age">Age / DOB</option>
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{ padding: '5px 8px' }}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Filters:</span>

            {searchTerm && (
              <span className="status-pill badge-neutral" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Search: "{searchTerm}"
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
              </span>
            )}
            {leadershipFilter !== 'ALL' && (
              <span className="status-pill badge-amber" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Role: {leadershipFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setLeadershipFilter('ALL')} />
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="status-pill badge-blue" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Status: {statusFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('ALL')} />
              </span>
            )}
            {typeFilter !== 'ALL' && (
              <span className="status-pill badge-purple" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Category: {typeFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setTypeFilter('ALL')} />
              </span>
            )}
            {genderFilter !== 'ALL' && (
              <span className="status-pill badge-neutral" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Gender: {genderFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setGenderFilter('ALL')} />
              </span>
            )}
            {maritalFilter !== 'ALL' && (
              <span className="status-pill badge-neutral" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Marital: {maritalFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setMaritalFilter('ALL')} />
              </span>
            )}
            {hasBaptismFilter !== 'ALL' && (
              <span className="status-pill badge-emerald" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Baptism: {hasBaptismFilter === 'YES' ? 'Baptized' : 'Unrecorded'}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setHasBaptismFilter('ALL')} />
              </span>
            )}
            {baptismLocationFilter && (
              <span className="status-pill badge-neutral" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Location: {baptismLocationFilter}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setBaptismLocationFilter('')} />
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="btn btn-sm btn-secondary"
              style={{ padding: '2px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#fb7185' }}
            >
              <RotateCcw size={11} />
              <span>Reset All</span>
            </button>
          </div>
        )}
      </div>

      {/* Member Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Member Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th onClick={() => handleSort('leadership_role')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Leadership & Category</span>
                    {renderSortIcon('leadership_role')}
                  </div>
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th>Contact</th>
                <th onClick={() => handleSort('household_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>Household</span>
                    {renderSortIcon('household_name')}
                  </div>
                </th>
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
              ) : sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No members match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedMembers.map((m) => (
                  <tr key={m.id} onClick={() => onSelectMember(m.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            `${(m.first_name || '')[0] || 'M'}${(m.last_name || '')[0] || ''}`
                          )}
                        </div>
                        <div>
                          <div className="person-name">
                            {m.title ? `${m.title} ` : ''}{m.first_name} {m.last_name}
                          </div>
                          <div className="person-meta">
                            {m.gender || 'Unknown'} • {m.marital_status || 'Single'} • {m.occupation || 'Member'}
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
                      <span className={`status-pill status-${(m.status || 'active').toLowerCase().replace(/\s+/g, '-')}`}>
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
