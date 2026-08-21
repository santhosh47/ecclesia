import React, { useState } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { Household, Member, MemberDetail } from '../../types';

interface EditMemberModalProps {
  member: Member | MemberDetail;
  households: Household[];
  onClose: () => void;
  onSubmit: (memberData: Partial<Member>) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, households, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Member>>({
    first_name: member.first_name || '',
    middle_name: member.middle_name || '',
    last_name: member.last_name || '',
    title: member.title || '',
    leadership_role: member.leadership_role || '',
    email: member.email || '',
    phone: member.phone || '',
    alternate_phone: member.alternate_phone || '',
    address: member.address || '',
    city: member.city || '',
    state: member.state || '',
    postal_code: member.postal_code || '',
    gender: member.gender || 'Male',
    marital_status: member.marital_status || 'Single',
    occupation: member.occupation || '',
    status: member.status || 'Active',
    member_type: member.member_type || 'Adult',
    pan_number: member.pan_number || '',
    date_of_birth: member.date_of_birth ? member.date_of_birth.toString().split('T')[0] : '',
    wedding_anniversary: member.wedding_anniversary ? member.wedding_anniversary.toString().split('T')[0] : '',
    baptism_date: member.baptism_date ? member.baptism_date.toString().split('T')[0] : '',
    baptism_location: member.baptism_location || '',
    confirmation_date: member.confirmation_date ? member.confirmation_date.toString().split('T')[0] : '',
    joined_date: member.joined_date ? member.joined_date.toString().split('T')[0] : '',
    household_id: member.household_id || undefined,
    household_role: member.household_role || 'Member',
    notes: member.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) return;

    const cleaned: Partial<Member> = {
      ...formData,
      email: formData.email ? formData.email.trim() : undefined,
      phone: formData.phone ? formData.phone.trim() : undefined,
      alternate_phone: formData.alternate_phone ? formData.alternate_phone.trim() : undefined,
      leadership_role: formData.leadership_role || null,
      date_of_birth: formData.date_of_birth || null,
      wedding_anniversary: formData.wedding_anniversary || null,
      baptism_date: formData.baptism_date || null,
      confirmation_date: formData.confirmation_date || null,
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
            <Edit3 size={20} color="var(--gold-400)" />
            <h3 className="modal-title">Edit Member Profile: {member.first_name} {member.last_name}</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
                  type="text"
                  required
                  className="form-input"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Alternate Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.alternate_phone || ''}
                  onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '14px' }}>
              2. Leadership & Ecclesiastical Role
            </h4>
            <div className="form-grid-3 form-grid" style={{ marginBottom: '20px' }}>
              <div>
                <label className="form-label">Church Leadership Role</label>
                <select
                  className="form-select"
                  value={formData.leadership_role || ''}
                  onChange={(e) => setFormData({ ...formData, leadership_role: e.target.value })}
                >
                  <option value="">General Congregation Member</option>
                  <option value="Pastor">Pastor</option>
                  <option value="Elder">Elder</option>
                  <option value="Deacon">Deacon</option>
                  <option value="Minister">Minister</option>
                  <option value="Preacher">Preacher</option>
                  <option value="Evangelist">Evangelist</option>
                </select>
              </div>
              <div>
                <label className="form-label">Membership Status</label>
                <select
                  className="form-select"
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Clergy">Clergy</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label className="form-label">Member Category</label>
                <select
                  className="form-select"
                  value={formData.member_type || 'Adult'}
                  onChange={(e) => setFormData({ ...formData, member_type: e.target.value })}
                >
                  <option value="Adult">Adult</option>
                  <option value="Youth">Youth</option>
                  <option value="Child">Child</option>
                  <option value="Senior">Senior</option>
                  <option value="Associate">Associate</option>
                  <option value="Non-Resident">Non-Resident</option>
                </select>
              </div>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '14px' }}>
              3. Household Assignment & Demographics
            </h4>
            <div className="form-grid-3 form-grid" style={{ marginBottom: '20px' }}>
              <div>
                <label className="form-label">Household Unit</label>
                <select
                  className="form-select"
                  value={formData.household_id || ''}
                  onChange={(e) => setFormData({ ...formData, household_id: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Independent / None</option>
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city || 'Local'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Household Role</label>
                <select
                  className="form-select"
                  value={formData.household_role || 'Member'}
                  onChange={(e) => setFormData({ ...formData, household_role: e.target.value })}
                >
                  <option value="Head">Head of Household</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child / Dependent</option>
                  <option value="Parent">Parent / Senior</option>
                  <option value="Member">Family Member</option>
                </select>
              </div>
              <div>
                <label className="form-label">PAN / Tax ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ABCDE1234F"
                  value={formData.pan_number || ''}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={formData.gender || 'Male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Marital Status</label>
                <select
                  className="form-select"
                  value={formData.marital_status || 'Single'}
                  onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label className="form-label">Occupation</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.occupation || ''}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '14px' }}>
              4. Important Dates & Spiritual Journey
            </h4>
            <div className="form-grid-3 form-grid" style={{ marginBottom: '20px' }}>
              <div>
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Wedding Anniversary</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.wedding_anniversary || ''}
                  onChange={(e) => setFormData({ ...formData, wedding_anniversary: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Joined / Registered Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.joined_date || ''}
                  onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Baptism Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.baptism_date || ''}
                  onChange={(e) => setFormData({ ...formData, baptism_date: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Baptism Church Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.baptism_location || ''}
                  onChange={(e) => setFormData({ ...formData, baptism_location: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Confirmation Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.confirmation_date || ''}
                  onChange={(e) => setFormData({ ...formData, confirmation_date: e.target.value })}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '14px' }}>
              5. Address & Pastoral Notes
            </h4>
            <div className="form-grid" style={{ marginBottom: '10px' }}>
              <div className="form-group-full">
                <label className="form-label">Residential Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">State / Province</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Postal / ZIP Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.postal_code || ''}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
              <div className="form-group-full">
                <label className="form-label">Pastoral & Administrative Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
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
  );
};
