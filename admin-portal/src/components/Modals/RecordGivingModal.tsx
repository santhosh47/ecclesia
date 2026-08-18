import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Contribution, Member } from '../../types';

interface RecordGivingModalProps {
  members: Member[];
  onClose: () => void;
  onSubmit: (data: Partial<Contribution>) => void;
}

export const RecordGivingModal: React.FC<RecordGivingModalProps> = ({ members, onClose, onSubmit }) => {
  const [memberId, setMemberId] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [fund, setFund] = useState('Tithe');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    onSubmit({
      member_id: isAnonymous ? null : memberId ? Number(memberId) : null,
      donor_name: isAnonymous ? 'Anonymous Donor' : donorName || undefined,
      amount: Number(amount),
      fund,
      payment_method: paymentMethod,
      reference_number: referenceNumber || undefined,
      date,
      is_anonymous: isAnonymous,
      notes: notes || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={20} color="var(--emerald)" />
            <h3 className="modal-title">Record Tithe or Contribution</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-grid">
              <div className="form-group-full">
                <label className="form-label">Donor Member</label>
                <select
                  className="form-select"
                  disabled={isAnonymous}
                  value={memberId}
                  onChange={(e) => {
                    setMemberId(e.target.value);
                    if (e.target.value) setDonorName('');
                  }}
                >
                  <option value="">-- Non-Member / Cash Giver --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.email || 'No email'})
                    </option>
                  ))}
                </select>
              </div>

              {!memberId && !isAnonymous && (
                <div className="form-group-full">
                  <label className="form-label">Guest / Non-Member Giver Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Sunday Basket Cash / Visitor Name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Amount ($ USD) *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  required
                />
              </div>

              <div>
                <label className="form-label">Fund Designation</label>
                <select className="form-select" value={fund} onChange={(e) => setFund(e.target.value)}>
                  <option value="Tithe">Tithe</option>
                  <option value="General Offering">General Offering</option>
                  <option value="Building Fund">Building Fund</option>
                  <option value="Missions">Missions & Outreach</option>
                  <option value="Benevolence">Benevolence / Charity</option>
                  <option value="Youth Ministry">Youth Ministry</option>
                </select>
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit/Debit">Credit / Debit Card</option>
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online / App Giving</option>
                </select>
              </div>

              <div>
                <label className="form-label">Check / Reference #</label>
                <input
                  className="form-input"
                  placeholder="e.g. Check #1042"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Date of Contribution</label>
                <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>

              <div className="form-group-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                  <span>Mark as Anonymous Donor (exclude from personal directory reports)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Giving
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
