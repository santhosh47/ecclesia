import React, { useState } from 'react';
import { Home, Users, MapPin, Phone, Plus, UserCheck } from 'lucide-react';
import { Household } from '../types';

interface HouseholdsViewProps {
  households: Household[];
  isLoading: boolean;
  onSelectMember: (memberId: number) => void;
  onAddHousehold: (householdData: Partial<Household>) => void;
}

export const HouseholdsView: React.FC<HouseholdsViewProps> = ({
  households,
  isLoading,
  onSelectMember,
  onAddHousehold,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHousehold, setNewHousehold] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    home_phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHousehold.name.trim()) return;
    onAddHousehold(newHousehold);
    setNewHousehold({ name: '', address: '', city: '', state: '', postal_code: '', home_phone: '' });
    setShowAddModal(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Households & Family Units
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            {households.length} registered church families and connected household members
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>New Family Unit</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading households...</div>
      ) : households.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Home size={36} color="var(--gold-400)" style={{ margin: '0 auto 12px' }} />
          <h3>No households recorded yet.</h3>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Click "New Family Unit" to create a household.</p>
        </div>
      ) : (
        <div className="grid-equal-2">
          {households.map((h) => (
            <div key={h.id} className="card card-hover" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--gold-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Home size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{h.name}</h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {h.members.length} {h.members.length === 1 ? 'member' : 'members'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Household Address & Contact */}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {h.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} color="var(--text-muted)" />
                    <span>
                      {h.address}{h.city ? `, ${h.city}` : ''}{h.state ? `, ${h.state}` : ''} {h.postal_code || ''}
                    </span>
                  </div>
                )}
                {h.home_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{h.home_phone}</span>
                  </div>
                )}
              </div>

              {/* Members List in Family */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Family Members
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {h.members.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.025)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                      onClick={() => onSelectMember(m.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            `${m.first_name[0]}${m.last_name[0]}`
                          )}
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '13.5px' }}>
                          {m.first_name} {m.last_name}
                        </span>
                      </div>
                      <span className="status-pill status-clergy" style={{ fontSize: '11px' }}>
                        {m.household_role || 'Member'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Household Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Household</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-content">
                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Household Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. The Sterling Family"
                      value={newHousehold.name}
                      onChange={(e) => setNewHousehold({ ...newHousehold, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-full">
                    <label className="form-label">Street Address</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 742 Evergreen Terrace"
                      value={newHousehold.address}
                      onChange={(e) => setNewHousehold({ ...newHousehold, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">City</label>
                    <input
                      className="form-input"
                      value={newHousehold.city}
                      onChange={(e) => setNewHousehold({ ...newHousehold, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">State / Region</label>
                    <input
                      className="form-input"
                      value={newHousehold.state}
                      onChange={(e) => setNewHousehold({ ...newHousehold, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Postal Code</label>
                    <input
                      className="form-input"
                      value={newHousehold.postal_code}
                      onChange={(e) => setNewHousehold({ ...newHousehold, postal_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Home Phone</label>
                    <input
                      className="form-input"
                      value={newHousehold.home_phone}
                      onChange={(e) => setNewHousehold({ ...newHousehold, home_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Household
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
