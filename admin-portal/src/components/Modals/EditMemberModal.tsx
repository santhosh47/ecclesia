import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Save, Home, Plus, CheckCircle2, Camera, Upload, Trash2 } from 'lucide-react';
import { Household, Member, MemberDetail } from '../../types';
import { api } from '../../api/client';

interface EditMemberModalProps {
  member: Member | MemberDetail;
  households: Household[];
  onClose: () => void;
  onSubmit: (memberData: Partial<Member>) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, households, onClose, onSubmit }) => {
  const [localHouseholds, setLocalHouseholds] = useState<Household[]>(households);
  const [showNewHouseholdForm, setShowNewHouseholdForm] = useState(false);
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false);
  const [householdCreatedNotice, setHouseholdCreatedNotice] = useState<string | null>(null);

  // Avatar upload / replace state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(member.avatar_url || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // New household inline form state
  const [newHousehold, setNewHousehold] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    home_phone: '',
  });

  useEffect(() => {
    setLocalHouseholds(households);
  }, [households]);

  const [formData, setFormData] = useState<Partial<Member>>({
    first_name: member.first_name || '',
    middle_name: member.middle_name || '',
    last_name: member.last_name || '',
    title: member.title || '',
    avatar_url: member.avatar_url || '',
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
    household_role: member.household_role || 'Head',
    notes: member.notes || '',
  });

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await api.uploadMemberAvatar(member.id, file);
      setAvatarPreview(res.avatar_url ?? null);
      setFormData((prev) => ({ ...prev, avatar_url: res.avatar_url || '' }));
    } catch (err: any) {
      alert(err.message || 'Failed to upload member avatar');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove this profile photo?')) return;
    try {
      await api.deleteMemberAvatar(member.id);
      setAvatarPreview(null);
      setFormData((prev) => ({ ...prev, avatar_url: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo');
    }
  };

  const handleHouseholdDropdownChange = (value: string) => {
    if (value === '__NEW_HOUSEHOLD__') {
      const suggestedName = formData.last_name ? `The ${formData.last_name} Family` : '';
      setNewHousehold((prev) => ({
        ...prev,
        name: prev.name || suggestedName,
        address: prev.address || formData.address || '',
        city: prev.city || formData.city || '',
        state: prev.state || formData.state || '',
        postal_code: prev.postal_code || formData.postal_code || '',
        home_phone: prev.home_phone || formData.phone || '',
      }));
      setShowNewHouseholdForm(true);
    } else {
      const hhId = value ? Number(value) : undefined;
      setFormData({ ...formData, household_id: hhId });
      setShowNewHouseholdForm(false);

      if (hhId) {
        const foundHh = localHouseholds.find((h) => h.id === hhId);
        if (foundHh && !formData.address && foundHh.address) {
          setFormData((prev) => ({
            ...prev,
            household_id: hhId,
            address: prev.address || foundHh.address,
            city: prev.city || foundHh.city,
            state: prev.state || foundHh.state,
            postal_code: prev.postal_code || foundHh.postal_code,
          }));
        }
      }
    }
  };

  const handleCreateQuickHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHousehold.name.trim()) return;

    setIsCreatingHousehold(true);
    try {
      const created = await api.createHousehold(newHousehold);
      setLocalHouseholds((prev) => [...prev, created]);
      setFormData((prev) => ({
        ...prev,
        household_id: created.id,
        address: prev.address || created.address || undefined,
        city: prev.city || created.city || undefined,
        state: prev.state || created.state || undefined,
        postal_code: prev.postal_code || created.postal_code || undefined,
      }));
      setShowNewHouseholdForm(false);
      setHouseholdCreatedNotice(`✨ Created & Assigned: ${created.name}`);
      setTimeout(() => setHouseholdCreatedNotice(null), 4000);
      setNewHousehold({ name: '', address: '', city: '', state: '', postal_code: '', home_phone: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to create new household');
    } finally {
      setIsCreatingHousehold(false);
    }
  };

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
            {/* Profile Photo Management */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', padding: '14px', background: 'rgba(0, 0, 0, 0.15)', borderRadius: 'var(--radius-sm)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-hover)',
                  border: '2px solid var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {avatarPreview || formData.avatar_url ? (
                  <img
                    src={avatarPreview || formData.avatar_url || undefined}
                    alt="Member Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--gold-400)' }}>
                    {`${(formData.first_name || '')[0] || 'M'}${(formData.last_name || '')[0] || ''}`}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Profile Photo
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handlePhotoSelect}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={13} />
                    <span>{isUploadingPhoto ? 'Uploading...' : avatarPreview ? 'Replace Photo' : 'Upload Photo'}</span>
                  </button>

                  {(avatarPreview || formData.avatar_url) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleRemovePhoto}
                      style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  PNG, JPG, WebP, GIF (Max 5MB). Changes save immediately.
                </span>
              </div>
            </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Household Unit
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const suggestedName = formData.last_name ? `The ${formData.last_name} Family` : '';
                      setNewHousehold((prev) => ({ ...prev, name: prev.name || suggestedName }));
                      setShowNewHouseholdForm((prev) => !prev);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-400)',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <Plus size={13} />
                    <span>{showNewHouseholdForm ? 'Close' : '+ New'}</span>
                  </button>
                </div>

                <select
                  className="form-select"
                  value={formData.household_id || ''}
                  onChange={(e) => handleHouseholdDropdownChange(e.target.value)}
                >
                  <option value="">Independent / None</option>
                  <option value="__NEW_HOUSEHOLD__">➕ + Add New Household...</option>
                  {localHouseholds.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.city ? `(${h.city})` : ''}
                    </option>
                  ))}
                </select>

                {householdCreatedNotice && (
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: '#34d399',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{householdCreatedNotice}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Household Role / Relationship</label>
                <select
                  className="form-select"
                  value={formData.household_role || 'Head'}
                  onChange={(e) => setFormData({ ...formData, household_role: e.target.value })}
                >
                  <option value="Head">Head of Household</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child (Son / Daughter)</option>
                  <option value="Parent">Parent (Father / Mother)</option>
                  <option value="Parent-in-Law">Parent-in-Law (Father/Mother-in-Law)</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="Sibling">Sibling (Brother / Sister)</option>
                  <option value="Extended Family">Extended Family / Relative</option>
                  <option value="Dependent">Dependent</option>
                  <option value="Member">Family Member</option>
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                  Multi-generational family roles (Parents/In-laws)
                </span>
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

            {/* Inline Quick Add Household Panel */}
            {showNewHouseholdForm && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  marginBottom: '20px',
                  animation: 'fadeIn 0.25s ease-out',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: 'var(--gold-400)' }}>
                    <Home size={16} />
                    <span>Quick Register New Household Unit</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => setShowNewHouseholdForm(false)}
                  >
                    Cancel
                  </button>
                </div>

                <div className="form-grid" style={{ gap: '10px' }}>
                  <div className="form-group-full">
                    <label className="form-label" style={{ fontSize: '11.5px' }}>
                      Household Family Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '7px 10px', fontSize: '13px' }}
                      placeholder="e.g. The Sterling Family"
                      value={newHousehold.name}
                      onChange={(e) => setNewHousehold({ ...newHousehold, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '7px 10px', fontSize: '13px' }}
                      placeholder="e.g. 14 2nd Cross, Koramangala"
                      value={newHousehold.address}
                      onChange={(e) => setNewHousehold({ ...newHousehold, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>
                      City / Area
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '7px 10px', fontSize: '13px' }}
                      placeholder="e.g. Bangalore"
                      value={newHousehold.city}
                      onChange={(e) => setNewHousehold({ ...newHousehold, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>
                      State / Region
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '7px 10px', fontSize: '13px' }}
                      placeholder="e.g. KA"
                      value={newHousehold.state}
                      onChange={(e) => setNewHousehold({ ...newHousehold, state: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>
                      Home Landline / Contact
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '7px 10px', fontSize: '13px' }}
                      placeholder="e.g. +91 80 2553 0101"
                      value={newHousehold.home_phone}
                      onChange={(e) => setNewHousehold({ ...newHousehold, home_phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group-full" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateQuickHousehold}
                      disabled={isCreatingHousehold || !newHousehold.name.trim()}
                      style={{ gap: '6px' }}
                    >
                      <Plus size={14} />
                      <span>{isCreatingHousehold ? 'Creating Household...' : 'Save & Assign to Member'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

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
