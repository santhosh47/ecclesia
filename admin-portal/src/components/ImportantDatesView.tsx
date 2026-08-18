import React, { useState, useEffect } from 'react';
import {
  CalendarHeart,
  Gift,
  Heart,
  Sparkles,
  Copy,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  User,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { MilestoneItem } from '../types';

interface ImportantDatesViewProps {
  onSelectMember: (memberId: number) => void;
}

export const ImportantDatesView: React.FC<ImportantDatesViewProps> = ({ onSelectMember }) => {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadMilestones = () => {
    setIsLoading(true);
    const mType = typeFilter === 'ALL' ? undefined : typeFilter;
    api
      .getUpcomingMilestones(daysFilter, mType)
      .then(setMilestones)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadMilestones();
  }, [daysFilter, typeFilter]);

  const copyGreeting = (m: MilestoneItem) => {
    const text = `Dear ${m.member_name}, wishing you a joyful and blessed ${m.years ? `${m.years}th ` : ''}${m.milestone_type}! We praise God for you and pray His grace, health, and favor over you this year! - Grace Ecclesia Church`;
    navigator.clipboard.writeText(text);
    setCopiedId(m.member_id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Important Dates & Milestones Center
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Automated celebration alerts for birthdays, wedding anniversaries, baptisms, and membership milestones
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-bar card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div className="filter-group">
          <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Timeframe:</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-sm ${daysFilter === 7 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDaysFilter(7)}
            >
              Next 7 Days (This Week)
            </button>
            <button
              className={`btn btn-sm ${daysFilter === 30 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDaysFilter(30)}
            >
              Next 30 Days (This Month)
            </button>
            <button
              className={`btn btn-sm ${daysFilter === 90 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDaysFilter(90)}
            >
              Next 90 Days (Quarter)
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Milestone Type:</label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Milestones</option>
            <option value="Birthday">🎂 Birthdays Only</option>
            <option value="Wedding Anniversary">💍 Wedding Anniversaries</option>
            <option value="Baptism Anniversary">🕊️ Baptism Anniversaries</option>
            <option value="Membership Anniversary">🏛️ Membership Milestones</option>
          </select>
        </div>
      </div>

      {/* Milestones Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading milestones...</div>
      ) : milestones.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={36} color="var(--gold-400)" style={{ margin: '0 auto 12px' }} />
          <h3>No milestones found for the selected timeframe.</h3>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Try switching to the 30-day or 90-day window.</p>
        </div>
      ) : (
        <div className="grid-3">
          {milestones.map((m) => {
            const isToday = m.days_until === 0;
            const isTomorrow = m.days_until === 1;
            const isThisWeek = m.days_until <= 7;

            return (
              <div key={`${m.member_id}-${m.milestone_type}`} className="card card-hover" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div
                    className={`milestone-icon ${
                      m.milestone_type === 'Birthday'
                        ? 'icon-bday'
                        : m.milestone_type.includes('Wedding')
                        ? 'icon-anniv'
                        : 'icon-baptism'
                    }`}
                    style={{ width: '42px', height: '42px', fontSize: '20px' }}
                  >
                    {m.milestone_type === 'Birthday' ? '🎂' : m.milestone_type.includes('Wedding') ? '💍' : '🕊️'}
                  </div>
                  <span
                    className={`days-tag ${isThisWeek ? 'days-soon' : ''}`}
                    style={{
                      background: isToday ? 'rgba(16, 185, 129, 0.2)' : isTomorrow ? 'rgba(245, 158, 11, 0.2)' : undefined,
                      color: isToday ? '#34d399' : isTomorrow ? '#fbbf24' : undefined,
                    }}
                  >
                    {isToday ? 'Today 🎉' : isTomorrow ? 'Tomorrow' : `in ${m.days_until} days`}
                  </span>
                </div>

                <h3
                  style={{ fontSize: '16px', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)' }}
                  onClick={() => onSelectMember(m.member_id)}
                >
                  {m.member_name}
                </h3>

                <div style={{ fontSize: '13px', color: 'var(--gold-400)', fontWeight: '600', marginTop: '4px' }}>
                  {m.years ? `${m.years}th ` : ''}
                  {m.milestone_type}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Date: {new Date(m.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                </div>

                <div style={{ margin: '16px 0 0', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => copyGreeting(m)}
                  >
                    {copiedId === m.member_id ? (
                      <>
                        <CheckCircle size={13} color="#10b981" />
                        <span style={{ color: '#10b981' }}>Copied Blessing!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Greeting</span>
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onSelectMember(m.member_id)}
                    title="View Member Profile"
                  >
                    Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
