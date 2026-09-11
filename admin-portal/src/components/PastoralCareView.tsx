import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  Plus,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Trash2,
  Award,
  Copy,
  Check,
  Filter,
  Search,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { api } from '../api/client';
import { AnsweredPrayerStats, Member, PastoralCareNote, PrayerRequest, VisitorFollowUp } from '../types';

interface PastoralCareViewProps {
  members: Member[];
  onOpenAddPrayer: () => void;
  onSelectMember: (memberId: number) => void;
}

export const PastoralCareView: React.FC<PastoralCareViewProps> = ({
  members,
  onOpenAddPrayer,
  onSelectMember,
}) => {
  const [activeTab, setActiveTab] = useState<'prayers' | 'answered' | 'visitors' | 'notes'>('prayers');
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [visitors, setVisitors] = useState<VisitorFollowUp[]>([]);
  const [notes, setNotes] = useState<PastoralCareNote[]>([]);
  const [prayerStats, setPrayerStats] = useState<AnsweredPrayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answeringPrayerId, setAnsweringPrayerId] = useState<number | null>(null);
  const [praiseReport, setPraiseReport] = useState('');
  const [answeredSearch, setAnsweredSearch] = useState('');
  const [answeredCategory, setAnsweredCategory] = useState('All');
  const [copiedPrayerId, setCopiedPrayerId] = useState<number | null>(null);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      api.getPrayerRequests(),
      api.getVisitorFollowUps(),
      api.getPastoralNotes(),
      api.getPrayerStats().catch(() => null),
    ])
      .then(([p, v, n, s]) => {
        setPrayers(p);
        setVisitors(v);
        setNotes(n);
        if (s) setPrayerStats(s);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAnswered = async (prayerId: number) => {
    try {
      await api.answerPrayerRequest(prayerId, {
        answer_notes: praiseReport || 'Praise God for His miraculous answer and faithfulness!',
        is_confidential: false,
      });
      setAnsweringPrayerId(null);
      setPraiseReport('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update prayer request');
    }
  };

  const handleCopyTestimony = (prayer: PrayerRequest) => {
    const text = `Praise Report - ${prayer.title}\nTestimony: "${prayer.answer_notes || prayer.details}"\nRequester: ${prayer.requester_name} • Date Answered: ${prayer.date_answered || 'Recently'}`;
    navigator.clipboard.writeText(text);
    setCopiedPrayerId(prayer.id);
    setTimeout(() => setCopiedPrayerId(null), 2500);
  };

  const handleUpdateVisitorStatus = async (visitorId: number, newStatus: string) => {
    try {
      await api.updateVisitorFollowUp(visitorId, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update visitor status');
    }
  };

  const activePrayers = prayers.filter((p) => p.status === 'Active');
  const answeredPrayers = prayers.filter((p) => p.status === 'Answered');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Pastoral Care & Prayer Ministry
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Intercessory prayer board, praise testimonies, visitor assimilation pipeline, and counseling logs
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenAddPrayer}>
          <Plus size={16} />
          <span>New Prayer Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'prayers' ? 'active' : ''}`} onClick={() => setActiveTab('prayers')}>
          <HeartHandshake size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Active Prayer Requests ({activePrayers.length})
        </button>
        <button className={`tab-btn ${activeTab === 'answered' ? 'active' : ''}`} onClick={() => setActiveTab('answered')}>
          <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', color: '#34d399' }} />
          Answered Prayers & Testimony Wall ({answeredPrayers.length})
        </button>
        <button className={`tab-btn ${activeTab === 'visitors' ? 'active' : ''}`} onClick={() => setActiveTab('visitors')}>
          <UserCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
          1st-Time Visitor Assimilation Pipeline ({visitors.length})
        </button>
        <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
          <MessageSquare size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Pastoral Visitation Logs ({notes.length})
        </button>
      </div>

      {/* TAB 1: PRAYER REQUESTS & PRAISE REPORTS */}
      {activeTab === 'prayers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Prayer Requests */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Active Intercessory Needs ({activePrayers.length})
              </h3>
            </div>

            <div className="grid-equal-2">
              {activePrayers.map((p) => (
                <div key={p.id} className="card card-hover" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{p.title}</h4>
                    <span className="status-pill status-clergy">{p.category}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                    {p.details}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Requested by <strong>{p.requester_name}</strong> • {new Date(p.date_requested || p.created_at || Date.now()).toLocaleDateString()}
                    </div>
                    <button
                      className="btn btn-emerald btn-sm"
                      onClick={() => setAnsweringPrayerId(p.id)}
                    >
                      <Sparkles size={13} />
                      <span>Mark Answered</span>
                    </button>
                  </div>

                  {/* Answering Modal / Box */}
                  {answeringPrayerId === p.id && (
                    <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <label className="form-label" style={{ color: '#34d399' }}>Praise Report / Answer Testimony:</label>
                      <textarea
                        className="form-textarea"
                        placeholder="How did God answer this prayer? (Share testimony)..."
                        value={praiseReport}
                        onChange={(e) => setPraiseReport(e.target.value)}
                        style={{ marginBottom: '8px', minHeight: '60px' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setAnsweringPrayerId(null)}>Cancel</button>
                        <button className="btn btn-emerald btn-sm" onClick={() => handleMarkAnswered(p.id)}>Save Testimony</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Answered Prayers & Praise Reports */}
          {answeredPrayers.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Sparkles size={18} color="#34d399" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#34d399' }}>
                  Answered Prayers & Praise Reports ({answeredPrayers.length})
                </h3>
              </div>

              <div className="grid-equal-2">
                {answeredPrayers.map((p) => (
                  <div key={p.id} className="card" style={{ padding: '20px', borderLeft: '4px solid var(--emerald)', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{p.title}</h4>
                      <span className="status-pill status-active">Answered</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{p.details}</p>
                    {p.answer_notes && (
                      <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', fontSize: '12.5px', color: '#34d399', fontStyle: 'italic', marginBottom: '8px' }}>
                        🎉 "{p.answer_notes}"
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Requested by {p.requester_name} • Answered {p.date_answered ? new Date(p.date_answered).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: ANSWERED PRAYERS & TESTIMONY WALL */}
      {activeTab === 'answered' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metrics Summary Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Answered Prayers
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                {prayerStats?.answered_count ?? answeredPrayers.length}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Breakthroughs & Testimonies
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--gold-400)' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Answer Rate
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gold-400)', marginTop: '4px' }}>
                {prayerStats?.answer_rate_percent ?? (prayers.length ? Math.round((answeredPrayers.length / prayers.length) * 100) : 0)}%
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Of resolved prayer requests
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #60a5fa' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Recorded Prayers
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>
                {prayerStats?.total_prayers ?? prayers.length}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Active intercessory archive
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #c084fc' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Average Breakthrough Time
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
                {prayerStats?.average_days_to_answer != null ? `${prayerStats.average_days_to_answer} days` : 'Prompt'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                From request to answered praise
              </div>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Category Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Filter size={13} color="var(--gold-400)" />
                <span>Category:</span>
              </div>
              {['All', 'Healing', 'Family', 'Guidance', 'Provision', 'Salvation', 'Thanksgiving'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAnsweredCategory(cat)}
                  className={answeredCategory === cat ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                  style={{ fontSize: '11.5px', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search praise testimonies..."
                value={answeredSearch}
                onChange={(e) => setAnsweredSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '12.5px', height: '34px' }}
              />
            </div>
          </div>

          {/* Answered Prayers & Testimony Wall Grid */}
          {(() => {
            const filtered = answeredPrayers.filter((p) => {
              const matchesCat = answeredCategory === 'All' || (p.category || '').toLowerCase() === answeredCategory.toLowerCase();
              const q = answeredSearch.toLowerCase();
              const matchesSearch =
                !q ||
                (p.title || '').toLowerCase().includes(q) ||
                (p.details || '').toLowerCase().includes(q) ||
                (p.answer_notes || '').toLowerCase().includes(q) ||
                (p.requester_name || '').toLowerCase().includes(q);
              return matchesCat && matchesSearch;
            });

            if (filtered.length === 0) {
              return (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Sparkles size={36} color="var(--gold-400)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    No Answered Prayers Found
                  </h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    {answeredSearch || answeredCategory !== 'All'
                      ? 'Try adjusting your search query or category filter.'
                      : 'When active prayer requests receive a praise report, they will appear on this wall of testimonies!'}
                  </p>
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {filtered.map((p) => {
                  const reqDate = p.date_requested ? new Date(p.date_requested) : null;
                  const ansDate = p.date_answered ? new Date(p.date_answered) : null;
                  const daysToAns =
                    reqDate && ansDate
                      ? Math.max(0, Math.round((ansDate.getTime() - reqDate.getTime()) / (1000 * 60 * 60 * 24)))
                      : null;

                  return (
                    <div
                      key={p.id}
                      className="card"
                      style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        borderTop: '3px solid #10b981',
                        background: 'rgba(16, 185, 129, 0.03)',
                      }}
                    >
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <span className="status-pill status-active" style={{ fontSize: '11px', marginRight: '6px' }}>
                              ✓ Answered
                            </span>
                            <span className="status-pill status-clergy" style={{ fontSize: '11px' }}>
                              {p.category}
                            </span>
                          </div>
                          {daysToAns !== null && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#34d399',
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: 700,
                              }}
                            >
                              Breakthrough in {daysToAns}d
                            </span>
                          )}
                        </div>

                        <h4
                          style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '6px',
                            lineHeight: 1.35,
                          }}
                        >
                          {p.title}
                        </h4>

                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.45 }}>
                          {p.details}
                        </p>

                        {/* Testimony Box */}
                        <div
                          style={{
                            padding: '12px 14px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Sparkles size={13} color="#34d399" />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                              Praise Report & Testimony
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', margin: 0, lineHeight: 1.45 }}>
                            "{p.answer_notes || 'Praise God for His miraculous grace and intervention!'}"
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '10px',
                          fontSize: '11.5px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <div>
                          Requested by <strong style={{ color: 'var(--text-primary)' }}>{p.requester_name}</strong> •{' '}
                          {ansDate ? ansDate.toLocaleDateString() : 'Answered'}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyTestimony(p)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}
                          title="Copy praise testimony to clipboard"
                        >
                          {copiedPrayerId === p.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                          <span>{copiedPrayerId === p.id ? 'Copied' : 'Share'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: VISITOR INTEGRATION PIPELINE */}
      {activeTab === 'visitors' && (
        <div className="grid-equal-2">
          {visitors.map((v) => (
            <div key={v.id} className="card card-hover" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{v.visitor_name}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Visited {new Date(v.visit_date || v.first_visit_date || Date.now()).toLocaleDateString()}
                  </div>
                </div>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
                  value={v.status}
                  onChange={(e) => handleUpdateVisitorStatus(v.id, e.target.value)}
                >
                  <option value="New Visitor">New Visitor</option>
                  <option value="Welcome Call Made">Welcome Call Made</option>
                  <option value="Home/Coffee Visit">Home/Coffee Visit</option>
                  <option value="Next Steps Class">Next Steps Class</option>
                  <option value="Integrated">Integrated Member</option>
                </select>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                {(v.phone || v.visitor_phone) && <div>📞 {v.phone || v.visitor_phone}</div>}
                {(v.email || v.visitor_email) && <div>✉️ {v.email || v.visitor_email}</div>}
                {v.assigned_to && (
                  <div style={{ color: 'var(--gold-400)', fontSize: '12px' }}>
                    Assigned follow-up: <strong>{v.assigned_to}</strong>
                  </div>
                )}
                {v.notes && <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>"{v.notes}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PASTORAL VISITATION LOGS */}
      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {notes.map((n) => (
            <div key={n.id} className="card" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span className="status-pill status-clergy" style={{ marginRight: '8px' }}>{n.category}</span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {n.member_name ? `Member: ${n.member_name}` : 'General Ministry Log'}
                  </strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {n.author_name} • {new Date(n.created_at || n.date || Date.now()).toLocaleDateString()}
                </div>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
