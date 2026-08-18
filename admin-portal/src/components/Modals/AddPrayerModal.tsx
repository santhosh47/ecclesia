import React, { useState } from 'react';
import { X, HeartHandshake } from 'lucide-react';
import { Member, PrayerRequest } from '../../types';

interface AddPrayerModalProps {
  members: Member[];
  onClose: () => void;
  onSubmit: (data: Partial<PrayerRequest>) => void;
}

export const AddPrayerModal: React.FC<AddPrayerModalProps> = ({ members, onClose, onSubmit }) => {
  const [memberId, setMemberId] = useState<string>('');
  const [requesterName, setRequesterName] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('Healing');
  const [isConfidential, setIsConfidential] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !details) return;

    let finalName = requesterName;
    if (memberId) {
      const selected = members.find((m) => m.id === Number(memberId));
      if (selected) finalName = `${selected.first_name} ${selected.last_name}`;
    }

    if (!finalName) finalName = 'Anonymous Member';

    onSubmit({
      member_id: memberId ? Number(memberId) : null,
      requester_name: finalName,
      title,
      details,
      category,
      is_confidential: isConfidential,
      status: 'Active',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HeartHandshake size={20} color="var(--rose)" />
            <h3 className="modal-title">Submit Prayer Request</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-grid">
              <div className="form-group-full">
                <label className="form-label">Link to Member (Optional)</label>
                <select
                  className="form-select"
                  value={memberId}
                  onChange={(e) => {
                    setMemberId(e.target.value);
                    if (e.target.value) {
                      const m = members.find((x) => x.id === Number(e.target.value));
                      if (m) setRequesterName(`${m.first_name} ${m.last_name}`);
                    }
                  }}
                >
                  <option value="">-- Guest / Non-Member Request --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {!memberId && (
                <div className="form-group-full">
                  <label className="form-label">Requester Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. John Doe / Family"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="form-label">Prayer Focus / Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Healing">Healing & Health</option>
                  <option value="Family">Family & Marriage</option>
                  <option value="Guidance">Spiritual Guidance & Wisdom</option>
                  <option value="Provision">Financial & Job Provision</option>
                  <option value="Salvation">Salvation of Loved Ones</option>
                  <option value="Missions">Missions & Outreach</option>
                  <option value="Thanksgiving">Praise & Thanksgiving</option>
                </select>
              </div>

              <div>
                <label className="form-label">Title / Summary *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Recovery from surgery"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Prayer Request Details *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Please describe the prayer need for the pastoral team and intercessors..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isConfidential} onChange={(e) => setIsConfidential(e.target.checked)} />
                  <span>Confidential (Pastoral Staff Only)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Prayer Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
