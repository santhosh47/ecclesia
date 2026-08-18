import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  FileText,
  Trash2,
  PieChart,
  Target,
  Download,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { Contribution, Expense, FinanceSummary, Member, PledgeCampaign } from '../types';

interface FinancesViewProps {
  summary: FinanceSummary | null;
  contributions: Contribution[];
  expenses: Expense[];
  campaigns: PledgeCampaign[];
  members: Member[];
  isLoading: boolean;
  onOpenRecordGiving: () => void;
  onOpenRecordExpense: () => void;
  onOpenDonorStatement: (memberId: number) => void;
  onDeleteContribution: (id: number) => void;
  onDeleteExpense: (id: number) => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  summary,
  contributions,
  expenses,
  campaigns,
  members,
  isLoading,
  onOpenRecordGiving,
  onOpenRecordExpense,
  onOpenDonorStatement,
  onDeleteContribution,
  onDeleteExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'contributions' | 'expenses' | 'campaigns' | 'statements'>('contributions');
  const [fundFilter, setFundFilter] = useState('ALL');
  const [selectedStatementMember, setSelectedStatementMember] = useState<number | ''>('');

  const filteredContributions = contributions.filter(
    (c) => fundFilter === 'ALL' || c.fund === fundFilter
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Church Stewardship & Finances
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Tithes, general offerings, capital pledge campaigns, operational expenses, and tax statements
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={onOpenRecordGiving}>
            <Plus size={16} />
            <span>Record Giving</span>
          </button>
          <button className="btn btn-secondary" onClick={onOpenRecordExpense}>
            <Plus size={16} />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Banner */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--emerald)' } as any}>
          <div className="kpi-info">
            <h3>2026 YTD Income</h3>
            <div className="kpi-value" style={{ color: '#34d399' }}>
              ${summary?.total_income_ytd.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
            </div>
            <div className="kpi-subtext">Total tithes, offerings, & special gifts</div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: 'var(--emerald)' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--rose)' } as any}>
          <div className="kpi-info">
            <h3>2026 YTD Expenses</h3>
            <div className="kpi-value" style={{ color: '#fb7185' }}>
              ${summary?.total_expense_ytd.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
            </div>
            <div className="kpi-subtext">Operating, missions, utilities, & honorariums</div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: 'var(--rose)' }}>
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--royal-blue)' } as any}>
          <div className="kpi-info">
            <h3>Net Operating Cash</h3>
            <div className="kpi-value" style={{ color: (summary?.net_operating_balance ?? 0) >= 0 ? '#34d399' : '#fb7185' }}>
              ${summary?.net_operating_balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
            </div>
            <div className="kpi-subtext">Available stewardship balance</div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: 'var(--royal-blue)' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--gold-500)' } as any}>
          <div className="kpi-info">
            <h3>Active Pledges</h3>
            <div className="kpi-value">
              ${summary?.total_pledges_active.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
            </div>
            <div className="kpi-subtext">Committed towards capital campaigns</div>
          </div>
          <div className="kpi-icon-wrap">
            <Target size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'contributions' ? 'active' : ''}`} onClick={() => setActiveTab('contributions')}>
          Contributions Ledger ({contributions.length})
        </button>
        <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          Expenses Ledger ({expenses.length})
        </button>
        <button className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('campaigns')}>
          Pledge & Capital Campaigns ({campaigns.length})
        </button>
        <button className={`tab-btn ${activeTab === 'statements' ? 'active' : ''}`} onClick={() => setActiveTab('statements')}>
          Donor Tax Statements
        </button>
      </div>

      {/* TAB 1: CONTRIBUTIONS */}
      {activeTab === 'contributions' && (
        <div>
          <div className="filter-bar card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
            <div className="filter-group">
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Fund Category:</label>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
                value={fundFilter}
                onChange={(e) => setFundFilter(e.target.value)}
              >
                <option value="ALL">All Funds</option>
                <option value="Tithe">Tithe</option>
                <option value="General Offering">General Offering</option>
                <option value="Building Fund">Building Fund</option>
                <option value="Missions">Missions</option>
                <option value="Benevolence">Benevolence</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Donor</th>
                    <th>Fund</th>
                    <th>Method</th>
                    <th>Reference #</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContributions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No contributions match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredContributions.map((c) => (
                      <tr key={c.id}>
                        <td>{new Date(c.date).toLocaleDateString()}</td>
                        <td>
                          <strong>{c.member_name ?? 'Anonymous Giver'}</strong>
                        </td>
                        <td>
                          <span className="status-pill status-active">{c.fund}</span>
                        </td>
                        <td>{c.payment_method}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{c.reference_number || '—'}</td>
                        <td>
                          <strong style={{ color: '#34d399', fontSize: '14px' }}>
                            +${c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-icon btn-danger btn-sm"
                            onClick={() => {
                              if (confirm('Delete this contribution record?')) {
                                onDeleteContribution(c.id);
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title / Purpose</th>
                  <th>Category</th>
                  <th>Payee</th>
                  <th>Method</th>
                  <th>Approved By</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id}>
                      <td>{new Date(e.date).toLocaleDateString()}</td>
                      <td>
                        <strong>{e.title}</strong>
                        {e.description && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{e.description}</div>}
                      </td>
                      <td>
                        <span className="status-pill status-regular">{e.category}</span>
                      </td>
                      <td>{e.payee}</td>
                      <td>{e.payment_method}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{e.approved_by || '—'}</td>
                      <td>
                        <strong style={{ color: '#fb7185', fontSize: '14px' }}>
                          -${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-icon btn-danger btn-sm"
                          onClick={() => {
                            if (confirm('Delete this expense record?')) {
                              onDeleteExpense(e.id);
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="grid-equal-2">
          {campaigns.map((camp) => (
            <div key={camp.id} className="card card-hover" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="status-pill status-active">Active Campaign</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{camp.pledge_count} Pledges</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {camp.title}
              </h3>
              {camp.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{camp.description}</p>
              )}

              {/* Progress Meter */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>
                    Received: <strong style={{ color: '#34d399' }}>${camp.total_received.toLocaleString()}</strong>
                  </span>
                  <span>
                    Goal: <strong>${camp.target_amount.toLocaleString()}</strong>
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(camp.percent_completed, 100)}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  <span>{camp.percent_completed}% funded</span>
                  <span>Pledged: ${camp.total_pledged.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: DONOR STATEMENTS */}
      {activeTab === 'statements' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <FileText size={40} color="var(--gold-400)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Annual Contribution Statement Generator</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Generate official, printable tax-deductible contribution receipts for church members
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Select Church Member</label>
              <select
                className="form-select"
                value={selectedStatementMember}
                onChange={(e) => setSelectedStatementMember(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Select Member --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.email || 'No email'})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary"
              disabled={!selectedStatementMember}
              onClick={() => {
                if (selectedStatementMember) {
                  onOpenDonorStatement(Number(selectedStatementMember));
                }
              }}
            >
              <Download size={15} />
              <span>Generate & View Tax Statement</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
