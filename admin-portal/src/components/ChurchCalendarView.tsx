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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Worship Service':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#818cf8' };
      case 'Prayer Meeting':
        return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      case 'Bible Study':
        return { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' };
      case 'Choir Practice':
        return { bg: '#fae8ff', text: '#86198f', border: '#f0abfc' };
      case 'Committee Meeting':
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
      case 'Youth Fellowship':
        return { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' };
      case 'Community Outreach':
        return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      case 'Special Conference':
        return { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Church Activities & Events Calendar</h1>
          <p className="view-subtitle">
            Schedule and coordinate regular weekly services, prayer meetings, choir rehearsals, committee boards, and special church conferences.
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
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filter Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterCategory === cat ? '#6366f1' : '#f1f5f9',
                color: filterCategory === cat ? '#ffffff' : '#475569',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
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
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading church calendar...</div>
      ) : activities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <CalendarIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No Church Activities Scheduled</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Click "Schedule Activity" above to schedule worship services, rehearsals, or special church gatherings.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {activities.map((act) => {
            const catColors = getCategoryColor(act.category);
            const dateObj = new Date(act.starts_at);
            return (
              <div
                key={act.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${catColors.border}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        background: catColors.bg,
                        color: catColors.text,
                      }}
                    >
                      {act.category}
                    </span>
                    {act.is_recurring && (
                      <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6366f1', fontWeight: 600 }}>
                        <Repeat size={12} />
                        Recurring
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.6rem' }}>
                    {act.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: '#475569', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarIcon size={15} color="#6366f1" />
                      <span>
                        {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={15} color="#6366f1" />
                      <span>
                        {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {act.ends_at && ` - ${new Date(act.ends_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      </span>
                    </div>
                    {act.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={15} color="#6366f1" />
                        <span>{act.location}</span>
                      </div>
                    )}
                    {act.organizer_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={15} color="#6366f1" />
                        <span>Led by: {act.organizer_name}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={15} color="#6366f1" />
                      <span>Audience: {act.target_group}</span>
                    </div>
                  </div>

                  {act.recurrence_pattern && (
                    <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#64748b', marginBottom: '0.75rem' }}>
                      🔄 {act.recurrence_pattern}
                    </div>
                  )}

                  {act.description && (
                    <p style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.4, marginBottom: '1rem' }}>
                      {act.description}
                    </p>
                  )}
                </div>

                {hasPermission('manage_calendar') && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="btn"
                      style={{ color: '#ef4444', background: '#fef2f2', border: 'none', padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
              Schedule Church Activity or Service
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Add a regular weekly service, rehearsal, committee meeting, or special conference to the parish calendar.
            </p>

            <form onSubmit={handleCreateActivity}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                    Activity / Service Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    placeholder="e.g. Sunday Morning Holy Communion Service"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Frequency
                    </label>
                    <select
                      value={form.activity_type}
                      onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="Regular Weekly">Regular Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Special Event">Special Event</option>
                      <option value="Annual">Annual Gathering</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Starts At *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.starts_at}
                      onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Ends At
                    </label>
                    <input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Location / Room
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder="e.g. Main Sanctuary / Fellowship Hall"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Leader / Organizer
                    </label>
                    <input
                      type="text"
                      value={form.organizer_name}
                      onChange={(e) => setForm({ ...form, organizer_name: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder="e.g. Rev. Dr. Samuel Thomas"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Target Group
                    </label>
                    <input
                      type="text"
                      value={form.target_group}
                      onChange={(e) => setForm({ ...form, target_group: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder="e.g. All Congregation / Youth"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                      Recurrence Pattern
                    </label>
                    <input
                      type="text"
                      value={form.recurrence_pattern}
                      onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      placeholder="e.g. Weekly on Sundays at 9:00 AM"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                    Description & Order of Service
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    placeholder="Brief notes, lectionary readings, or choir anthem names"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
