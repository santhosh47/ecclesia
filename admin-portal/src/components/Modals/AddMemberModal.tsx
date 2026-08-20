import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Household, Member } from '../../types';

interface AddMemberModalProps {
  households: Household[];
  onClose: () => void;
  onSubmit: (memberData: Partial<Member>) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ households, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Member>>({
    first_name: '',
    middle_name: '',
    last_name: '',
    title: '',
    email: '',
    phone: '',
    alternate_phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    gender: 'Male',
    marital_status: 'Single',
    occupation: '',
    status: 'Active',
    member_type: 'Adult',
    date_of_birth: '',
    wedding_anniversary: '',
    baptism_date: '',
    baptism_location: '',
    joined_date: new Date().toISOString().split('T')[0],
    household_id: undefined,
    household_role: 'Member',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) return;
    
    // Clean empty strings to null for optional date fields
    const cleaned = {
      ...formData,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      date_of_birth: formData.date_of_birth || null,
      wedding_anniversary: formData.wedding_anniversary || null,
      baptism_date: formData.baptism_date || null,
      joined_date: formData.joined_date || null,
      household_id: formData.household_id ? Number(formData.household_id) : null,
    };
    onSubmit(cleaned);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={20} color="var(--gold-400)" />
            <h3 className="modal-title">Register New Church Member</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-content">
            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '14px' }}>
              1. Personal & Contact Information
            </h4>
            <div className="form-grid-3 form-grid" style={{ marginBottom: '20px' }}>
              <div>
                <label className="form-label">Title</label>
                <select
                  className="form-select"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                >
                  <option value="">None</option>
                  <option value="Pastor">Pastor</option>
                  <option value="Elder">Elder</option>
                  <option value="Deacon">Deacon</option>
                  <option value="Minister">Minister</option>
                  <option value="Preacher">Preacher</option>
                  <option value="Evangelist">Evangelist</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                </select>
              </div>
              <div>
                <label className="form-label">First Name *</label>
                <input
                  className="form-input"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Last Name *</label>
                <input
                  className="form-input"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Primary Phone</label>
                <input
                  className="form-input"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Occupation</label>
                <input
                  className="form-input"
                  value={formData.occupation || ''}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Street Address</label>
                <input
                  className="form-input"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">City</label>
                <input
                  className="form-input"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">State</label>
                <input
                  className="form-input"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Postal Code</label>
                <input
                  className="form-input"
                  value={formData.postal_code || ''}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '14px' }}>
              2. Membership & Demographics
            </h4>
            <div className="form-grid" style={{ marginBottom: '20px' }}>
              <div>
                <label className="form-label">Membership Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active Member</option>
                  <option value="Regular Attendee">Regular Attendee</option>
                  <option value="Visitor">Visitor</option>
                  <option value="Clergy">Clergy / Staff</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="form-label">Leadership & Ministry Category</label>
                <select
                  className="form-select"
                  value={formData.leadership_role || ''}
                  onChange={(e) => setFormData({ ...formData, leadership_role: e.target.value || null })}
                >
                  <option value="">General Member (No Leadership Role)</option>
                  <option value="Pastor">Pastor</option>
                  <option value="Elder">Elder</option>
                  <option value="Deacon">Deacon</option>
                  <option value="Minister">Minister</option>
                  <option value="Preacher">Preacher</option>
                  <option value="Evangelist">Evangelist</option>
                </select>
              </div>

              <div>
                <label className="form-label">Category / Age Group</label>
                <select
                  className="form-select"
                  value={formData.member_type}
                  onChange={(e) => setFormData({ ...formData, member_type: e.target.value })}
                >
                  <option value="Adult">Adult</option>
                  <option value="Youth">Youth / Student</option>
                  <option value="Child">Child</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div>
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="form-label">Marital Status</label>
                <select
                  className="form-select"
                  value={formData.marital_status || ''}
                  onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>

              <div>
                <label className="form-label">Assign Household / Family</label>
                <select
                  className="form-select"
                  value={formData.household_id || ''}
                  onChange={(e) => setFormData({ ...formData, household_id: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">None / Independent</option>
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Household Role</label>
                <select
                  className="form-select"
                  value={formData.household_role || ''}
                  onChange={(e) => setFormData({ ...formData, household_role: e.target.value })}
                >
                  <option value="Head of Household">Head of Household</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Dependent">Dependent</option>
                  <option value="Member">Member</option>
                </select>
              </div>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '14px' }}>
              3. Important Dates & Spiritual Milestones
            </h4>
            <div className="form-grid" style={{ marginBottom: '14px' }}>
              <div>
                <label className="form-label">Date of Birth (Birthday)</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Wedding Anniversary</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.wedding_anniversary || ''}
                  onChange={(e) => setFormData({ ...formData, wedding_anniversary: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Water Baptism Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.baptism_date || ''}
                  onChange={(e) => setFormData({ ...formData, baptism_date: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Baptism Location / Officiant</label>
                <input
                  className="form-input"
                  placeholder="e.g. Grace Chapel"
                  value={formData.baptism_location || ''}
                  onChange={(e) => setFormData({ ...formData, baptism_location: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Membership Joined Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.joined_date || ''}
                  onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
