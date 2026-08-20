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
  Search,
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

  // Filters and search
  const [journalSearch, setJournalSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');

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
        lines: lines,
      });

      setNotification('Double-entry transaction posted successfully!');
      setTimeout(() => setNotification(null), 3500);
      setWizardForm({
        ...wizardForm,
        amount: '',
        payer_or_payee: '',
        reference: '',
        description: '',
      });
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAdvancedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedLines: { account_id: number; debit: number; credit: number; memo?: string }[] = [];

    for (const l of advLines) {
      if (!l.account_id) continue;
      const d = parseFloat(l.debit) || 0;
      const c = parseFloat(l.credit) || 0;
      if (d === 0 && c === 0) continue;
      formattedLines.push({
        account_id: parseInt(l.account_id),
        debit: d,
        credit: c,
        memo: l.memo || undefined,
      });
    }

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

  const filteredEntries = entries.filter((e) => {
    const q = journalSearch.toLowerCase();
    return (
      e.entry_number.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.reference && e.reference.toLowerCase().includes(q)) ||
      e.lines.some((l) => l.account_code?.toLowerCase().includes(q) || (l.memo && l.memo.toLowerCase().includes(q)))
    );
  });

  const filteredAccounts = accounts.filter((a) => {
    const q = accountSearch.toLowerCase();
    return (
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.sub_category && a.sub_category.toLowerCase().includes(q)) ||
      a.account_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={28} color="var(--gold-400)" />
            <span>Double-Entry Ledger & Financial Bookkeeping</span>
          </h1>
          <p className="view-subtitle">
            User-friendly double-entry accounting wizard, chart of accounts tree, real-time trial balance verification, and staff payroll.
          </p>
        </div>
      </div>

      {notification && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Financial Health Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Total Bank & Cash Assets</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(totalAssets)}</div>
          <div style={{ fontSize: '12px', color: '#60a5fa', marginTop: '4px', fontWeight: 600 }}>{assetAccounts.length} Active Bank/Cash Accounts</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>YTD Total Giving Revenue</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399' }}>{formatCurrency(totalRevenue)}</div>
          <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>Tithes, Offerings & Grants</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f43f5e', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>YTD Operating Expenses</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fb7185' }}>{formatCurrency(totalExpenses)}</div>
          <div style={{ fontSize: '12px', color: '#fb7185', marginTop: '4px', fontWeight: 600 }}>Salaries, Utilities, Missions</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8b5cf6', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Church Reserve Equity</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc' }}>{formatCurrency(totalEquity)}</div>
          <div style={{ fontSize: '12px', color: '#c084fc', marginTop: '4px', fontWeight: 600 }}>Building & General Reserves</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('wizard')}
          className="btn"
          style={{
            background: activeTab === 'wizard' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'wizard' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'wizard' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={16} />
          <span>Smart Transaction Wizard</span>
        </button>

        <button
          onClick={() => setActiveTab('entries')}
          className="btn"
          style={{
            background: activeTab === 'entries' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'entries' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'entries' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <BookOpen size={16} />
          <span>Journal Entries Log ({entries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className="btn"
          style={{
            background: activeTab === 'accounts' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'accounts' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'accounts' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Layers size={16} />
          <span>Chart of Accounts ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trial_balance')}
          className="btn"
          style={{
            background: activeTab === 'trial_balance' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'trial_balance' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'trial_balance' ? '2px solid var(--gold-500)' : '2px solid transparent',
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
          <span>Trial Balance Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className="btn"
          style={{
            background: activeTab === 'payroll' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'payroll' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'payroll' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} />
          <span>Staff Payroll Ledger</span>
        </button>
      </div>

      {/* Tab 1: Smart Transaction Wizard */}
      {activeTab === 'wizard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setWizardMode('income')}
                className="btn"
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: wizardMode === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: wizardMode === 'income' ? '#34d399' : 'var(--text-secondary)',
                  border: wizardMode === 'income' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ArrowDownLeft size={16} />
                <span>Record Income ("Money In")</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardMode('expense')}
                className="btn"
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: wizardMode === 'expense' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: wizardMode === 'expense' ? '#fb7185' : 'var(--text-secondary)',
                  border: wizardMode === 'expense' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ArrowUpRight size={16} />
                <span>Record Expense ("Money Out")</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardMode('transfer')}
                className="btn"
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: wizardMode === 'transfer' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: wizardMode === 'transfer' ? '#60a5fa' : 'var(--text-secondary)',
                  border: wizardMode === 'transfer' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ArrowRightLeft size={16} />
                <span>Account Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardMode('advanced')}
                className="btn"
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: wizardMode === 'advanced' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: wizardMode === 'advanced' ? '#c084fc' : 'var(--text-secondary)',
                  border: wizardMode === 'advanced' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Scale size={16} />
                <span>Advanced Multi-Leg Journal</span>
              </button>
            </div>

            {/* Smart Wizard Form */}
            {wizardMode !== 'advanced' ? (
              <form onSubmit={handleWizardSubmit}>
                <div className="form-grid" style={{ marginBottom: '20px' }}>
                  <div>
                    <label className="form-label">
                      Amount ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={wizardForm.amount}
                      onChange={(e) => setWizardForm({ ...wizardForm, amount: e.target.value })}
                      className="form-input"
                      style={{ fontSize: '16px', fontWeight: 700 }}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      {wizardMode === 'income' ? 'Deposit Into Bank / Cash Account *' : 'Pay From Bank / Cash Account *'}
                    </label>
                    <select
                      required
                      value={wizardForm.bank_account_id}
                      onChange={(e) => setWizardForm({ ...wizardForm, bank_account_id: e.target.value })}
                      className="form-select"
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
                      <label className="form-label">
                        {wizardMode === 'income' ? 'Income / Giving Category *' : 'Expense Category *'}
                      </label>
                      <select
                        required
                        value={wizardForm.category_account_id}
                        onChange={(e) => setWizardForm({ ...wizardForm, category_account_id: e.target.value })}
                        className="form-select"
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
                      <label className="form-label">
                        Transfer To Account *
                      </label>
                      <select
                        required
                        value={wizardForm.transfer_to_account_id}
                        onChange={(e) => setWizardForm({ ...wizardForm, transfer_to_account_id: e.target.value })}
                        className="form-select"
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
                    <label className="form-label">
                      {wizardMode === 'income' ? 'Received From (Donor / Member)' : 'Paid To (Vendor / Staff / Utility)'}
                    </label>
                    <input
                      type="text"
                      value={wizardForm.payer_or_payee}
                      onChange={(e) => setWizardForm({ ...wizardForm, payer_or_payee: e.target.value })}
                      className="form-input"
                      placeholder={wizardMode === 'income' ? 'e.g. Sunday Morning Collection' : 'e.g. Electricity Board / Audio Supplier'}
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Reference / Cheque / UPI / Voucher No.
                    </label>
                    <input
                      type="text"
                      value={wizardForm.reference}
                      onChange={(e) => setWizardForm({ ...wizardForm, reference: e.target.value })}
                      className="form-input"
                      placeholder="e.g. UPI-6288190 or CHQ-00124"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={wizardForm.entry_date}
                      onChange={(e) => setWizardForm({ ...wizardForm, entry_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: '1px solid var(--border-subtle)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--gold-400)', marginBottom: '4px' }}>Automatic Double-Entry Balancing Preview:</div>
                  {wizardMode === 'income' && <div>• Debit (+): Bank/Cash Asset Account | • Credit (+): Revenue Giving Account</div>}
                  {wizardMode === 'expense' && <div>• Debit (+): Expense Category Account | • Credit (-): Bank/Cash Asset Account</div>}
                  {wizardMode === 'transfer' && <div>• Debit (+): Destination Asset Account | • Credit (-): Source Asset Account</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} />
                    <span>Post Transaction to Ledger</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Advanced Mode */
              <form onSubmit={handleAdvancedSubmit}>
                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div className="form-group-full">
                    <label className="form-label">Description *</label>
                    <input
                      type="text"
                      required
                      value={advDescription}
                      onChange={(e) => setAdvDescription(e.target.value)}
                      className="form-input"
                      placeholder="e.g. Month-End Compound Adjustment Entry"
                    />
                  </div>
                  <div>
                    <label className="form-label">Reference No.</label>
                    <input
                      type="text"
                      value={advReference}
                      onChange={(e) => setAdvReference(e.target.value)}
                      className="form-input"
                      placeholder="e.g. ADJ-2026-08"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th style={{ width: '160px' }}>Debit ({currencySymbol})</th>
                          <th style={{ width: '160px' }}>Credit ({currencySymbol})</th>
                          <th>Memo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advLines.map((line, idx) => (
                          <tr key={idx}>
                            <td>
                              <select
                                value={line.account_id}
                                onChange={(e) => {
                                  const newLines = [...advLines];
                                  newLines[idx].account_id = e.target.value;
                                  setAdvLines(newLines);
                                }}
                                className="form-select"
                                style={{ padding: '6px 10px', fontSize: '12.5px' }}
                              >
                                <option value="">Select Account...</option>
                                {accounts.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.code} - {a.name} ({a.account_type})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
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
                                className="form-input"
                                style={{ padding: '6px 10px', fontSize: '12.5px' }}
                                placeholder="0.00"
                              />
                            </td>
                            <td>
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
                                className="form-input"
                                style={{ padding: '6px 10px', fontSize: '12.5px' }}
                                placeholder="0.00"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={line.memo}
                                onChange={(e) => {
                                  const newLines = [...advLines];
                                  newLines[idx].memo = e.target.value;
                                  setAdvLines(newLines);
                                }}
                                className="form-input"
                                style={{ padding: '6px 10px', fontSize: '12.5px' }}
                                placeholder="Optional line memo"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAdvLines([...advLines, { account_id: '', debit: '', credit: '', memo: '' }])}
                    className="btn btn-secondary"
                    style={{ marginTop: '12px', fontSize: '12px', padding: '6px 14px' }}
                  >
                    + Add Line Leg
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
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
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Posted General Journal Entries ({entries.length})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Complete immutable double-entry journal ledger entries with debit/credit breakdown.
              </p>
            </div>

            <div className="search-box" style={{ width: '260px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search entries or accounts..."
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entry #</th>
                  <th>Date</th>
                  <th style={{ minWidth: '280px' }}>Description & Legs</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>Total Debit</th>
                  <th style={{ textAlign: 'right' }}>Total Credit</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No journal entries found.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <span className="cell-mono" style={{ color: 'var(--gold-400)', fontWeight: 700 }}>
                          {entry.entry_number}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{entry.entry_date}</span>
                      </td>
                      <td style={{ maxWidth: '380px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', wordBreak: 'break-word' }}>
                          {entry.description}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                          {entry.lines.map((l) => (
                            <span
                              key={l.id}
                              className={`line-badge ${l.debit > 0 ? 'dr' : 'cr'}`}
                              title={l.memo || undefined}
                            >
                              {l.account_code} {l.debit > 0 ? `Dr ${formatCurrency(l.debit)}` : `Cr ${formatCurrency(l.credit)}`}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{entry.reference || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(entry.total_debit)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(entry.total_credit)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="status-pill badge-emerald">
                          {entry.status}
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

      {/* Tab 3: Chart of Accounts */}
      {activeTab === 'accounts' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Chart of Accounts Explorer ({accounts.length})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Standardized church chart of accounts covering Assets, Liabilities, Equity, Revenue, and Expenses.
              </p>
            </div>

            <div className="search-box" style={{ width: '260px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search account code or name..."
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account Name & Purpose</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Current Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No accounts matched your search.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id}>
                      <td>
                        <span className="cell-mono" style={{ fontWeight: 700, color: 'var(--gold-400)' }}>
                          {acc.code}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{acc.name}</div>
                        {acc.description && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{acc.description}</div>}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            acc.account_type === 'Asset'
                              ? 'badge-blue'
                              : acc.account_type === 'Revenue'
                              ? 'badge-emerald'
                              : acc.account_type === 'Expense'
                              ? 'badge-rose'
                              : acc.account_type === 'Liability'
                              ? 'badge-amber'
                              : 'badge-purple'
                          }`}
                        >
                          {acc.account_type}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{acc.sub_category || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatCurrency(acc.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Trial Balance Report */}
      {activeTab === 'trial_balance' && trialBalance && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Trial Balance Sheet</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>As of {trialBalance.as_of_date}</p>
            </div>
            {trialBalance.is_balanced ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '12.5px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                <CheckCircle2 size={16} />
                <span>DEBITS = CREDITS (STRICTLY BALANCED)</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#fb7185', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '12.5px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                <AlertCircle size={16} />
                <span>OUT OF BALANCE</span>
              </div>
            )}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account Description</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Debit ({currencySymbol})</th>
                  <th style={{ textAlign: 'right' }}>Credit ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.items.map((it) => (
                  <tr key={it.account_id}>
                    <td>
                      <span className="cell-mono" style={{ fontWeight: 700, color: 'var(--gold-400)' }}>
                        {it.code}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{it.name}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{it.account_type}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: it.debit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {it.debit > 0 ? formatCurrency(it.debit) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: it.credit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {it.credit > 0 ? formatCurrency(it.credit) : '—'}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245, 158, 11, 0.08)', fontWeight: 800, borderTop: '2px solid var(--border-subtle)' }}>
                  <td colSpan={3} style={{ textAlign: 'right', color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    TOTAL BALANCED SUMS:
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {formatCurrency(trialBalance.total_debits)}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {formatCurrency(trialBalance.total_credits)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Staff Payroll */}
      {activeTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Church Clergy & Staff Roster ({staffList.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {staffList.map((stf) => (
                <div key={stf.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{stf.first_name} {stf.last_name}</h4>
                    <div style={{ fontSize: '12px', color: 'var(--gold-400)', fontWeight: 600, marginBottom: '8px' }}>{stf.role_title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base Monthly: <strong>{formatCurrency(stf.base_salary_monthly)}</strong></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Allowances: <strong>{formatCurrency(stf.housing_allowance + stf.travel_allowance)}</strong></div>
                  </div>
                  {hasPermission('manage_ledger') && (
                    <button
                      onClick={() => handleDisbursePayroll(stf.id)}
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '14px', width: '100%' }}
                    >
                      Disburse Monthly Salary
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Disbursed Payroll History ({payrollRecords.length})
            </h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Pay Period</th>
                    <th>Disbursed Date</th>
                    <th style={{ textAlign: 'right' }}>Net Disbursed</th>
                    <th>Payslip Ref</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No payroll disbursements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payrollRecords.map((pr) => (
                      <tr key={pr.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pr.staff_name || `Staff #${pr.staff_id}`}</td>
                        <td><span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{pr.pay_period}</span></td>
                        <td><span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{pr.payment_date}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>{formatCurrency(pr.net_pay)}</td>
                        <td><span className="cell-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pr.payslip_reference || '—'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-pill badge-emerald">
                            {pr.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
