import React, { useState } from 'react';
import { X, Home, Save } from 'lucide-react';
import { Household } from '../../types';

interface EditHouseholdModalProps {
  household: Household;
  onClose: () => void;
  onSubmit: (updatedData: Partial<Household>) => void;
}

export const EditHouseholdModal: React.FC<EditHouseholdModalProps> = ({ household, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: household.name || '',
    address: household.address || '',
    city: household.city || '',
    state: household.state || '',
    postal_code: household.postal_code || '',
    home_phone: household.home_phone || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Home size={20} color="var(--gold-400)" />
            <h3 className="modal-title">Edit Household: {household.name}</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-grid">
              <div className="form-group-full">
                <label className="form-label">Family / Household Unit Name *</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. The Sterling Family"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Residential Street Address</label>
                <input
                  className="form-input"
                  placeholder="e.g. 14 2nd Cross, Koramangala 4th Block"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">City</label>
                <input
                  className="form-input"
                  placeholder="e.g. Bangalore"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">State / Province</label>
                <input
                  className="form-input"
                  placeholder="e.g. KA"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Postal / ZIP Code</label>
                <input
                  className="form-input"
                  placeholder="e.g. 560034"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Landline / Family Phone</label>
                <input
                  className="form-input"
                  placeholder="e.g. +91 80 2553 0101"
                  value={formData.home_phone}
                  onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })}
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
              <span>Save Household</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
