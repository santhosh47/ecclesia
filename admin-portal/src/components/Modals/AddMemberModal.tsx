import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Home, Plus, CheckCircle2, Camera, Upload, Trash2 } from 'lucide-react';
import { Household, Member } from '../../types';
import { api } from '../../api/client';

interface AddMemberModalProps {
  households: Household[];
  onClose: () => void;
  onSubmit: (memberData: Partial<Member>) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ households, onClose, onSubmit }) => {
  const [localHouseholds, setLocalHouseholds] = useState<Household[]>(households);
  const [showNewHouseholdForm, setShowNewHouseholdForm] = useState(false);
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false);
  const [householdCreatedNotice, setHouseholdCreatedNotice] = useState<string | null>(null);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
    first_name: '',
    middle_name: '',
    last_name: '',
    title: '',
    avatar_url: '',
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
    household_role: 'Head',
    notes: '',
  });

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server immediately to get static URL
    setIsUploadingPhoto(true);
    try {
      const res = await api.uploadStandaloneAvatar(file);
      setFormData((prev) => ({ ...prev, avatar_url: res.avatar_url }));
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            {/* Profile Photo Uploader */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', padding: '14px', background: 'rgba(0, 0, 0, 0.15)', borderRadius: 'var(--radius-sm)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-hover)',
                  border: '2px dashed var(--border-subtle)',
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
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Camera size={24} color="var(--text-muted)" />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Profile Photo / Avatar
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
                    <span>{isUploadingPhoto ? 'Uploading...' : 'Choose Image'}</span>
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
                  Supports PNG, JPG, WebP, GIF (Max 5MB). Photo is saved automatically.
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

              {/* Household Assignment with Inline Creation Option */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Assign Household / Family
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
                    <span>{showNewHouseholdForm ? 'Close New' : '+ New Household'}</span>
                  </button>
                </div>

                <select
                  className="form-select"
                  value={formData.household_id || ''}
                  onChange={(e) => handleHouseholdDropdownChange(e.target.value)}
                >
                  <option value="">None / Independent</option>
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

              {/* Extended Household Roles */}
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
                  Supports multi-generational families (e.g. living-in parents / in-laws)
                </span>
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
                  placeholder="e.g. Lake, River, etc..."
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
