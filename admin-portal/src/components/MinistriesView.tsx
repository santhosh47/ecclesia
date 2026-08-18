import React, { useState } from 'react';
import { UsersRound, Plus, MapPin, Clock, User, ShieldCheck } from 'lucide-react';
import { Member, Ministry } from '../types';

interface MinistriesViewProps {
  ministries: Ministry[];
  members: Member[];
  isLoading: boolean;
  onAddMinistry: (data: Partial<Ministry>) => void;
  onSelectMember: (memberId: number) => void;
}

export const MinistriesView: React.FC<MinistriesViewProps> = ({
  ministries,
  members,
  isLoading,
  onAddMinistry,
  onSelectMember,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMinistry, setNewMinistry] = useState({
    name: '',
    category: 'Ministry',
    description: '',
    meeting_time: '',
    meeting_location: '',
    leader_id: undefined as number | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMinistry.name.trim()) return;
    onAddMinistry(newMinistry);
    setNewMinistry({ name: '', category: 'Ministry', description: '', meeting_time: '', meeting_location: '', leader_id: undefined });
    setShowAddModal(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Ministries & Small Groups
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Coordinate volunteer teams, departments, small group fellowships, and ministry rosters
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>New Ministry / Group</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading ministries...</div>
      ) : ministries.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UsersRound size={36} color="var(--gold-400)" style={{ margin: '0 auto 12px' }} />
          <h3>No ministries configured.</h3>
        </div>
      ) : (
        <div className="grid-3">
          {ministries.map((m) => (
            <div key={m.id} className="card card-hover" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="status-pill status-regular">{m.category}</span>
                <span className="nav-badge badge-gold">{m.member_count} members</span>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {m.name}
              </h3>

              {m.description && (
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                  {m.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--text-muted)', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                {m.leader_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-400)' }}>
                    <ShieldCheck size={14} />
                    <span>Leader: <strong>{m.leader_name}</strong></span>
                  </div>
                )}
                {m.meeting_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} />
                    <span>{m.meeting_time}</span>
                  </div>
                )}
                {m.meeting_location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} />
                    <span>{m.meeting_location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Ministry Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Ministry or Small Group</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-content">
                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Ministry / Group Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Worship & Audio-Visual Team"
                      value={newMinistry.name}
                      onChange={(e) => setNewMinistry({ ...newMinistry, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newMinistry.category}
                      onChange={(e) => setNewMinistry({ ...newMinistry, category: e.target.value })}
                    >
                      <option value="Ministry">Ministry</option>
                      <option value="Small Group">Small Group / Bible Study</option>
                      <option value="Department">Department</option>
                      <option value="Committee">Committee</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Appointed Leader</label>
                    <select
                      className="form-select"
                      value={newMinistry.leader_id || ''}
                      onChange={(e) => setNewMinistry({ ...newMinistry, leader_id: e.target.value ? Number(e.target.value) : undefined })}
                    >
                      <option value="">-- Select Member Leader --</option>
                      {members.map((mem) => (
                        <option key={mem.id} value={mem.id}>
                          {mem.first_name} {mem.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Regular Meeting Time</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Thursdays @ 7:00 PM"
                      value={newMinistry.meeting_time}
                      onChange={(e) => setNewMinistry({ ...newMinistry, meeting_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Meeting Location</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Sanctuary Main Hall"
                      value={newMinistry.meeting_location}
                      onChange={(e) => setNewMinistry({ ...newMinistry, meeting_location: e.target.value })}
                    />
                  </div>
                  <div className="form-group-full">
                    <label className="form-label">Description & Mission</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Purpose of this group..."
                      value={newMinistry.description}
                      onChange={(e) => setNewMinistry({ ...newMinistry, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Ministry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
