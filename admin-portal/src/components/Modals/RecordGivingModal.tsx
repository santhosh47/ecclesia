import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { Contribution, Member } from '../../types';

interface RecordGivingModalProps {
  members: Member[];
  onClose: () => void;
  onSubmit: (data: Partial<Contribution>) => void;
}

export const RecordGivingModal: React.FC<RecordGivingModalProps> = ({ members, onClose, onSubmit }) => {
  const { currencySymbol, isIndia } = useLocalization();
  const [memberId, setMemberId] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [fund, setFund] = useState('Weekly Offering');
  const [paymentMethod, setPaymentMethod] = useState(isIndia ? 'UPI / QR' : 'Bank Transfer');
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
            <h3 className="modal-title">Record Offering or Contribution</h3>
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
                  <option value="">-- Non-Member / Weekly Basket Cash --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.email || m.phone || 'Member'})
                    </option>
                  ))}
                </select>
              </div>

              {!memberId && !isAnonymous && (
                <div className="form-group-full">
                  <label className="form-label">Guest / Non-Member Giver Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Sunday Basket Offering / Visitor Name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Amount ({currencySymbol}) *</label>
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
                <label className="form-label">Contribution Category / Fund *</label>
                <select className="form-select" value={fund} onChange={(e) => setFund(e.target.value)}>
                  <option value="Weekly Offering">Weekly Offering</option>
                  <option value="General Offering">General Offering</option>
                  <option value="Special Contribution">Special Contribution</option>
                  <option value="Building Fund">Building Fund</option>
                  <option value="Missions">Missions & Outreach</option>
                  <option value="Benevolence">Benevolence / Charity</option>
                  <option value="Thanksgiving Offering">Thanksgiving Offering</option>
                  <option value="Youth Ministry">Youth Ministry</option>
                </select>
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {isIndia ? (
                    <>
                      <option value="UPI / QR">UPI / QR (GPay / PhonePe / Paytm)</option>
                      <option value="NEFT/RTGS/IMPS">NEFT / RTGS / Net Banking</option>
                      <option value="Cash">Cash (Sunday Basket)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Razorpay Online">Razorpay Gateway</option>
                    </>
                  ) : (
                    <>
                      <option value="Bank Transfer">Bank Transfer / ACH</option>
                      <option value="Credit/Debit">Credit / Debit Card</option>
                      <option value="Check">Check</option>
                      <option value="Cash">Cash Offering</option>
                      <option value="Online">Online / Stripe</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="form-group-full">
                <label className="form-label">Transaction Ref / Cheque No. / UPI UTR</label>
                <input
                  className="form-input"
                  placeholder="e.g. UPI UTR / Cheque #104829"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              <div className="form-group-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => {
                      setIsAnonymous(e.target.checked);
                      if (e.target.checked) setMemberId('');
                    }}
                  />
                  <span>Record as Anonymous Contribution</span>
                </label>
              </div>

              <div className="form-group-full">
                <label className="form-label">Pastoral / Financial Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Optional memo or designated project instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
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
