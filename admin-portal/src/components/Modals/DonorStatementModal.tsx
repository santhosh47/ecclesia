import React, { useEffect, useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Contribution, DonorStatement } from '../../types';

interface DonorStatementModalProps {
  memberId: number | null;
  onClose: () => void;
}

export const DonorStatementModal: React.FC<DonorStatementModalProps> = ({ memberId, onClose }) => {
  const [statement, setStatement] = useState<DonorStatement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    setIsLoading(true);
    api
      .getDonorStatement(memberId)
      .then(setStatement)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [memberId]);

  if (!memberId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-dialog-large printable-statement" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--gold-400)" />
            <h3 className="modal-title">Annual Donor Contribution Statement</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-content" style={{ padding: '32px' }}>
          {isLoading || !statement ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Generating statement...</div>
          ) : (
            <div>
              {/* Church Formal Statement Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gold-400)' }}>ECCLESIA</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Grace Community Church</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>742 Evergreen Terrace, Springfield, IL 62704</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>EIN: 36-1234567 • (217) 555-0100</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Tax Giving Statement
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Period: {new Date(statement.start_date).toLocaleDateString()} – {new Date(statement.end_date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Generated on {new Date(statement.generated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Donor Profile Box */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Donor Record
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{statement.donor_name}</div>
                {statement.address && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{statement.address}</div>}
                {statement.email && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{statement.email}</div>}
              </div>

              {/* Itemized Contributions Table */}
              <div style={{ marginBottom: '24px' }}>
                <table className="data-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Fund Designation</th>
                      <th>Method</th>
                      <th>Reference #</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.contributions.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No contributions recorded for this period.
                        </td>
                      </tr>
                    ) : (
                      statement.contributions.map((c: Contribution) => (
                        <tr key={c.id}>
                          <td>{new Date(c.date).toLocaleDateString()}</td>
                          <td>{c.fund}</td>
                          <td>{c.payment_method}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{c.reference_number || '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>
                            ${c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(245, 158, 11, 0.08)', fontWeight: '700' }}>
                      <td colSpan={4} style={{ padding: '14px 18px', fontSize: '14px' }}>Total Tax-Deductible Contributions</td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '16px', color: '#34d399' }}>
                        ${statement.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tax Exemption Note */}
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.5', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <p>
                  Thank you for your generous and faithful financial support of the ministries and missions of Grace Ecclesia Community Church.
                  In accordance with IRS regulations, no goods or services were provided in exchange for this contribution other than intangible religious benefits.
                  Please retain this document for your personal tax filing.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print Official Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
