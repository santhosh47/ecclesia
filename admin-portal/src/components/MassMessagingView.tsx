import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import { MessageBroadcast, MessageTemplate } from '../types';

export const MassMessagingView: React.FC = () => {
  const { isIndia, hasPermission } = useLocalization();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [broadcasts, setBroadcasts] = useState<MessageBroadcast[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'templates'>('broadcasts');

  // Broadcast Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastChannel, setBroadcastChannel] = useState<string>('WhatsApp');
  const [broadcastAudience, setBroadcastAudience] = useState<string>('All Active Members');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(0);
  const [customMessageText, setCustomMessageText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  // Template Creation Modal
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateCategory, setTemplateCategory] = useState<string>('General');
  const [templateChannel, setTemplateChannel] = useState<string>('WhatsApp');
  const [templateBody, setTemplateBody] = useState<string>('');
  const [traiDltId, setTraiDltId] = useState<string>('');
  const [traiHeader, setTraiHeader] = useState<string>('ECCLSA');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tmpls, bcs] = await Promise.all([api.getMessageTemplates(), api.getMessageBroadcasts()]);
      setTemplates(tmpls);
      setBroadcasts(bcs);
    } catch (err) {
      console.error('Failed to load mass messaging data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      await api.sendBroadcast({
        title: broadcastTitle,
        channel: broadcastChannel,
        target_group: broadcastAudience,
        template_id: selectedTemplateId > 0 ? selectedTemplateId : undefined,
        custom_message: customMessageText || undefined,
      });
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setCustomMessageText('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMessageTemplate({
        name: templateName,
        category: templateCategory,
        channel: templateChannel,
        body_text: templateBody,
        trai_dlt_template_id: traiDltId || undefined,
        trai_sender_header: traiHeader || undefined,
      });
      setShowTemplateModal(false);
      setTemplateName('');
      setTemplateBody('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save template');
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={28} color="var(--gold-400)" />
            <span>Mass Messaging & WhatsApp Automation</span>
          </h1>
          <p className="view-subtitle">
            {isIndia
              ? 'TRAI DLT-compliant SMS templates, WhatsApp Business API broadcasts, and milestone greeting dispatches.'
              : 'Twilio 10DLC compliant SMS, WhatsApp integration, and GDPR-compliant church communication.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasPermission('manage_messaging') && (
            <>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} />
                <span>New Template</span>
              </button>
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={15} />
                <span>Dispatch Broadcast</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('broadcasts')}
          className="btn"
          style={{
            background: activeTab === 'broadcasts' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'broadcasts' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'broadcasts' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Radio size={16} />
          <span>Broadcast History ({broadcasts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className="btn"
          style={{
            background: activeTab === 'templates' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'templates' ? 'var(--gold-400)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'templates' ? '2px solid var(--gold-500)' : '2px solid transparent',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MessageSquare size={16} />
          <span>Registered Templates ({templates.length})</span>
        </button>
      </div>

      {/* Tab 1: Broadcast History */}
      {activeTab === 'broadcasts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {broadcasts.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No message broadcasts dispatched yet.
            </div>
          ) : (
            broadcasts.map((bc) => (
              <div key={bc.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{bc.title}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Channel: <strong style={{ color: '#34d399' }}>{bc.channel}</strong> • Target:{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>{bc.target_group}</strong>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Sent At</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {new Date(bc.sent_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="status-pill badge-emerald">
                      {bc.status}
                    </span>
                  </div>
                </div>

                {/* Delivery Stats Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Recipients</span>
                    <p style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {bc.total_recipients}
                    </p>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#34d399', fontWeight: 600 }}>Delivered</span>
                    <p style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#34d399', marginTop: '4px' }}>
                      {bc.delivered_count}
                    </p>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                    <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#fb7185', fontWeight: 600 }}>Failed</span>
                    <p style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#fb7185', marginTop: '4px' }}>
                      {bc.failed_count}
                    </p>
                  </div>
                </div>

                {/* Delivery Logs Preview */}
                {bc.logs && bc.logs.length > 0 && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                      Sample Delivery Receipts
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {bc.logs.slice(0, 3).map((log) => (
                        <div
                          key={log.id}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {log.recipient_name} ({log.recipient_contact})
                          </span>
                          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '11.5px' }}>
                            <CheckCircle2 size={13} /> {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Registered Templates */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="card"
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{tmpl.name}</h4>
                  <span className="status-pill badge-emerald" style={{ fontSize: '10px' }}>
                    {tmpl.channel}
                  </span>
                </div>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {tmpl.body_text}
                </div>
              </div>

              {isIndia && tmpl.trai_dlt_template_id && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: 600, marginBottom: '2px' }}>
                    <ShieldCheck size={14} />
                    <span>TRAI DLT Verified</span>
                  </div>
                  <p className="cell-mono" style={{ margin: '2px 0' }}>DLT ID: {tmpl.trai_dlt_template_id}</p>
                  <p className="cell-mono" style={{ margin: '2px 0' }}>Header: {tmpl.trai_sender_header || 'ECCLSA'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Dispatch Broadcast */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="#34d399" />
                <span>Dispatch Mass Broadcast</span>
              </h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowBroadcastModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast}>
              <div className="modal-content">
                <div className="form-grid" style={{ marginBottom: '14px' }}>
                  <div className="form-group-full">
                    <label className="form-label">Broadcast Campaign Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Sunday Livestream Link or Harvest Festival Reminder"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Delivery Channel</label>
                    <select
                      value={broadcastChannel}
                      onChange={(e) => setBroadcastChannel(e.target.value)}
                      className="form-select"
                    >
                      <option value="WhatsApp">WhatsApp API</option>
                      <option value="SMS">SMS Gateway (DLT Compliant)</option>
                      <option value="Email">Email Digest</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Target Audience Group</label>
                    <select
                      value={broadcastAudience}
                      onChange={(e) => setBroadcastAudience(e.target.value)}
                      className="form-select"
                    >
                      <option value="All Active Members">All Active Members</option>
                      <option value="Ward 1 - Koramangala">Ward 1 - Koramangala</option>
                      <option value="Ward 2 - Indiranagar">Ward 2 - Indiranagar</option>
                      <option value="Youth Fellowship">Youth Fellowship</option>
                      <option value="Choir & Musicians">Choir & Worship Team</option>
                    </select>
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Select Registered Template</label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => {
                        const tmplId = Number(e.target.value);
                        setSelectedTemplateId(tmplId);
                        const selected = templates.find((t) => t.id === tmplId);
                        if (selected) setCustomMessageText(selected.body_text);
                      }}
                      className="form-select"
                    >
                      <option value={0}>-- Custom One-Off Message --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.channel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Message Content (Tags: &#123;&#123;first_name&#125;&#125;, &#123;&#123;church_name&#125;&#125;)</label>
                    <textarea
                      rows={4}
                      required
                      value={customMessageText}
                      onChange={(e) => setCustomMessageText(e.target.value)}
                      className="form-input"
                      style={{ fontFamily: 'monospace', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  <span>{sending ? 'Sending...' : 'Dispatch Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Template */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Register Message Template</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowTemplateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate}>
              <div className="modal-content">
                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Template Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Weekly Tithe Acknowledgement"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Channel</label>
                    <select
                      value={templateChannel}
                      onChange={(e) => setTemplateChannel(e.target.value)}
                      className="form-select"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="SMS">SMS</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Category</label>
                    <select
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      className="form-select"
                    >
                      <option value="General">General</option>
                      <option value="Pastoral">Pastoral</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Liturgical">Liturgical</option>
                    </select>
                  </div>

                  {isIndia && (
                    <>
                      <div>
                        <label className="form-label">TRAI DLT Template ID</label>
                        <input
                          type="text"
                          placeholder="14071612..."
                          value={traiDltId}
                          onChange={(e) => setTraiDltId(e.target.value)}
                          className="form-input"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label className="form-label">Header / Sender</label>
                        <input
                          type="text"
                          placeholder="ECCLSA"
                          value={traiHeader}
                          onChange={(e) => setTraiHeader(e.target.value)}
                          className="form-input"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group-full">
                    <label className="form-label">Message Body</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Dear {{first_name}}, ..."
                      value={templateBody}
                      onChange={(e) => setTemplateBody(e.target.value)}
                      className="form-input"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
