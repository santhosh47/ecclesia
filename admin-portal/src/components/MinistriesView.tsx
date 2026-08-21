import React, { useState } from 'react';
import { UsersRound, Plus, MapPin, Clock, User, ShieldCheck, Edit2, Trash2, X, Save } from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
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
  const { hasPermission } = useLocalization();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);

  const [newMinistry, setNewMinistry] = useState({
    name: '',
    category: 'Ministry',
    description: '',
    meeting_time: '',
    meeting_location: '',
    leader_id: undefined as number | undefined,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'Ministry',
    description: '',
    meeting_time: '',
    meeting_location: '',
    leader_id: undefined as number | undefined,
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMinistry.name.trim()) return;
    onAddMinistry(newMinistry);
    setNewMinistry({ name: '', category: 'Ministry', description: '', meeting_time: '', meeting_location: '', leader_id: undefined });
    setShowAddModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMinistry || !editFormData.name.trim()) return;
    try {
      await api.updateMinistry(editingMinistry.id, editFormData);
      setEditingMinistry(null);
      window.location.reload(); // Quick refresh or parent reload
    } catch (err: any) {
      alert(err.message || 'Failed to update ministry');
    }
  };

  const handleDelete = async (ministry: Ministry) => {
    if (!confirm(`Delete ministry "${ministry.name}"?`)) return;
    try {
      await api.deleteMinistry(ministry.id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to delete ministry');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Ministries & Small Groups
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Coordinate volunteer teams, departments, small group fellowships, and ministry rosters
          </p>
        </div>
        {hasPermission('edit_members') && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>New Ministry / Group</span>
          </button>
        )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="nav-badge badge-gold">{m.member_count} members</span>
                  {hasPermission('edit_members') && (
                    <>
                      <button
                        className="btn btn-icon btn-secondary btn-sm"
                        onClick={() => {
                          setEditingMinistry(m);
                          setEditFormData({
                            name: m.name,
                            category: m.category,
                            description: m.description || '',
                            meeting_time: m.meeting_time || '',
                            meeting_location: m.meeting_location || '',
                            leader_id: m.leader_id || undefined,
                          });
                        }}
                        title="Edit Ministry"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn btn-icon btn-danger btn-sm"
                        onClick={() => handleDelete(m)}
                        title="Delete Ministry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
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

      {/* Modal: Add Ministry */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Ministry or Small Group</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
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

      {/* Modal: Edit Ministry */}
      {editingMinistry && (
        <div className="modal-overlay" onClick={() => setEditingMinistry(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--gold-400)" />
                <h3 className="modal-title">Edit Ministry: {editingMinistry.name}</h3>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setEditingMinistry(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-content">
                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Ministry / Group Name *</label>
                    <input
                      className="form-input"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
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
                      value={editFormData.leader_id || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, leader_id: e.target.value ? Number(e.target.value) : undefined })}
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
                      value={editFormData.meeting_time}
                      onChange={(e) => setEditFormData({ ...editFormData, meeting_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Meeting Location</label>
                    <input
                      className="form-input"
                      value={editFormData.meeting_location}
                      onChange={(e) => setEditFormData({ ...editFormData, meeting_location: e.target.value })}
                    />
                  </div>
                  <div className="form-group-full">
                    <label className="form-label">Description & Mission</label>
                    <textarea
                      className="form-textarea"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMinistry(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
