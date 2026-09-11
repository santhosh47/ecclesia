import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Edit2,
  Mail,
  MessageSquare,
  Monitor,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EvaluateTriggersResult, NotificationRule } from '../types';
import { isPushNotificationSupported, subscribeUserToPush } from '../utils/webPush';

export const AlertRulesSettingsView: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluateTriggersResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Device Push Notification State
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);


  // Edit / Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [form, setForm] = useState<{
    name: string;
    event_type: string;
    threshold_value: number;
    is_active: boolean;
    channels: {
      in_app: boolean;
      email: boolean;
      whatsapp: boolean;
    };
    target_roles: {
      pastor: boolean;
      admin: boolean;
      super_admin: boolean;
    };
    message_template: string;
  }>({
    name: '',
    event_type: 'member_absence',
    threshold_value: 3,
    is_active: true,
    channels: { in_app: true, email: true, whatsapp: true },
    target_roles: { pastor: true, admin: true, super_admin: true },
    message_template: 'Pastoral Notice: {{member_name}} has missed {{threshold_value}} consecutive services. Please reach out.',
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await api.getNotificationRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load notification rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    isPushNotificationSupported().then((sup) => {
      setPushSupported(sup);
      if (sup && 'Notification' in window) {
        setPushPermission(Notification.permission);
      }
    });
  }, []);

  const handleEnableDevicePush = async () => {
    try {
      setIsSubscribingPush(true);
      const { publicKey } = await api.getVapidPublicKey();
      const sub = await subscribeUserToPush(publicKey);
      if (sub) {
        await api.subscribeDevicePush(sub.toJSON());
        setPushPermission('granted');
        setStatusMessage('Device Push Notifications successfully enabled for your pastoral account!');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to enable device push notifications');
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      setIsSendingTestPush(true);
      const res = await api.sendTestPush();
      setStatusMessage(res.message);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to send test alert');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRule(null);
    setForm({
      name: '',
      event_type: 'urgent_pastoral_need',
      threshold_value: 1,
      is_active: true,
      channels: { in_app: true, email: true, whatsapp: true },
      target_roles: { pastor: true, admin: true, super_admin: true },
      message_template: 'Urgent Care Notice: {{member_name}} requires pastoral visitation (Phone: {{phone}}).',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rule: NotificationRule) => {
    setEditingRule(rule);
    const chList = rule.channels.split(',').map((c) => c.trim().toLowerCase());
    const roleList = rule.target_roles.split(',').map((r) => r.trim().toLowerCase());
    setForm({
      name: rule.name,
      event_type: rule.event_type,
      threshold_value: rule.threshold_value,
      is_active: rule.is_active,
      channels: {
        in_app: chList.includes('in_app'),
        email: chList.includes('email'),
        whatsapp: chList.includes('whatsapp'),
      },
      target_roles: {
        pastor: roleList.includes('pastor'),
        admin: roleList.includes('admin'),
        super_admin: roleList.includes('super_admin'),
      },
      message_template: rule.message_template,
    });
    setShowModal(true);
  };

  const handleToggleActive = async (rule: NotificationRule) => {
    try {
      const updated = await api.updateNotificationRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
      setStatusMessage(`Rule "${rule.name}" ${updated.is_active ? 'activated' : 'paused'}.`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update rule');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const channelsArray: string[] = [];
    if (form.channels.in_app) channelsArray.push('in_app');
    if (form.channels.email) channelsArray.push('email');
    if (form.channels.whatsapp) channelsArray.push('whatsapp');
    const channelsStr = channelsArray.join(',') || 'in_app';

    const rolesArray: string[] = [];
    if (form.target_roles.pastor) rolesArray.push('pastor');
    if (form.target_roles.admin) rolesArray.push('admin');
    if (form.target_roles.super_admin) rolesArray.push('super_admin');
    const targetRolesStr = rolesArray.join(',') || 'pastor,admin';

    try {
      if (editingRule) {
        const updated = await api.updateNotificationRule(editingRule.id, {
          name: form.name,
          threshold_value: form.threshold_value,
          is_active: form.is_active,
          channels: channelsStr,
          target_roles: targetRolesStr,
          message_template: form.message_template,
        });
        setRules((prev) => prev.map((r) => (r.id === editingRule.id ? updated : r)));
        setStatusMessage(`Updated rule "${updated.name}".`);
      } else {
        const created = await api.createNotificationRule({
          name: form.name,
          event_type: form.event_type,
          threshold_value: form.threshold_value,
          is_active: form.is_active,
          channels: channelsStr,
          target_roles: targetRolesStr,
          message_template: form.message_template,
        });
        setRules((prev) => [...prev, created]);
        setStatusMessage(`Created new alert rule "${created.name}".`);
      }
      setShowModal(false);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save notification rule');
    }
  };

  const handleEvaluateTriggers = async () => {
    try {
      setEvaluating(true);
      setEvalResult(null);
      const res = await api.evaluateNotificationTriggers();
      setEvalResult(res);
      setStatusMessage(
        `Evaluation complete: ${res.triggered_members_count} members flagged, ${res.in_app_notifications_created} in-app alerts generated.`
      );
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to evaluate notification triggers');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Actions */}
      <div
        className="card"
        style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Automated Alerts & Pastoral Notifications Engine
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
            Configure automated multi-channel notifications (Email, WhatsApp, and Web App Push) for member consecutive
            absences and pastoral emergencies. Strictly restricted to pastors, elders, and church administrators.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleEvaluateTriggers}
            disabled={evaluating}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={15} className={evaluating ? 'spin' : ''} />
            <span>{evaluating ? 'Evaluating Rules...' : 'Run Trigger Check'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Plus size={15} />
            <span>Create Alert Rule</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{statusMessage}</span>
        </div>
      )}

      {evalResult && (
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Bell size={16} color="#60a5fa" />
            <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
              Evaluation Report: {evalResult.rules_evaluated} Rules Checked
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <span>Triggered Members Flagged: <strong style={{ color: 'var(--text-primary)' }}>{evalResult.triggered_members_count}</strong></span>
            <span>Notifications Created: <strong style={{ color: 'var(--gold-400)' }}>{evalResult.in_app_notifications_created}</strong></span>
          </div>
          {evalResult.details.length > 0 && (
            <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              {evalResult.details.slice(0, 5).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Device Push Notifications (PWA / Browser) Banner Card */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-400)',
            }}
          >
            <Smartphone size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                Device & PWA Web Push Alerts
              </strong>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background:
                    pushPermission === 'granted'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(148, 163, 184, 0.15)',
                  color: pushPermission === 'granted' ? '#34d399' : 'var(--text-muted)',
                  border:
                    pushPermission === 'granted'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid var(--border-subtle)',
                }}
              >
                {pushPermission === 'granted' ? '● Connected' : '○ Not Subscribed'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Receive instantaneous lockscreen push alerts for urgent pastoral needs and absences even when Ecclesia is in the background.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {pushPermission === 'granted' ? (
            <button
              onClick={handleSendTestPush}
              disabled={isSendingTestPush}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
            >
              <Bell size={14} />
              <span>{isSendingTestPush ? 'Dispatching...' : 'Send Test Alert'}</span>
            </button>
          ) : (
            <button
              onClick={handleEnableDevicePush}
              disabled={isSubscribingPush || !pushSupported}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
            >
              <Smartphone size={14} />
              <span>{isSubscribingPush ? 'Enabling...' : 'Enable Device Push Alerts'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Rules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            Loading alert notification rules...
          </div>
        ) : rules.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No notification rules configured.
          </div>
        ) : (
          rules.map((rule) => {
            const channels = rule.channels.split(',').map((c) => c.trim().toLowerCase());
            const roles = rule.target_roles.split(',').map((r) => r.trim().toLowerCase());
            return (
              <div
                key={rule.id}
                className="card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: 'var(--bg-card)',
                  border: rule.is_active ? '1px solid var(--border-subtle)' : '1px dashed var(--border-subtle)',
                  opacity: rule.is_active ? 1 : 0.75,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: rule.is_active ? '#10b981' : '#94a3b8',
                        }}
                      />
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {rule.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleActive(rule)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      {rule.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gold-400)', marginBottom: '8px' }}>
                    <AlertTriangle size={13} />
                    <span>
                      Trigger Threshold: <strong>{rule.threshold_value} {rule.event_type === 'member_absence' ? 'consecutive missed services' : 'events'}</strong>
                    </span>
                  </div>

                  {/* Channel Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Channels:</span>
                    {channels.includes('in_app') && (
                      <span className="badge badge-blue" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Monitor size={11} />
                        Web App PWA
                      </span>
                    )}
                    {channels.includes('email') && (
                      <span className="badge badge-emerald" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={11} />
                        Email
                      </span>
                    )}
                    {channels.includes('whatsapp') && (
                      <span className="badge badge-amber" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={11} />
                        WhatsApp
                      </span>
                    )}
                  </div>

                  {/* Target Roles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recipients:</span>
                    {roles.map((r) => (
                      <span key={r} className="badge badge-neutral" style={{ fontSize: '10.5px', textTransform: 'capitalize' }}>
                        <Shield size={10} style={{ marginRight: '3px' }} />
                        {r.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  {/* Template Snippet */}
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'monospace',
                    }}
                  >
                    "{rule.message_template}"
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                  >
                    <Edit2 size={13} />
                    <span>Customize Rule</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Create Rule Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '580px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingRule ? 'Customize Notification Rule' : 'Create New Alert Rule'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="btn-icon"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Rule Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. 3-Week Member Absence Follow-Up"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Event Trigger Type</label>
                    <select
                      className="form-select"
                      value={form.event_type}
                      onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    >
                      <option value="member_absence">Member Absence (Consecutive)</option>
                      <option value="urgent_pastoral_need">Urgent Pastoral Need</option>
                      <option value="visitor_follow_up">Visitor Follow-Up Overdue</option>
                      <option value="pledge_milestone">Pledge Milestone</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Threshold (Services / Events)</label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      required
                      className="form-input"
                      value={form.threshold_value}
                      onChange={(e) => setForm({ ...form, threshold_value: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                {/* Dispatch Channels */}
                <div>
                  <label className="form-label" style={{ marginBottom: '8px' }}>
                    Dispatch Channels (Active Destinations)
                  </label>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={form.channels.in_app}
                        onChange={(e) =>
                          setForm({ ...form, channels: { ...form.channels, in_app: e.target.checked } })
                        }
                      />
                      <span>In-App Web Apps (PWA / Installed)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={form.channels.email}
                        onChange={(e) =>
                          setForm({ ...form, channels: { ...form.channels, email: e.target.checked } })
                        }
                      />
                      <span>Email Notifications</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={form.channels.whatsapp}
                        onChange={(e) =>
                          setForm({ ...form, channels: { ...form.channels, whatsapp: e.target.checked } })
                        }
                      />
                      <span>WhatsApp Direct Messages</span>
                    </label>
                  </div>
                </div>

                {/* Target Roles */}
                <div>
                  <label className="form-label" style={{ marginBottom: '8px' }}>
                    Target Recipient Roles (Strict Privacy)
                  </label>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={form.target_roles.pastor}
                        onChange={(e) =>
                          setForm({ ...form, target_roles: { ...form.target_roles, pastor: e.target.checked } })
                        }
                      />
                      <span>Pastors</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={form.target_roles.admin}
                        onChange={(e) =>
                          setForm({ ...form, target_roles: { ...form.target_roles, admin: e.target.checked } })
                        }
                      />
                      <span>Administrators</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={form.target_roles.super_admin}
                        onChange={(e) =>
                          setForm({ ...form, target_roles: { ...form.target_roles, super_admin: e.target.checked } })
                        }
                      />
                      <span>Super Admin</span>
                    </label>
                  </div>
                </div>

                {/* Message Template */}
                <div className="form-group">
                  <label className="form-label">Message Template</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    value={form.message_template}
                    onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                    placeholder="Use placeholders: {{member_name}}, {{threshold_value}}, {{phone}}"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Available tokens: <code>{'{{member_name}}'}</code>, <code>{'{{threshold_value}}'}</code>, <code>{'{{phone}}'}</code>
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <span>Enable this notification rule immediately</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} />
                  <span>{editingRule ? 'Save Rule Changes' : 'Create Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
