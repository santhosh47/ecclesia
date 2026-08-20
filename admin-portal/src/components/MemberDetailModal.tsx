import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Calendar,
  DollarSign,
  ClipboardCheck,
  HeartHandshake,
  Home,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Download,
} from 'lucide-react';
import { api } from '../api/client';
import { MemberDetail, PastoralCareNote } from '../types';

interface MemberDetailModalProps {
  memberId: number | null;
  onClose: () => void;
  onOpenDonorStatement: (memberId: number) => void;
  onRefreshList: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  memberId,
  onClose,
  onOpenDonorStatement,
  onRefreshList,
}) => {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [notes, setNotes] = useState<PastoralCareNote[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'finances' | 'pastoral'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState({ category: 'General Care', author_name: 'Pastor David', content: '', is_confidential: false });
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (!memberId) return;
    setIsLoading(true);
    Promise.all([api.getMemberDetail(memberId), api.getPastoralNotes(memberId)])
      .then(([m, n]) => {
        setMember(m);
        setNotes(n);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [memberId]);

  if (!memberId) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content.trim()) return;
    try {
      const created = await api.createPastoralNote({
        member_id: memberId,
        author_name: newNote.author_name,
        category: newNote.category,
        content: newNote.content,
        is_confidential: newNote.is_confidential,
      });
      setNotes([created, ...notes]);
      setNewNote({ category: 'General Care', author_name: 'Pastor David', content: '', is_confidential: false });
      setIsAddingNote(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add pastoral care note');
    }
  };

  const calculateAge = (dobString?: string | null) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
              {member?.avatar_url ? (
                <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                `${member?.first_name?.[0] ?? ''}${member?.last_name?.[0] ?? ''}`
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 className="modal-title">
                  {member?.title ? `${member.title} ` : ''}
                  {member?.first_name} {member?.last_name}
                </h3>
                {member?.leadership_role ? (
                  <span className={`status-pill badge-${member.leadership_role.toLowerCase()}`}>
                    ★ {member.leadership_role}
                  </span>
                ) : null}
                <span className={`status-pill status-${member?.status?.toLowerCase().replace(/\s+/g, '-') ?? 'active'}`}>
                  {member?.status}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {member?.member_type} • {member?.occupation || 'Congregant'} {member?.household_name ? `• ${member.household_name}` : ''}
              </div>
            </div>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div style={{ padding: '0 24px', background: 'rgba(0,0,0,0.1)' }}>
          <div className="tabs-nav" style={{ margin: 0 }}>
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Overview & Contact
            </button>
            <button className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`} onClick={() => setActiveTab('milestones')}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Important Dates & Journey
            </button>
            <button className={`tab-btn ${activeTab === 'finances' ? 'active' : ''}`} onClick={() => setActiveTab('finances')}>
              <DollarSign size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Giving & Attendance
            </button>
            <button className={`tab-btn ${activeTab === 'pastoral' ? 'active' : ''}`} onClick={() => setActiveTab('pastoral')}>
              <HeartHandshake size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Pastoral Care Logs ({notes.length})
            </button>
          </div>
        </div>

        <div className="modal-content">
          {isLoading || !member ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading profile...</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="grid-equal-2">
                    <div className="card" style={{ padding: '18px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold-400)', marginBottom: '12px', textTransform: 'uppercase' }}>
                        Contact Information
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Mail size={15} color="var(--text-muted)" />
                          <span>{member.email || 'No email on file'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Phone size={15} color="var(--text-muted)" />
                          <span>{member.phone || 'No phone on file'}</span>
                          {member.alternate_phone && <small style={{ color: 'var(--text-muted)' }}>(Alt: {member.alternate_phone})</small>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <MapPin size={15} color="var(--text-muted)" style={{ marginTop: '3px' }} />
                          <div>
                            <div>{member.address || 'No street address'}</div>
                            {member.city && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                {member.city}, {member.state} {member.postal_code}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card" style={{ padding: '18px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold-400)', marginBottom: '12px', textTransform: 'uppercase' }}>
                        Demographics & Family
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Gender: </span>
                          <strong>{member.gender || 'Not specified'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Marital Status: </span>
                          <strong>{member.marital_status || 'Single'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Family Household: </span>
                          <strong>{member.household_name ? `${member.household_name} (${member.household_role || 'Member'})` : 'Independent / None'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Ministries & Groups: </span>
                          <strong>{member.ministries?.length ? member.ministries.join(', ') : 'None assigned'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {member.notes && (
                    <div className="card" style={{ padding: '16px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Administrative Notes
                      </h4>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{member.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MILESTONES */}
              {activeTab === 'milestones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="grid-equal-2">
                    <div className="milestone-item" style={{ margin: 0 }}>
                      <div className="milestone-left">
                        <div className="milestone-icon icon-bday">🎂</div>
                        <div>
                          <div style={{ fontWeight: '600' }}>Date of Birth</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {member.date_of_birth
                              ? `${new Date(member.date_of_birth).toLocaleDateString()} (${calculateAge(member.date_of_birth)} years old)`
                              : 'Not recorded'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="milestone-item" style={{ margin: 0 }}>
                      <div className="milestone-left">
                        <div className="milestone-icon icon-anniv">💍</div>
                        <div>
                          <div style={{ fontWeight: '600' }}>Wedding Anniversary</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {member.wedding_anniversary
                              ? `${new Date(member.wedding_anniversary).toLocaleDateString()} (${calculateAge(member.wedding_anniversary)} yrs married)`
                              : 'Not applicable / recorded'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="milestone-item" style={{ margin: 0 }}>
                      <div className="milestone-left">
                        <div className="milestone-icon icon-baptism">🕊️</div>
                        <div>
                          <div style={{ fontWeight: '600' }}>Water Baptism</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {member.baptism_date
                              ? `${new Date(member.baptism_date).toLocaleDateString()} ${member.baptism_location ? `• ${member.baptism_location}` : ''}`
                              : 'Not yet baptized'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="milestone-item" style={{ margin: 0 }}>
                      <div className="milestone-left">
                        <div className="milestone-icon icon-bday" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                          🏛️
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>Membership Joined Date</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : 'Active since registration'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FINANCES & ATTENDANCE */}
              {activeTab === 'finances' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="grid-equal-2">
                    <div className="kpi-card" style={{ '--kpi-accent': 'var(--emerald)' } as any}>
                      <div className="kpi-info">
                        <h3>2026 YTD Contributions</h3>
                        <div className="kpi-value" style={{ color: '#34d399' }}>
                          ${member.total_contributions_ytd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="kpi-subtext">Total tithes, offerings, & special giving</div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenDonorStatement(member.id)}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        <Download size={13} />
                        <span>Tax Statement</span>
                      </button>
                    </div>

                    <div className="kpi-card" style={{ '--kpi-accent': 'var(--royal-blue)' } as any}>
                      <div className="kpi-info">
                        <h3>Attendance Health</h3>
                        <div className="kpi-value">{member.attendance_rate_percent}%</div>
                        <div className="kpi-subtext">
                          Last Attended: {member.last_attended_date ? new Date(member.last_attended_date).toLocaleDateString() : 'No recent attendance'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PASTORAL CARE LOGS */}
              {activeTab === 'pastoral' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Pastoral Notes & Visitation History</h4>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsAddingNote(!isAddingNote)}>
                      <Plus size={14} />
                      <span>{isAddingNote ? 'Cancel' : 'New Note'}</span>
                    </button>
                  </div>

                  {isAddingNote && (
                    <form onSubmit={handleAddNote} className="card" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
                      <div className="form-grid" style={{ marginBottom: '12px' }}>
                        <div>
                          <label className="form-label">Care Category</label>
                          <select
                            className="form-select"
                            value={newNote.category}
                            onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                          >
                            <option value="Pastoral Visit">Pastoral Visit</option>
                            <option value="Hospital">Hospital / Medical</option>
                            <option value="Counseling">Counseling Session</option>
                            <option value="Crisis">Crisis / Bereavement</option>
                            <option value="General Care">General Care Check-in</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Minister / Author Name</label>
                          <input
                            className="form-input"
                            value={newNote.author_name}
                            onChange={(e) => setNewNote({ ...newNote, author_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label className="form-label">Note Details</label>
                        <textarea
                          className="form-textarea"
                          placeholder="Summarize visit or pastoral conversation..."
                          value={newNote.content}
                          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="submit" className="btn btn-primary btn-sm">
                          Save Note
                        </button>
                      </div>
                    </form>
                  )}

                  {notes.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                      No pastoral notes logged for this member yet.
                    </p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="status-pill status-clergy">{n.category}</span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {n.author_name} • {new Date(n.created_at || n.date || '').toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{n.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
