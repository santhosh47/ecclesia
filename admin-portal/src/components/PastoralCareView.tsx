import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Sparkles,
  CheckCircle,
  Plus,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { api } from '../api/client';
import { Member, PastoralCareNote, PrayerRequest, VisitorFollowUp } from '../types';

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
  const [activeTab, setActiveTab] = useState<'prayers' | 'visitors' | 'notes'>('prayers');
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [visitors, setVisitors] = useState<VisitorFollowUp[]>([]);
  const [notes, setNotes] = useState<PastoralCareNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answeringPrayerId, setAnsweringPrayerId] = useState<number | null>(null);
  const [praiseReport, setPraiseReport] = useState('');

  const loadData = () => {
    setIsLoading(true);
    Promise.all([api.getPrayerRequests(), api.getVisitorFollowUps(), api.getPastoralNotes()])
      .then(([p, v, n]) => {
        setPrayers(p);
        setVisitors(v);
        setNotes(n);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAnswered = async (prayerId: number) => {
    try {
      await api.updatePrayerRequest(prayerId, {
        status: 'Answered',
        answer_notes: praiseReport || 'Praise God for His faithfulness!',
      });
      setAnsweringPrayerId(null);
      setPraiseReport('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update prayer request');
    }
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
          Prayer Requests & Praise Reports ({prayers.length})
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
