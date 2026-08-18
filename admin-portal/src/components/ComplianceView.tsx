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
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import { FCRALog, Form10BDExportReport, TaxReceipt, UKGiftAidClaimReport } from '../types';

export const ComplianceView: React.FC = () => {
  const { formatCurrency, isIndia, mode } = useLocalization();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-2xl backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Tax Compliance & Statutory Filing Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isIndia
              ? 'Income Tax Section 80G Receipts, Form 10BD electronic statement export, and FCRA Foreign Remittances.'
              : 'IRS 501(c)(3) contribution statements, UK HMRC Gift Aid 25% reclaim reports, and EU tax receipts.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="2025-2026">FY 2025 - 2026</option>
            <option value="2024-2025">FY 2024 - 2025</option>
          </select>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Generate Tax Receipt
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'receipts'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Tax Receipts ({receipts.length})
        </button>
        {isIndia && (
          <button
            onClick={() => setActiveTab('form10bd')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'form10bd'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Form 10BD Statement
          </button>
        )}
        <button
          onClick={() => setActiveTab('fcra')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'fcra'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="h-4 w-4" />
          FCRA Foreign Remittances ({fcraLogs.length})
        </button>
        {!isIndia && (
          <button
            onClick={() => setActiveTab('giftaid')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'giftaid'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="h-4 w-4" />
            UK Gift Aid 25% Claims
          </button>
        )}
      </div>

      {/* Tab 1: Tax Receipts Table */}
      {activeTab === 'receipts' && (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Issued Official Tax Receipts</h3>
            <span className="text-xs text-slate-500">Includes Section 80G, 501(c)(3) & Gift Aid declarations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="px-5 py-3.5">Receipt #</th>
                  <th className="px-5 py-3.5">Regime</th>
                  <th className="px-5 py-3.5">Donor Name</th>
                  <th className="px-5 py-3.5">PAN / Tax ID</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5 text-right">Tax Exempt Amount</th>
                  <th className="px-5 py-3.5 text-right">PDF Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {receipts.map((rcpt) => (
                  <tr key={rcpt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {rcpt.receipt_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {rcpt.tax_regime}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{rcpt.donor_name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {rcpt.donor_pan_or_tax_id || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{rcpt.issue_date}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(rcpt.eligible_tax_amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <a
                        href={api.getTaxReceiptPdfUrl(rcpt.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Receipt
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Form 10BD Electronic Return */}
      {activeTab === 'form10bd' && form10BD && (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Income Tax Form 10BD Statement of Donations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory annual filing under Section 80G(5)(viii) / Section 35(1A)(i) for FY {form10BD.financial_year}
              </p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
                <span className="text-slate-500 block">Total Records</span>
                <span className="text-lg font-mono text-indigo-600 font-bold">{form10BD.total_donations_count}</span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                <span className="text-slate-500 block">Aggregate Amount</span>
                <span className="text-lg font-mono text-emerald-600 font-bold">
                  {formatCurrency(form10BD.total_aggregate_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="px-4 py-3">Sl #</th>
                  <th className="px-4 py-3">Pre-Ack #</th>
                  <th className="px-4 py-3">ID Type</th>
                  <th className="px-4 py-3">Unique Donor ID (PAN)</th>
                  <th className="px-4 py-3">Donor Name</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {form10BD.records.map((rec) => (
                  <tr key={rec.sl_no}>
                    <td className="px-4 py-3 text-slate-500 text-xs">{rec.sl_no}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {rec.pre_acknowledgment_number}
                    </td>
                    <td className="px-4 py-3 text-xs">{rec.unique_donor_id_type}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {rec.unique_donor_id_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{rec.donor_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rec.mode_of_receipt}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
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
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Foreign Contribution Regulation Act (FCRA) Register
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Designated Foreign Remittance Account records and FIRC tracking for MHA Form FC-4 annual return.
              </p>
            </div>
            <button
              onClick={() => setShowFcraModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Log Foreign Inflow
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="px-4 py-3">Remittance Date</th>
                  <th className="px-4 py-3">Foreign Donor</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Foreign Currency</th>
                  <th className="px-4 py-3">Exchange Rate</th>
                  <th className="px-4 py-3 text-right">INR Realized</th>
                  <th className="px-4 py-3">FIRC Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fcraLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.remittance_date}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{log.donor_name}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{log.donor_country}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.foreign_currency} {log.foreign_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">₹{log.exchange_rate}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(log.inr_realized_amount)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      {log.firc_reference || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: UK Gift Aid */}
      {activeTab === 'giftaid' && giftAidReport && (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                HMRC UK Gift Aid 25% Tax Reclaim Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Tax Year: {giftAidReport.tax_year}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-right">
              <span className="text-slate-500 text-xs block font-semibold">Total 25% Reclaim Claimable</span>
              <span className="text-xl font-bold font-mono text-emerald-600">
                {formatCurrency(giftAidReport.total_tax_reclaim_amount)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3">Donor Name</th>
                  <th className="px-4 py-3">UK Tax ID</th>
                  <th className="px-4 py-3 text-right">Total Giving</th>
                  <th className="px-4 py-3 text-right">25% Gift Aid Reclaim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {giftAidReport.donors.map((d) => (
                  <tr key={d.member_id}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{d.donor_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.tax_id || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(d.donation_total)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Issue Official Tax Exemption Receipt</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateReceipt} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tax Regime *
                </label>
                <select
                  value={taxRegime}
                  onChange={(e) => setTaxRegime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="80G_INDIA">Section 80G (India Tax Exemption)</option>
                  <option value="US_501C3">US 501(c)(3) Church Contribution Receipt</option>
                  <option value="UK_GIFT_AID">UK Gift Aid 25% Declaration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contribution ID # *
                </label>
                <input
                  type="number"
                  required
                  value={contributionId}
                  onChange={(e) => setContributionId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Donor PAN / Tax ID (Mandatory for Form 10BD)
                </label>
                <input
                  type="text"
                  placeholder="e.g., AAAPS1234E"
                  value={donorPan}
                  onChange={(e) => setDonorPan(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Log FCRA Foreign Remittance</h3>
              <button
                onClick={() => setShowFcraModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogFcra} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Foreign Donor / Agency *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Global Mission Outreach Foundation"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={donorCountry}
                    onChange={(e) => setDonorCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                  <input
                    type="text"
                    required
                    value={foreignCurrency}
                    onChange={(e) => setForeignCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Foreign Amount
                  </label>
                  <input
                    type="number"
                    required
                    value={foreignAmount}
                    onChange={(e) => setForeignAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exchange Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Foreign Inward Remittance Certificate (FIRC) Ref
                </label>
                <input
                  type="text"
                  placeholder="FIRC-SBI-2026-..."
                  value={fircRef}
                  onChange={(e) => setFircRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFcraModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
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
