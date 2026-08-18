import React, { useState } from 'react';
import { X, Calendar, ClipboardCheck } from 'lucide-react';
import { Event } from '../../types';

interface CheckInModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<Event>) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: 'Sunday Morning Worship Service',
    event_type: 'Sunday Worship',
    starts_at: new Date().toISOString().slice(0, 16),
    location: 'Main Sanctuary',
    headcount_adults: 0,
    headcount_children: 0,
    headcount_online: 0,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.starts_at) return;
    onSubmit({
      ...formData,
      starts_at: new Date(formData.starts_at).toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardCheck size={20} color="var(--royal-blue)" />
            <h3 className="modal-title">Schedule / Log Church Service</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-grid">
              <div className="form-group-full">
                <label className="form-label">Event / Service Title *</label>
                <input
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Gathering Type</label>
                <select
                  className="form-select"
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                >
                  <option value="Sunday Worship">Sunday Morning Worship</option>
                  <option value="Midweek Service">Midweek Bible Study & Prayer</option>
                  <option value="Youth Service">Youth & Young Adults</option>
                  <option value="Prayer Meeting">Prayer Vigil</option>
                  <option value="Special Event">Special Conference / Summit</option>
                </select>
              </div>

              <div>
                <label className="form-label">Service Date & Time *</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Location / Hall</label>
                <input
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Adults Headcount</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={formData.headcount_adults}
                  onChange={(e) => setFormData({ ...formData, headcount_adults: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label">Children Headcount</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={formData.headcount_children}
                  onChange={(e) => setFormData({ ...formData, headcount_children: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label">Online Stream Viewers</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={formData.headcount_online}
                  onChange={(e) => setFormData({ ...formData, headcount_online: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
