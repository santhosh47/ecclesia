import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Filter,
  MapPin,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import { ChurchActivity } from '../types';

export const ChurchCalendarView: React.FC = () => {
  const { hasPermission } = useLocalization();
  const [activities, setActivities] = useState<ChurchActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState<{
    title: string;
    category: string;
    activity_type: string;
    starts_at: string;
    ends_at: string;
    location: string;
    organizer_name: string;
    target_group: string;
    description: string;
    is_recurring: boolean;
    recurrence_pattern: string;
    contact_phone: string;
  }>({
    title: '',
    category: 'Worship Service',
    activity_type: 'Regular Weekly',
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: '',
    location: 'Main Sanctuary',
    organizer_name: '',
    target_group: 'All Congregation',
    description: '',
    is_recurring: true,
    recurrence_pattern: 'Weekly on Sundays at 9:00 AM',
    contact_phone: '',
  });

  const categories = [
    'All',
    'Worship Service',
    'Prayer Meeting',
    'Bible Study',
    'Choir Practice',
    'Committee Meeting',
    'Youth Fellowship',
    'Community Outreach',
    'Special Conference',
    'Fellowship Gathering',
  ];

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await api.getChurchActivities({
        category: filterCategory !== 'All' ? filterCategory : undefined,
        activity_type: filterType !== 'All' ? filterType : undefined,
      });
      setActivities(data);
    } catch (err) {
      console.error('Failed to load church activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [filterCategory, filterType]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    try {
      await api.createChurchActivity({
        title: form.title,
        category: form.category,
        activity_type: form.activity_type,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
        location: form.location,
        organizer_name: form.organizer_name,
        target_group: form.target_group,
        description: form.description,
        is_recurring: form.is_recurring,
        recurrence_pattern: form.recurrence_pattern,
        contact_phone: form.contact_phone,
      });
      setShowAddModal(false);
      fetchActivities();
    } catch (err) {
      console.error('Failed to create church activity:', err);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this church activity?')) return;
    try {
      await api.deleteChurchActivity(id);
      fetchActivities();
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'Worship Service':
        return { badgeClass: 'badge-amber', accent: 'var(--gold-400)' };
      case 'Prayer Meeting':
        return { badgeClass: 'badge-purple', accent: '#a78bfa' };
      case 'Bible Study':
        return { badgeClass: 'badge-emerald', accent: '#34d399' };
      case 'Choir Practice':
        return { badgeClass: 'badge-blue', accent: '#60a5fa' };
      case 'Committee Meeting':
        return { badgeClass: 'badge-neutral', accent: '#94a3b8' };
      case 'Youth Fellowship':
        return { badgeClass: 'badge-preacher', accent: '#fdba74' };
      case 'Community Outreach':
        return { badgeClass: 'badge-minister', accent: '#6ee7b7' };
      case 'Special Conference':
        return { badgeClass: 'badge-elder', accent: '#c4b5fd' };
      default:
        return { badgeClass: 'badge-neutral', accent: 'var(--gold-400)' };
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Church Activities & Events Calendar</h1>
          <p className="view-subtitle">
            Schedule and coordinate regular weekly services, prayer meetings, choir rehearsals, committee boards, and special church gatherings.
          </p>
        </div>
        {hasPermission('manage_calendar') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            <span>Schedule Activity</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
            <Filter size={15} color="var(--gold-400)" />
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>Category:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={filterCategory === cat ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              style={{
                fontSize: '11.5px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Frequency:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
          >
            <option value="All">All Frequencies</option>
            <option value="Regular Weekly">Regular Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Special Event">Special Event</option>
          </select>
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading church calendar...</div>
      ) : activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <CalendarIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>No Church Activities Scheduled</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            Click "Schedule Activity" above to schedule worship services, rehearsals, or special church gatherings.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {activities.map((act) => {
            const theme = getCategoryTheme(act.category);
            const dateObj = new Date(act.starts_at);
            return (
              <div
                key={act.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${theme.accent}`,
                  padding: '20px',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className={`status-pill ${theme.badgeClass}`}>
                      {act.category}
                    </span>
                    {act.is_recurring ? (
                      <span className="status-pill badge-neutral" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Repeat size={11} color="var(--gold-400)" />
                        <span>Recurring</span>
                      </span>
                    ) : (
                      <span className="status-pill status-visitor" style={{ fontSize: '11px' }}>
                        {act.activity_type}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.35 }}>
                    {act.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarIcon size={14} color="var(--gold-400)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="var(--gold-400)" />
                      <span>
                        {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {act.ends_at && ` - ${new Date(act.ends_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      </span>
                    </div>
                    {act.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color="var(--gold-400)" />
                        <span>{act.location}</span>
                      </div>
                    )}
                    {act.organizer_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} color="var(--gold-400)" />
                        <span>Leader: <strong style={{ color: 'var(--text-primary)' }}>{act.organizer_name}</strong></span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={14} color="var(--gold-400)" />
                      <span>Target: {act.target_group}</span>
                    </div>
                  </div>

                  {act.recurrence_pattern && (
                    <div style={{ marginTop: '12px', fontSize: '11.5px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--gold-400)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Repeat size={12} />
                      <span>{act.recurrence_pattern}</span>
                    </div>
                  )}

                  {act.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, marginTop: '10px' }}>
                      {act.description}
                    </p>
                  )}
                </div>

                {hasPermission('manage_calendar') && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="btn btn-icon btn-danger btn-sm"
                      title="Delete Activity"
                    >
                      <Trash2 size={14} />
                      <span style={{ fontSize: '11.5px', marginLeft: '4px' }}>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Church Activity Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Schedule Church Activity or Service</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Add a regular weekly service, rehearsal, committee meeting, or special conference to the parish calendar.
                </p>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateActivity}>
              <div className="modal-content">
                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div className="form-group-full">
                    <label className="form-label">Activity / Service Title *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Sunday Morning Holy Communion Service"
                    />
                  </div>

                  <div>
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Frequency</label>
                    <select
                      className="form-select"
                      value={form.activity_type}
                      onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
                    >
                      <option value="Regular Weekly">Regular Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Special Event">Special Event</option>
                      <option value="Annual">Annual Gathering</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Starts At *</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-input"
                      value={form.starts_at}
                      onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Ends At</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={form.ends_at}
                      onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Location / Sanctuary / Room</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Main Sanctuary / Fellowship Hall"
                    />
                  </div>

                  <div>
                    <label className="form-label">Leader / Organizer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.organizer_name}
                      onChange={(e) => setForm({ ...form, organizer_name: e.target.value })}
                      placeholder="e.g. Pastor Dr. Samuel Thomas"
                    />
                  </div>

                  <div>
                    <label className="form-label">Target Audience</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.target_group}
                      onChange={(e) => setForm({ ...form, target_group: e.target.value })}
                      placeholder="e.g. All Congregation / Youth / Choir"
                    />
                  </div>

                  <div>
                    <label className="form-label">Recurrence Description</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.recurrence_pattern}
                      onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value })}
                      placeholder="e.g. Weekly on Sundays at 9:00 AM"
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Description & Order of Service</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief notes, scripture reading, or service details"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={16} />
                  <span>Schedule Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
