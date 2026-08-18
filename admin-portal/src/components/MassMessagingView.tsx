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
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import { MessageBroadcast, MessageTemplate } from '../types';

export const MassMessagingView: React.FC = () => {
  const { isIndia } = useLocalization();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-2xl backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Smartphone className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Mass Messaging & WhatsApp Automation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isIndia
              ? 'TRAI DLT-compliant SMS templates, WhatsApp Business API broadcasts, and milestone greeting dispatches.'
              : 'Twilio 10DLC compliant SMS, WhatsApp integration, and GDPR-compliant church communication.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Send className="h-4 w-4" />
            Dispatch Broadcast
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'broadcasts'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Radio className="h-4 w-4" />
          Broadcast History ({broadcasts.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Registered Templates ({templates.length})
        </button>
      </div>

      {/* Tab 1: Broadcast History */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-4">
          {broadcasts.map((bc) => (
            <div
              key={bc.id}
              className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{bc.title}</h4>
                    <p className="text-xs text-slate-500">
                      Channel: <span className="font-semibold text-emerald-600">{bc.channel}</span> | Target:{' '}
                      <span className="font-semibold">{bc.target_group}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block">Sent At</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(bc.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold rounded-lg">
                    {bc.status}
                  </span>
                </div>
              </div>

              {/* Delivery Stats Bar */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[11px] text-slate-500 font-medium uppercase">Total Recipients</span>
                  <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {bc.total_recipients}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium uppercase">
                    Delivered
                  </span>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {bc.delivered_count}
                  </p>
                </div>
                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl">
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium uppercase">Failed</span>
                  <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                    {bc.failed_count}
                  </p>
                </div>
              </div>

              {/* Delivery Logs Preview */}
              {bc.logs && bc.logs.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Delivery Log Snippet
                  </span>
                  <div className="space-y-1.5">
                    {bc.logs.slice(0, 3).map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between items-center text-xs p-2 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {log.recipient_name} ({log.recipient_contact})
                        </span>
                        <span className="font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Registered Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{tmpl.name}</h4>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold rounded uppercase">
                    {tmpl.channel}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono">
                  {tmpl.body_text}
                </div>
              </div>

              {isIndia && tmpl.trai_dlt_template_id && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-0.5">
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>TRAI DLT Verified</span>
                  </div>
                  <p className="font-mono">DLT ID: {tmpl.trai_dlt_template_id}</p>
                  <p className="font-mono">Header: {tmpl.trai_sender_header || 'ECCLSA'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Dispatch Broadcast */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-600" />
                Dispatch Mass Broadcast
              </h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Broadcast Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Harvest Festival Reminder or Sunday Livestream Link"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Channel
                  </label>
                  <select
                    value={broadcastChannel}
                    onChange={(e) => setBroadcastChannel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="WhatsApp">WhatsApp API</option>
                    <option value="SMS">SMS Gateway (DLT Compliant)</option>
                    <option value="Email">Email Digest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience Group
                  </label>
                  <select
                    value={broadcastAudience}
                    onChange={(e) => setBroadcastAudience(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="All Active Members">All Active Members</option>
                    <option value="Ward 1 - Koramangala">Ward 1 - Koramangala</option>
                    <option value="Ward 2 - Indiranagar">Ward 2 - Indiranagar</option>
                    <option value="Youth Fellowship">Youth Fellowship</option>
                    <option value="Choir & Musicians">Choir & Worship Team</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Registered Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const tmplId = Number(e.target.value);
                    setSelectedTemplateId(tmplId);
                    const selected = templates.find((t) => t.id === tmplId);
                    if (selected) setCustomMessageText(selected.body_text);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={0}>-- Custom One-Off Message --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.channel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content (Tags: &#123;&#123;first_name&#125;&#125;, &#123;&#123;church_name&#125;&#125;)
                </label>
                <textarea
                  rows={4}
                  required
                  value={customMessageText}
                  onChange={(e) => setCustomMessageText(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending...' : 'Dispatch Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Template */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Message Template</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Weekly Tithe Acknowledgement"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Channel</label>
                  <select
                    value={templateChannel}
                    onChange={(e) => setTemplateChannel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="General">General</option>
                    <option value="Pastoral">Pastoral</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Liturgical">Liturgical</option>
                  </select>
                </div>
              </div>

              {isIndia && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      TRAI DLT Template ID
                    </label>
                    <input
                      type="text"
                      placeholder="14071612..."
                      value={traiDltId}
                      onChange={(e) => setTraiDltId(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Header / Sender
                    </label>
                    <input
                      type="text"
                      placeholder="ECCLSA"
                      value={traiHeader}
                      onChange={(e) => setTraiHeader(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Dear {{first_name}}, ..."
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
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
