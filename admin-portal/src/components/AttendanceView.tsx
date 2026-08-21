import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  UserCheck,
  AlertTriangle,
  Users,
  Plus,
  CheckCircle,
  Clock,
  Calendar,
  Phone,
  HeartHandshake,
  CalendarPlus,
  Check,
} from 'lucide-react';
import { api } from '../api/client';
import { useLocalization } from '../context/LocalizationContext';
import { AbsenteeAlertItem, AttendanceRecord, AttendanceSummary, Event, Member } from '../types';

interface AttendanceViewProps {
  events: Event[];
  members: Member[];
  isLoading: boolean;
  onOpenCheckInModal: () => void;
  onSelectMember: (memberId: number) => void;
  onRefreshEvents?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  events,
  members,
  isLoading,
  onOpenCheckInModal,
  onSelectMember,
  onRefreshEvents,
}) => {
  const { hasPermission } = useLocalization();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventRecords, setEventRecords] = useState<AttendanceRecord[]>([]);
  const [absenteeList, setAbsenteeList] = useState<AbsenteeAlertItem[]>([]);
  const [activeTab, setActiveTab] = useState<'checkin' | 'absentees'>('checkin');
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);
  const [isCreatingQuickEvent, setIsCreatingQuickEvent] = useState(false);

  useEffect(() => {
    if (events.length > 0) {
      if (!selectedEventId || !events.some((e) => e.id === selectedEventId)) {
        setSelectedEventId(events[0].id);
      }
    } else {
      setSelectedEventId(null);
    }
  }, [events]);

  useEffect(() => {
    if (selectedEventId) {
      api.getAttendanceRecords(selectedEventId).then(setEventRecords).catch(console.error);
    } else {
      setEventRecords([]);
    }
  }, [selectedEventId]);

  useEffect(() => {
    api.getAbsenteeAlerts(3).then(setAbsenteeList).catch(console.error);
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const handleCreateQuickSundayService = async () => {
    setIsCreatingQuickEvent(true);
    try {
      const today = new Date();
      const startsAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString();
      const endsAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString();

      const created = await api.createEvent({
        title: 'Sunday Morning Worship & Communion',
        event_type: 'Worship Service',
        location: 'Main Sanctuary',
        starts_at: startsAt,
        ends_at: endsAt,
        headcount_adults: 0,
        headcount_children: 0,
        headcount_online: 0,
      });

      if (onRefreshEvents) onRefreshEvents();
      setSelectedEventId(created.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    } finally {
      setIsCreatingQuickEvent(false);
    }
  };

  const toggleCheckIn = async (memberId: number) => {
    let targetEventId = selectedEventId;

    if (!targetEventId) {
      if (events.length > 0) {
        targetEventId = events[0].id;
        setSelectedEventId(targetEventId);
      } else {
        alert('Please create or select an event/service before marking attendance.');
        return;
      }
    }

    setUpdatingMemberId(memberId);
    const existing = eventRecords.find((r) => r.member_id === memberId);
    const nextStatus = existing && (existing.status === 'Present' || existing.status === 'Late') ? 'Absent' : 'Present';

    try {
      await api.checkInMember(targetEventId, memberId, nextStatus);
      const updated = await api.getAttendanceRecords(targetEventId);
      setEventRecords(updated);
    } catch (err: any) {
      alert(err.message || 'Error updating attendance');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Attendance & Service Check-in
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Headcount logging, roster check-ins, and automated 3-week pastoral absentee alerts
          </p>
        </div>
        {hasPermission('manage_attendance') && (
          <button className="btn btn-primary" onClick={onOpenCheckInModal}>
            <Plus size={16} />
            <span>New Service / Event</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'checkin' ? 'active' : ''}`} onClick={() => setActiveTab('checkin')}>
          <ClipboardCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Live Event Roster Check-In
        </button>
        <button className={`tab-btn ${activeTab === 'absentees' ? 'active' : ''}`} onClick={() => setActiveTab('absentees')}>
          <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px', color: '#fb7185' }} />
          Pastoral Absentee Alerts ({absenteeList.length})
        </button>
      </div>

      {/* TAB 1: CHECK-IN */}
      {activeTab === 'checkin' && (
        <div>
          {events.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: '24px' }}>
              <Calendar size={40} color="var(--gold-400)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                No Church Gathering Scheduled
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '8px auto 20px' }}>
                To take attendance, select or create a church worship service, prayer gathering, or event.
              </p>
              {hasPermission('manage_attendance') && (
                <button
                  className="btn btn-primary"
                  onClick={handleCreateQuickSundayService}
                  disabled={isCreatingQuickEvent}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <CalendarPlus size={16} />
                  <span>{isCreatingQuickEvent ? 'Creating Service...' : 'Create Today’s Sunday Worship Service'}</span>
                </button>
              )}
            </div>
          ) : (
            /* Event Selector & Headcount Metrics */
            <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <label className="form-label">Select Church Gathering:</label>
                  <select
                    className="form-select"
                    style={{ width: '340px', fontWeight: '600' }}
                    value={selectedEventId || ''}
                    onChange={(e) => setSelectedEventId(Number(e.target.value))}
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} — {new Date(ev.starts_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEvent && (
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Adults</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--gold-400)' }}>{selectedEvent.headcount_adults}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Children</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--royal-blue)' }}>{selectedEvent.headcount_children}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Online Stream</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--emerald)' }}>{selectedEvent.headcount_online ?? 0}</div>
                    </div>
                    <div style={{ textAlign: 'center', paddingLeft: '16px', borderLeft: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Attendance</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {selectedEvent.total_headcount ?? (selectedEvent.headcount_adults + selectedEvent.headcount_children + (selectedEvent.headcount_online || 0))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Member Attendance Roster Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Users size={18} color="var(--gold-400)" />
                <span>Congregation Check-In Sheet</span>
              </div>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {eventRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length} / {members.length} Present
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Category</th>
                    <th>Household</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Quick Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const record = eventRecords.find((r) => r.member_id === m.id);
                    const isPresent = record && (record.status === 'Present' || record.status === 'Late');
                    const isCurrentlyUpdating = updatingMemberId === m.id;

                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="person-cell">
                            <div className="avatar">
                              {m.avatar_url ? (
                                <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                `${m.first_name[0]}${m.last_name[0]}`
                              )}
                            </div>
                            <div>
                              <div className="person-name">{m.first_name} {m.last_name}</div>
                              <div className="person-meta">{m.phone || m.email || 'Member'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{m.member_type}</td>
                        <td>{m.household_name || 'Independent'}</td>
                        <td>
                          <span className={`status-pill ${isPresent ? 'status-active' : 'status-inactive'}`}>
                            {isPresent ? record.status : 'Absent'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {hasPermission('manage_attendance') ? (
                            <button
                              type="button"
                              className={`btn btn-sm ${isPresent ? 'btn-emerald' : 'btn-secondary'}`}
                              onClick={() => toggleCheckIn(m.id)}
                              disabled={isCurrentlyUpdating}
                              style={{ minWidth: '110px' }}
                            >
                              {isPresent ? <Check size={14} /> : <CheckCircle size={14} />}
                              <span>{isCurrentlyUpdating ? 'Saving...' : isPresent ? 'Checked In' : 'Mark Present'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Read Only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ABSENTEE ALERTS */}
      {activeTab === 'absentees' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <AlertTriangle size={28} color="#f43f5e" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fb7185' }}>
                  Automated Absentee Care Triggers
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  These active congregants have not attended any church service for 3 or more consecutive weeks. Pastoral follow-up or visitation is recommended.
                </p>
              </div>
            </div>
          </div>

          <div className="grid-equal-2">
            {absenteeList.map((a) => (
              <div key={a.member_id} className="card card-hover" style={{ padding: '20px', borderLeft: '4px solid var(--rose)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{a.member_name}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {a.household_name ? `Family: ${a.household_name} • ` : ''}{a.status || 'Active'}
                    </div>
                  </div>
                  <span className="status-pill status-inactive" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                    {a.weeks_absent ?? a.consecutive_absences_count} Weeks Absent
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  {a.last_attended_date ? (
                    <div>Last attended: <strong>{new Date(a.last_attended_date).toLocaleDateString()}</strong></div>
                  ) : (
                    <div>No recorded attendance since registration.</div>
                  )}
                  {a.notes && <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{a.notes}"</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {(a.phone || a.member_phone) && <span>📞 {a.phone || a.member_phone}</span>}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onSelectMember(a.member_id)}>
                    <HeartHandshake size={14} />
                    <span>Pastoral Outreach</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

