import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  DollarSign,
  Download,
  FileCheck,
  FileSpreadsheet,
  Globe,
  Plus,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import { FCRALog, Form10BDExportReport, TaxReceipt, UKGiftAidClaimReport } from '../types';

export const ComplianceView: React.FC = () => {
  const { formatCurrency, isIndia, mode, hasPermission } = useLocalization();
  const [activeTab, setActiveTab] = useState<'receipts' | 'form10bd' | 'fcra' | 'giftaid'>('receipts');
  const [receipts, setReceipts] = useState<TaxReceipt[]>([]);
  const [form10BD, setForm10BD] = useState<Form10BDExportReport | null>(null);
  const [fcraLogs, setFcraLogs] = useState<FCRALog[]>([]);
  const [giftAidReport, setGiftAidReport] = useState<UKGiftAidClaimReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [financialYear, setFinancialYear] = useState<string>('2025-2026');

  // Issue 80G / 501(c)(3) Receipt Modal
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [contributionId, setContributionId] = useState<number>(1);
  const [taxRegime, setTaxRegime] = useState<string>(isIndia ? '80G_INDIA' : 'US_501C3');
  const [donorPan, setDonorPan] = useState<string>('');

  // Log FCRA Modal
  const [showFcraModal, setShowFcraModal] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>('');
  const [donorCountry, setDonorCountry] = useState<string>('USA');
  const [foreignCurrency, setForeignCurrency] = useState<string>('USD');
  const [foreignAmount, setForeignAmount] = useState<number>(0);
  const [inrAmount, setInrAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(83.5);
  const [purposeCode, setPurposeCode] = useState<string>('Religious / Social Outreach');
  const [fircRef, setFircRef] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [rList, f10, fcra, ga] = await Promise.all([
        api.getTaxReceipts({ financial_year: financialYear }),
        isIndia ? api.getForm10BDReport(financialYear) : Promise.resolve(null),
        api.getFCRALogs(),
        !isIndia ? api.getGiftAidClaims(financialYear) : Promise.resolve(null),
      ]);
      setReceipts(rList);
      setForm10BD(f10);
      setFcraLogs(fcra);
      setGiftAidReport(ga);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [financialYear, isIndia]);

  const handleGenerateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.generateTaxReceipt({
        contribution_id: Number(contributionId),
        tax_regime: taxRegime,
        donor_pan_or_tax_id: donorPan || undefined,
        financial_year: financialYear,
      });
      setShowGenerateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate tax receipt');
    }
  };

  const handleLogFcra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.logFCRARemittance({
        donor_name: donorName,
        donor_country: donorCountry,
        foreign_currency: foreignCurrency,
        foreign_amount: Number(foreignAmount),
        inr_realized_amount: Number(inrAmount) || Number(foreignAmount) * Number(exchangeRate),
        exchange_rate: Number(exchangeRate),
        fcra_purpose_code: purposeCode,
        firc_reference: fircRef,
      });
      setShowFcraModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to log FCRA remittance');
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="var(--gold-400)" />
            <span>Tax Compliance & Statutory Filing Engine</span>
          </h1>
          <p className="view-subtitle">
            {isIndia
              ? 'Income Tax Section 80G Receipts, Form 10BD electronic statement export, and FCRA Foreign Remittances.'
              : 'IRS 501(c)(3) contribution statements, UK HMRC Gift Aid 25% reclaim reports, and EU tax receipts.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '8px 14px', fontSize: '13px' }}
          >
            <option value="2025-2026">FY 2025 - 2026</option>
            <option value="2024-2025">FY 2024 - 2025</option>
          </select>
          {hasPermission('manage_compliance') && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Generate Tax Receipt</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('receipts')}
          className="btn"
          style={{
            background: activeTab === 'receipts' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'receipts' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'receipts' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileCheck size={16} />
          <span>Tax Receipts ({receipts.length})</span>
        </button>
        {isIndia && (
          <button
            onClick={() => setActiveTab('form10bd')}
            className="btn"
            style={{
              background: activeTab === 'form10bd' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'form10bd' ? 'var(--gold-400)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'form10bd' ? '2px solid var(--gold-500)' : '2px solid transparent',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Form 10BD Statement</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('fcra')}
          className="btn"
          style={{
            background: activeTab === 'fcra' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'fcra' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'fcra' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Globe size={16} />
          <span>FCRA Foreign Remittances ({fcraLogs.length})</span>
        </button>
        {!isIndia && (
          <button
            onClick={() => setActiveTab('giftaid')}
            className="btn"
            style={{
              background: activeTab === 'giftaid' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'giftaid' ? 'var(--gold-400)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'giftaid' ? '2px solid var(--gold-500)' : '2px solid transparent',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Scale size={16} />
            <span>UK Gift Aid 25% Claims</span>
          </button>
        )}
      </div>

      {/* Tab 1: Tax Receipts Table */}
      {activeTab === 'receipts' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Issued Official Tax Exemption Receipts ({receipts.length})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Includes Section 80G, 501(c)(3) and Gift Aid declarations with downloadable PDF receipts.
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Regime</th>
                  <th>Donor Name</th>
                  <th>PAN / Tax ID</th>
                  <th>Issue Date</th>
                  <th style={{ textAlign: 'right' }}>Tax Exempt Amount</th>
                  <th style={{ textAlign: 'right' }}>PDF Download</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No tax receipts issued for this financial year.
                    </td>
                  </tr>
                ) : (
                  receipts.map((rcpt) => (
                    <tr key={rcpt.id}>
                      <td>
                        <span className="cell-mono" style={{ color: 'var(--gold-400)', fontWeight: 700 }}>
                          {rcpt.receipt_number}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill badge-indigo">
                          {rcpt.tax_regime}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rcpt.donor_name}</td>
                      <td>
                        <span className="cell-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {rcpt.donor_pan_or_tax_id || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{rcpt.issue_date}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(rcpt.eligible_tax_amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={api.getTaxReceiptPdfUrl(rcpt.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Download size={13} />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Form 10BD Electronic Return */}
      {activeTab === 'form10bd' && form10BD && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Income Tax Form 10BD Statement of Donations
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Statutory annual filing under Section 80G(5)(viii) / Section 35(1A)(i) for FY {form10BD.financial_year}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Total Records</span>
                <span style={{ fontSize: '18px', fontFamily: 'monospace', color: 'var(--gold-400)', fontWeight: 800 }}>{form10BD.total_donations_count}</span>
              </div>
              <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase', display: 'block' }}>Aggregate Amount</span>
                <span style={{ fontSize: '18px', fontFamily: 'monospace', color: '#34d399', fontWeight: 800 }}>
                  {formatCurrency(form10BD.total_aggregate_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sl #</th>
                  <th>Pre-Ack #</th>
                  <th>ID Type</th>
                  <th>Unique Donor ID (PAN)</th>
                  <th>Donor Name</th>
                  <th>Mode</th>
                  <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {form10BD.records.map((rec) => (
                  <tr key={rec.sl_no}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rec.sl_no}</td>
                    <td>
                      <span className="cell-mono" style={{ color: 'var(--gold-400)', fontWeight: 700 }}>
                        {rec.pre_acknowledgment_number}
                      </span>
                    </td>
                    <td><span style={{ fontSize: '12px' }}>{rec.unique_donor_id_type}</span></td>
                    <td>
                      <span className="cell-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rec.unique_donor_id_number}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.donor_name}</td>
                    <td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rec.mode_of_receipt}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      {formatCurrency(rec.amount_inr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: FCRA Register */}
      {activeTab === 'fcra' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Foreign Contribution Regulation Act (FCRA) Register
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Designated Foreign Remittance Account records and FIRC tracking for MHA Form FC-4 annual return.
              </p>
            </div>
            {hasPermission('manage_compliance') && (
              <button
                onClick={() => setShowFcraModal(true)}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>Log Foreign Inflow</span>
              </button>
            )}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Remittance Date</th>
                  <th>Foreign Donor</th>
                  <th>Country</th>
                  <th>Foreign Currency</th>
                  <th>Exchange Rate</th>
                  <th style={{ textAlign: 'right' }}>INR Realized</th>
                  <th>FIRC Ref</th>
                </tr>
              </thead>
              <tbody>
                {fcraLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No FCRA foreign remittances recorded.
                    </td>
                  </tr>
                ) : (
                  fcraLogs.map((log) => (
                    <tr key={log.id}>
                      <td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.remittance_date}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.donor_name}</td>
                      <td><span className="status-pill badge-neutral">{log.donor_country}</span></td>
                      <td>
                        <span className="cell-mono">
                          {log.foreign_currency} {log.foreign_amount.toLocaleString()}
                        </span>
                      </td>
                      <td><span className="cell-mono" style={{ color: 'var(--text-muted)' }}>₹{log.exchange_rate}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                        {formatCurrency(log.inr_realized_amount)}
                      </td>
                      <td>
                        <span className="cell-mono" style={{ color: '#60a5fa', fontWeight: 600 }}>
                          {log.firc_reference || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: UK Gift Aid */}
      {activeTab === 'giftaid' && giftAidReport && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                HMRC UK Gift Aid 25% Tax Reclaim Schedule
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Tax Year: {giftAidReport.tax_year}</p>
            </div>
            <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total 25% Reclaim</span>
              <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#34d399' }}>
                {formatCurrency(giftAidReport.total_tax_reclaim_amount)}
              </span>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>UK Tax ID</th>
                  <th style={{ textAlign: 'right' }}>Total Giving</th>
                  <th style={{ textAlign: 'right' }}>25% Gift Aid Reclaim</th>
                </tr>
              </thead>
              <tbody>
                {giftAidReport.donors.map((d) => (
                  <tr key={d.member_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.donor_name}</td>
                    <td><span className="cell-mono">{d.tax_id || '—'}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(d.donation_total)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#34d399' }}>
                      {formatCurrency(d.gift_aid_reclaim_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Generate Tax Receipt */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Issue Official Tax Exemption Receipt</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowGenerateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateReceipt}>
              <div className="modal-content">
                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Tax Regime *</label>
                    <select
                      value={taxRegime}
                      onChange={(e) => setTaxRegime(e.target.value)}
                      className="form-select"
                    >
                      <option value="80G_INDIA">Section 80G (India Tax Exemption)</option>
                      <option value="US_501C3">US 501(c)(3) Church Contribution Receipt</option>
                      <option value="UK_GIFT_AID">UK Gift Aid 25% Declaration</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Contribution ID # *</label>
                    <input
                      type="number"
                      required
                      value={contributionId}
                      onChange={(e) => setContributionId(Number(e.target.value))}
                      className="form-input"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Donor PAN / Tax ID (For Form 10BD)</label>
                    <input
                      type="text"
                      placeholder="e.g., AAAPS1234E"
                      value={donorPan}
                      onChange={(e) => setDonorPan(e.target.value)}
                      className="form-input"
                      style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log FCRA */}
      {showFcraModal && (
        <div className="modal-overlay" onClick={() => setShowFcraModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Log FCRA Foreign Remittance</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowFcraModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogFcra}>
              <div className="modal-content">
                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Foreign Donor / Agency *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Global Mission Outreach Foundation"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      required
                      value={donorCountry}
                      onChange={(e) => setDonorCountry(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Currency</label>
                    <input
                      type="text"
                      required
                      value={foreignCurrency}
                      onChange={(e) => setForeignCurrency(e.target.value)}
                      className="form-input"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Foreign Amount</label>
                    <input
                      type="number"
                      required
                      value={foreignAmount}
                      onChange={(e) => setForeignAmount(parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Exchange Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">FIRC Reference Number</label>
                    <input
                      type="text"
                      placeholder="FIRC-SBI-2026-..."
                      value={fircRef}
                      onChange={(e) => setFircRef(e.target.value)}
                      className="form-input"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowFcraModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save FCRA Inflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
