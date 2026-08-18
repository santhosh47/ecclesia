import React, { useState } from 'react';
import { X, TrendingDown } from 'lucide-react';
import { Expense } from '../../types';

interface RecordExpenseModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<Expense>) => void;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'Facilities & Utilities',
    title: '',
    amount: '' as any,
    payee: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    approved_by: 'Finance Committee',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || Number(formData.amount) <= 0) return;
    onSubmit({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingDown size={20} color="var(--rose)" />
            <h3 className="modal-title">Record Church Expense</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-grid">
              <div className="form-group-full">
                <label className="form-label">Expense Title / Item *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Sanctuary HVAC Maintenance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Facilities & Utilities">Facilities & Utilities</option>
                  <option value="Staff & Honorarium">Staff & Honorarium</option>
                  <option value="Worship & Tech">Worship & Tech AV</option>
                  <option value="Missions & Outreach">Missions & Outreach</option>
                  <option value="Hospitality & Fellowship">Hospitality & Fellowship</option>
                  <option value="Admin & Office">Admin & Office Supplies</option>
                  <option value="Charity & Benevolence">Charity & Benevolence</option>
                </select>
              </div>

              <div>
                <label className="form-label">Amount ($ USD) *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value as any })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Payee / Vendor *</label>
                <input
                  className="form-input"
                  placeholder="e.g. City Power Co."
                  value={formData.payee}
                  onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Approved By</label>
                <input
                  className="form-input"
                  value={formData.approved_by || ''}
                  onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="form-label">Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Description / Purpose</label>
                <textarea
                  className="form-textarea"
                  placeholder="Additional context or invoice memo..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
