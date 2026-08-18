import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Plus,
  Scale,
  Send,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import {
  Account,
  JournalEntry,
  PayrollRecord,
  Staff,
  TrialBalanceReport,
} from '../types';

export const LedgerView: React.FC = () => {
  const { formatCurrency, currencySymbol, hasPermission } = useLocalization();

  const [activeTab, setActiveTab] = useState<'wizard' | 'entries' | 'accounts' | 'trial_balance' | 'payroll'>('wizard');
  const [wizardMode, setWizardMode] = useState<'income' | 'expense' | 'transfer' | 'advanced'>('income');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceReport | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Smart Wizard Form State
  const [wizardForm, setWizardForm] = useState({
    amount: '',
    bank_account_id: '',
    category_account_id: '',
    transfer_to_account_id: '',
    payer_or_payee: '',
    reference: '',
    description: '',
    entry_date: new Date().toISOString().slice(0, 10),
  });

  // Advanced Journal Form State
  const [advLines, setAdvLines] = useState<{ account_id: string; debit: string; credit: string; memo: string }[]>([
    { account_id: '', debit: '', credit: '', memo: '' },
    { account_id: '', debit: '', credit: '', memo: '' },
  ]);
  const [advDescription, setAdvDescription] = useState('');
  const [advReference, setAdvReference] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accts, jrnls, tb, stf, pr] = await Promise.all([
        api.getAccounts(),
        api.getJournalEntries(),
        api.getTrialBalance(),
        api.getStaff(),
        api.getPayrollRecords(),
      ]);
      setAccounts(accts);
      setEntries(jrnls);
      setTrialBalance(tb);
      setStaffList(stf);
      setPayrollRecords(pr);

      // Preselect default bank and category accounts for wizard
      const defaultBank = accts.find((a) => a.code === '1010') || accts.find((a) => a.account_type === 'Asset');
      const defaultRevenue = accts.find((a) => a.code === '4010') || accts.find((a) => a.account_type === 'Revenue');
      if (defaultBank && !wizardForm.bank_account_id) {
        setWizardForm((prev) => ({
          ...prev,
          bank_account_id: defaultBank.id.toString(),
          category_account_id: defaultRevenue ? defaultRevenue.id.toString() : '',
        }));
      }
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assetAccounts = accounts.filter((a) => a.account_type === 'Asset');
  const revenueAccounts = accounts.filter((a) => a.account_type === 'Revenue');
  const expenseAccounts = accounts.filter((a) => a.account_type === 'Expense');
  const liabilityAccounts = accounts.filter((a) => a.account_type === 'Liability');
  const equityAccounts = accounts.filter((a) => a.account_type === 'Equity');

  // Total Summaries
  const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(wizardForm.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    try {
      let lines: { account_id: number; debit: number; credit: number; memo?: string }[] = [];
      let desc = wizardForm.description;

      if (wizardMode === 'income') {
        const bankId = parseInt(wizardForm.bank_account_id);
        const catId = parseInt(wizardForm.category_account_id);
        if (!bankId || !catId) return;

        desc = desc || `Income Collection: ${wizardForm.payer_or_payee || 'Congregation giving'}`;
        lines = [
          { account_id: bankId, debit: amt, credit: 0, memo: `Deposit into account` },
          { account_id: catId, debit: 0, credit: amt, memo: `Credit to revenue category` },
        ];
      } else if (wizardMode === 'expense') {
        const bankId = parseInt(wizardForm.bank_account_id);
        const catId = parseInt(wizardForm.category_account_id);
        if (!bankId || !catId) return;

        desc = desc || `Expense Payment: ${wizardForm.payer_or_payee || 'Vendor / Operations'}`;
        lines = [
          { account_id: catId, debit: amt, credit: 0, memo: `Debit expense category` },
          { account_id: bankId, debit: 0, credit: amt, memo: `Disbursed from bank/cash account` },
        ];
      } else if (wizardMode === 'transfer') {
        const fromId = parseInt(wizardForm.bank_account_id);
        const toId = parseInt(wizardForm.transfer_to_account_id);
        if (!fromId || !toId || fromId === toId) {
          alert('Please select two distinct accounts for transfer.');
          return;
        }

        desc = desc || `Internal Account Transfer`;
        lines = [
          { account_id: toId, debit: amt, credit: 0, memo: `Transfer In` },
          { account_id: fromId, debit: 0, credit: amt, memo: `Transfer Out` },
        ];
      }

      await api.createJournalEntry({
        description: desc,
        reference: wizardForm.reference,
        entry_date: wizardForm.entry_date,
        lines,
      });

      setNotification('Transaction recorded and posted to ledger successfully!');
      setTimeout(() => setNotification(null), 3500);
      setWizardForm({
        amount: '',
        bank_account_id: wizardForm.bank_account_id,
        category_account_id: wizardForm.category_account_id,
        transfer_to_account_id: '',
        payer_or_payee: '',
        reference: '',
        description: '',
        entry_date: new Date().toISOString().slice(0, 10),
      });
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAdvancedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedLines = advLines
      .filter((l) => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
      .map((l) => ({
        account_id: parseInt(l.account_id),
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        memo: l.memo || undefined,
      }));

    if (formattedLines.length < 2) {
      alert('A journal entry must contain at least 2 lines.');
      return;
    }

    const totalDebit = formattedLines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = formattedLines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`Entry out of balance! Total Debits (${totalDebit}) must equal Total Credits (${totalCredit}).`);
      return;
    }

    try {
      await api.createJournalEntry({
        description: advDescription || 'General Journal Entry',
        reference: advReference,
        lines: formattedLines,
      });
      setNotification('Advanced journal entry posted successfully!');
      setTimeout(() => setNotification(null), 3500);
      setAdvDescription('');
      setAdvReference('');
      setAdvLines([
        { account_id: '', debit: '', credit: '', memo: '' },
        { account_id: '', debit: '', credit: '', memo: '' },
      ]);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDisbursePayroll = async (staffId: number) => {
    const staff = staffList.find((s) => s.id === staffId);
    if (!staff) return;
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!window.confirm(`Disburse monthly salary for ${staff.first_name} ${staff.last_name} (${currentMonth})?`)) return;

    try {
      await api.disbursePayroll({
        staff_id: staff.id,
        pay_period: currentMonth,
        basic_salary: staff.base_salary_monthly,
        allowances: staff.housing_allowance + staff.travel_allowance,
        deductions: 0,
      });
      setNotification(`Payroll disbursed for ${staff.first_name} ${staff.last_name}!`);
      setTimeout(() => setNotification(null), 3500);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Double-Entry Ledger & Financial Bookkeeping</h1>
          <p className="view-subtitle">
            User-friendly double-entry accounting wizard, chart of accounts tree, real-time trial balance verification, and staff payroll.
          </p>
        </div>
      </div>

      {notification && (
        <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Financial Health Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Total Bank & Cash Assets</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(totalAssets)}</div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>{assetAccounts.length} Active Accounts</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>YTD Total Giving Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>{formatCurrency(totalRevenue)}</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>Tithes, Offerings & Grants</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f43f5e' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>YTD Operating Expenses</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e11d48' }}>{formatCurrency(totalExpenses)}</div>
          <div style={{ fontSize: '0.75rem', color: '#e11d48', marginTop: '0.25rem' }}>Salaries, Utilities, Missions</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Church Reserve Equity</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed' }}>{formatCurrency(totalEquity)}</div>
          <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '0.25rem' }}>Building & General Reserves</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('wizard')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'wizard' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'wizard' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={18} />
          <span>Smart Transaction Wizard</span>
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'entries' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'entries' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <BookOpen size={18} />
          <span>Journal Entries Log ({entries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'accounts' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'accounts' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Layers size={18} />
          <span>Chart of Accounts ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('trial_balance')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'trial_balance' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'trial_balance' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Scale size={18} />
          <span>Trial Balance Report</span>
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'payroll' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'payroll' ? '#6366f1' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Users size={18} />
          <span>Staff Payroll Ledger</span>
        </button>
      </div>

      {/* Tab 1: Smart Transaction Wizard */}
      {activeTab === 'wizard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setWizardMode('income')}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: wizardMode === 'income' ? '#ecfdf5' : '#f1f5f9',
                  color: wizardMode === 'income' ? '#047857' : '#475569',
                  borderBottom: wizardMode === 'income' ? '2px solid #059669' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ArrowDownLeft size={16} />
                <span>Record Income ("Money In")</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardMode('expense')}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: wizardMode === 'expense' ? '#fff1f2' : '#f1f5f9',
                  color: wizardMode === 'expense' ? '#be123c' : '#475569',
                  borderBottom: wizardMode === 'expense' ? '2px solid #e11d48' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ArrowUpRight size={16} />
                <span>Record Expense ("Money Out")</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardMode('transfer')}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: wizardMode === 'transfer' ? '#eff6ff' : '#f1f5f9',
                  color: wizardMode === 'transfer' ? '#1d4ed8' : '#475569',
                  borderBottom: wizardMode === 'transfer' ? '2px solid #2563eb' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ArrowRightLeft size={16} />
                <span>Account Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardMode('advanced')}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: wizardMode === 'advanced' ? '#f5f3ff' : '#f1f5f9',
                  color: wizardMode === 'advanced' ? '#6d28d9' : '#475569',
                  borderBottom: wizardMode === 'advanced' ? '2px solid #7c3aed' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Scale size={16} />
                <span>Advanced Journal Entry</span>
              </button>
            </div>

            {/* Smart Wizard Form */}
            {wizardMode !== 'advanced' ? (
              <form onSubmit={handleWizardSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Amount ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={wizardForm.amount}
                      onChange={(e) => setWizardForm({ ...wizardForm, amount: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 700 }}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      {wizardMode === 'income' ? 'Deposit Into Bank / Cash Account *' : 'Pay From Bank / Cash Account *'}
                    </label>
                    <select
                      required
                      value={wizardForm.bank_account_id}
                      onChange={(e) => setWizardForm({ ...wizardForm, bank_account_id: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Select Asset Account...</option>
                      {assetAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({formatCurrency(a.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {wizardMode !== 'transfer' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                        {wizardMode === 'income' ? 'Income / Giving Category *' : 'Expense Category *'}
                      </label>
                      <select
                        required
                        value={wizardForm.category_account_id}
                        onChange={(e) => setWizardForm({ ...wizardForm, category_account_id: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">Select Category...</option>
                        {(wizardMode === 'income' ? revenueAccounts : expenseAccounts).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                        Transfer To Account *
                      </label>
                      <select
                        required
                        value={wizardForm.transfer_to_account_id}
                        onChange={(e) => setWizardForm({ ...wizardForm, transfer_to_account_id: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">Select Destination Account...</option>
                        {assetAccounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      {wizardMode === 'income' ? 'Received From (Donor / Member)' : 'Paid To (Vendor / Staff / Utility)'}
                    </label>
                    <input
                      type="text"
                      value={wizardForm.payer_or_payee}
                      onChange={(e) => setWizardForm({ ...wizardForm, payer_or_payee: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder={wizardMode === 'income' ? 'e.g. Sunday Morning Collection' : 'e.g. Electricity Board / Audio Supplier'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Reference / Cheque / UPI No.
                    </label>
                    <input
                      type="text"
                      value={wizardForm.reference}
                      onChange={(e) => setWizardForm({ ...wizardForm, reference: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder="e.g. UPI-6288190 or CHQ-00124"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={wizardForm.entry_date}
                      onChange={(e) => setWizardForm({ ...wizardForm, entry_date: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#475569' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Double-Entry Auto-Balancing Preview:</div>
                  {wizardMode === 'income' && <div>• Debit (+): Bank/Cash Asset Account | • Credit (+): Revenue Giving Account</div>}
                  {wizardMode === 'expense' && <div>• Debit (+): Expense Category Account | • Credit (-): Bank/Cash Asset Account</div>}
                  {wizardMode === 'transfer' && <div>• Debit (+): Destination Asset Account | • Credit (-): Source Asset Account</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem' }}>
                    <Plus size={18} />
                    <span>Post Transaction to Ledger</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Advanced Mode */
              <form onSubmit={handleAdvancedSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>Description *</label>
                    <input
                      type="text"
                      required
                      value={advDescription}
                      onChange={(e) => setAdvDescription(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder="e.g. Month-End Compound Adjustment Entry"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>Reference No.</label>
                    <input
                      type="text"
                      value={advReference}
                      onChange={(e) => setAdvReference(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder="e.g. ADJ-2026-08"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>
                        <th style={{ padding: '0.5rem' }}>Account</th>
                        <th style={{ padding: '0.5rem', width: '140px' }}>Debit ({currencySymbol})</th>
                        <th style={{ padding: '0.5rem', width: '140px' }}>Credit ({currencySymbol})</th>
                        <th style={{ padding: '0.5rem' }}>Memo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advLines.map((line, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.4rem' }}>
                            <select
                              value={line.account_id}
                              onChange={(e) => {
                                const newLines = [...advLines];
                                newLines[idx].account_id = e.target.value;
                                setAdvLines(newLines);
                              }}
                              style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            >
                              <option value="">Select Account...</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} - {a.name} ({a.account_type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.4rem' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={line.debit}
                              onChange={(e) => {
                                const newLines = [...advLines];
                                newLines[idx].debit = e.target.value;
                                if (e.target.value) newLines[idx].credit = '';
                                setAdvLines(newLines);
                              }}
                              style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              placeholder="0.00"
                            />
                          </td>
                          <td style={{ padding: '0.4rem' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={line.credit}
                              onChange={(e) => {
                                const newLines = [...advLines];
                                newLines[idx].credit = e.target.value;
                                if (e.target.value) newLines[idx].debit = '';
                                setAdvLines(newLines);
                              }}
                              style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              placeholder="0.00"
                            />
                          </td>
                          <td style={{ padding: '0.4rem' }}>
                            <input
                              type="text"
                              value={line.memo}
                              onChange={(e) => {
                                const newLines = [...advLines];
                                newLines[idx].memo = e.target.value;
                                setAdvLines(newLines);
                              }}
                              style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              placeholder="Optional line memo"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    type="button"
                    onClick={() => setAdvLines([...advLines, { account_id: '', debit: '', credit: '', memo: '' }])}
                    className="btn btn-secondary"
                    style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    + Add Line Leg
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
                    Post Balanced Entry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Journal Entries Log */}
      {activeTab === 'entries' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
            Posted Journal Entries
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '0.6rem' }}>Entry #</th>
                  <th style={{ padding: '0.6rem' }}>Date</th>
                  <th style={{ padding: '0.6rem' }}>Description</th>
                  <th style={{ padding: '0.6rem' }}>Reference</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total Debit</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total Credit</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem', fontWeight: 600, color: '#6366f1' }}>{entry.entry_number}</td>
                    <td style={{ padding: '0.6rem' }}>{entry.entry_date}</td>
                    <td style={{ padding: '0.6rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{entry.description}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {entry.lines.map((l) => `${l.account_code} (${l.debit > 0 ? `Dr ${formatCurrency(l.debit)}` : `Cr ${formatCurrency(l.credit)}`})`).join(' | ')}
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem', color: '#64748b' }}>{entry.reference || '—'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(entry.total_debit)}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(entry.total_credit)}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Chart of Accounts */}
      {activeTab === 'accounts' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
            Chart of Accounts Explorer
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '0.6rem' }}>Code</th>
                  <th style={{ padding: '0.6rem' }}>Account Name</th>
                  <th style={{ padding: '0.6rem' }}>Type</th>
                  <th style={{ padding: '0.6rem' }}>Category</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Current Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem', fontWeight: 700, color: '#334155' }}>{acc.code}</td>
                    <td style={{ padding: '0.6rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{acc.name}</div>
                      {acc.description && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{acc.description}</div>}
                    </td>
                    <td style={{ padding: '0.6rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          background:
                            acc.account_type === 'Asset'
                              ? '#dbeafe'
                              : acc.account_type === 'Revenue'
                              ? '#dcfce7'
                              : acc.account_type === 'Expense'
                              ? '#ffe4e6'
                              : acc.account_type === 'Liability'
                              ? '#fef3c7'
                              : '#f3e8ff',
                          color:
                            acc.account_type === 'Asset'
                              ? '#1e40af'
                              : acc.account_type === 'Revenue'
                              ? '#15803d'
                              : acc.account_type === 'Expense'
                              ? '#be123c'
                              : acc.account_type === 'Liability'
                              ? '#b45309'
                              : '#7e22ce',
                        }}
                      >
                        {acc.account_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem', color: '#64748b' }}>{acc.sub_category || '—'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(acc.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Trial Balance Report */}
      {activeTab === 'trial_balance' && trialBalance && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Trial Balance Sheet</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>As of {trialBalance.as_of_date}</p>
            </div>
            {trialBalance.is_balanced ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#065f46', padding: '0.4rem 0.85rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} />
                <span>DEBITS = CREDITS (STRICTLY BALANCED)</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', color: '#991b1b', padding: '0.4rem 0.85rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>OUT OF BALANCE</span>
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '0.6rem' }}>Code</th>
                  <th style={{ padding: '0.6rem' }}>Account Description</th>
                  <th style={{ padding: '0.6rem' }}>Type</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Debit ({currencySymbol})</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Credit ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.items.map((it) => (
                  <tr key={it.account_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem', fontWeight: 600 }}>{it.code}</td>
                    <td style={{ padding: '0.6rem' }}>{it.name}</td>
                    <td style={{ padding: '0.6rem', color: '#64748b' }}>{it.account_type}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>{it.debit > 0 ? formatCurrency(it.debit) : '—'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>{it.credit > 0 ? formatCurrency(it.credit) : '—'}</td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right' }}>TOTALS:</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1e293b' }}>{formatCurrency(trialBalance.total_debits)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1e293b' }}>{formatCurrency(trialBalance.total_credits)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Staff Payroll */}
      {activeTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
              Church Clergy & Staff Roster
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {staffList.map((stf) => (
                <div key={stf.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#1e293b' }}>{stf.first_name} {stf.last_name}</h4>
                    <div style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600, marginBottom: '0.5rem' }}>{stf.role_title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Base Monthly: {formatCurrency(stf.base_salary_monthly)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Allowances: {formatCurrency(stf.housing_allowance + stf.travel_allowance)}</div>
                  </div>
                  {hasPermission('manage_ledger') && (
                    <button
                      onClick={() => handleDisbursePayroll(stf.id)}
                      className="btn btn-primary"
                      style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.4rem', width: '100%' }}
                    >
                      Disburse Monthly Salary
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
              Disbursed Payroll History
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '0.6rem' }}>Staff Name</th>
                    <th style={{ padding: '0.6rem' }}>Pay Period</th>
                    <th style={{ padding: '0.6rem' }}>Disbursed Date</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>Net Disbursed</th>
                    <th style={{ padding: '0.6rem' }}>Payslip Ref</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRecords.map((pr) => (
                    <tr key={pr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{pr.staff_name || `Staff #${pr.staff_id}`}</td>
                      <td style={{ padding: '0.6rem' }}>{pr.pay_period}</td>
                      <td style={{ padding: '0.6rem' }}>{pr.payment_date}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatCurrency(pr.net_pay)}</td>
                      <td style={{ padding: '0.6rem', color: '#64748b' }}>{pr.payslip_reference || '—'}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
                          {pr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
