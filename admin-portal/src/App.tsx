import React, { useEffect, useState } from 'react';
import { api } from './api/client';
import { AttendanceView } from './components/AttendanceView';
import { CertificatesView } from './components/CertificatesView';
import { ChurchCalendarView } from './components/ChurchCalendarView';
import { ComplianceView } from './components/ComplianceView';
import { DashboardView } from './components/DashboardView';
import { FinancesView } from './components/FinancesView';
import { HouseholdsView } from './components/HouseholdsView';
import { ImportantDatesView } from './components/ImportantDatesView';
import { LedgerView } from './components/LedgerView';
import { LoginView } from './components/LoginView';
import { MassMessagingView } from './components/MassMessagingView';
import { MemberDetailModal } from './components/MemberDetailModal';
import { MembersView } from './components/MembersView';
import { MinistriesView } from './components/MinistriesView';
import { AddMemberModal } from './components/Modals/AddMemberModal';
import { AddPrayerModal } from './components/Modals/AddPrayerModal';
import { CheckInModal } from './components/Modals/CheckInModal';
import { CsvMigrationModal } from './components/Modals/CsvMigrationModal';
import { DonorStatementModal } from './components/Modals/DonorStatementModal';
import { EditHouseholdModal } from './components/Modals/EditHouseholdModal';
import { EditMemberModal } from './components/Modals/EditMemberModal';
import { RecordExpenseModal } from './components/Modals/RecordExpenseModal';
import { RecordGivingModal } from './components/Modals/RecordGivingModal';
import { Navbar } from './components/Navbar';
import { PastoralCareView } from './components/PastoralCareView';
import { SettingsView } from './components/SettingsView';
import { NavSection, Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocalizationProvider, useLocalization } from './context/LocalizationContext';
import {
  Contribution,
  DashboardData,
  Event,
  Expense,
  FinanceSummary,
  Household,
  Member,
  MemberDetail,
  Ministry,
  PledgeCampaign,
} from './types';

function AppContent() {
  const { user, activeRole } = useAuth();
  const { setCurrentRole } = useLocalization();

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [campaigns, setCampaigns] = useState<PledgeCampaign[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Loading and seeding states
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Editing states
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<Member | MemberDetail | null>(null);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRecordGivingModal, setShowRecordGivingModal] = useState(false);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  const [showAddPrayerModal, setShowAddPrayerModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCsvMigrationModal, setShowCsvMigrationModal] = useState(false);
  const [statementMemberId, setStatementMemberId] = useState<number | null>(null);
  const [attendanceEventId, setAttendanceEventId] = useState<number | null>(null);

  // Sync role whenever activeRole changes
  useEffect(() => {
    if (activeRole) {
      setCurrentRole(activeRole);
    }
  }, [activeRole, setCurrentRole]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [dash, mems, hhs, mins, fSummary, contribs, exps, camps, evts] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getMembers().catch(() => []),
        api.getHouseholds().catch(() => []),
        api.getMinistries().catch(() => []),
        api.getFinanceSummary().catch(() => null),
        api.getContributions().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getPledgeCampaigns().catch(() => []),
        api.getEvents().catch(() => []),
      ]);

      if (dash) setDashboardData(dash);
      setMembers(mems);
      setHouseholds(hhs);
      setMinistries(mins);
      if (fSummary) setFinanceSummary(fSummary);
      setContributions(contribs);
      setExpenses(exps);
      setCampaigns(camps);
      setEvents(evts);
    } catch (err) {
      console.error('Error fetching church CRM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // If user is not authenticated, show the Login Screen
  if (!user) {
    return <LoginView />;
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleSeedData = async () => {
    if (!window.confirm('Reset database and seed complete enterprise ChMS demo dataset?')) return;
    setIsSeeding(true);
    try {
      await api.seedDatabase();
      showToast('✨ ChMS Database seeded with enterprise records!');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error seeding database');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddMember = async (memberData: any) => {
    try {
      await api.createMember(memberData);
      showToast('Member added successfully!');
      setShowAddMemberModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating member');
    }
  };

  const handleEditMember = async (updatedData: Partial<Member>) => {
    if (!editingMember) return;
    try {
      await api.updateMember(editingMember.id, updatedData);
      showToast(`Member profile updated successfully!`);
      setEditingMember(null);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error updating member');
    }
  };

  const handleDeleteMember = async (id: number) => {
    try {
      await api.deleteMember(id);
      showToast('Member record deleted');
      if (selectedMemberId === id) setSelectedMemberId(null);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error deleting member');
    }
  };

  const handleAddHousehold = async (data: any) => {
    try {
      await api.createHousehold(data);
      showToast('Household registered!');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating household');
    }
  };

  const handleEditHousehold = async (updatedData: Partial<Household>) => {
    if (!editingHousehold) return;
    try {
      await api.updateHousehold(editingHousehold.id, updatedData);
      showToast(`Household "${updatedData.name || editingHousehold.name}" updated!`);
      setEditingHousehold(null);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error updating household');
    }
  };

  const handleDeleteHousehold = async (id: number) => {
    try {
      await api.deleteHousehold(id);
      showToast('Household removed. Members set to independent.');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error deleting household');
    }
  };

  const handleAddMinistry = async (data: any) => {
    try {
      await api.createMinistry(data);
      showToast('Ministry created!');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error creating ministry');
    }
  };

  const handleRecordContribution = async (data: any) => {
    try {
      await api.createContribution(data);
      showToast('Contribution recorded!');
      setShowRecordGivingModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording contribution');
    }
  };

  const handleDeleteContribution = async (id: number) => {
    try {
      await api.deleteContribution(id);
      showToast('Contribution removed');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error deleting contribution');
    }
  };

  const handleRecordExpense = async (data: any) => {
    try {
      await api.createExpense(data);
      showToast('Expense logged!');
      setShowRecordExpenseModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording expense');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      showToast('Expense removed');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error deleting expense');
    }
  };

  const handleAddPrayer = async (data: any) => {
    try {
      await api.createPrayerRequest(data);
      showToast('Prayer request submitted!');
      setShowAddPrayerModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error submitting prayer request');
    }
  };

  const handleCreateEvent = async (data: Partial<Event>) => {
    try {
      await api.createEvent(data);
      showToast('Service / Gathering logged!');
      setShowCheckInModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error logging service');
    }
  };

  return (
    <div className="app-container">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--gold-gradient)',
            color: '#090d16',
            fontWeight: '700',
            fontSize: '13.5px',
            padding: '12px 20px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            animation: 'modalSlideUp 0.3s ease-out',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        milestonesCount={dashboardData?.kpis.upcoming_milestones_count}
        absenteesCount={dashboardData?.kpis.absentee_alerts_count}
        prayersCount={dashboardData?.kpis.active_prayer_requests_count}
        onSeedDemoData={handleSeedData}
        onOpenCsvMigration={() => setShowCsvMigrationModal(true)}
        isSeeding={isSeeding}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace */}
      <div className="main-wrapper">
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (activeSection !== 'members' && q) {
              setActiveSection('members');
            }
          }}
          onOpenAddMember={() => setShowAddMemberModal(true)}
          onOpenRecordGiving={() => setShowRecordGivingModal(true)}
          onOpenCheckIn={() => setShowCheckInModal(true)}
          onOpenAddPrayer={() => setShowAddPrayerModal(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        <main className="content-body">
          {activeSection === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              isLoading={isLoading}
              onNavigate={(sec) => setActiveSection(sec)}
              onSelectMember={(mId) => setSelectedMemberId(mId)}
              onOpenAddMember={() => setShowAddMemberModal(true)}
              onOpenRecordGiving={() => setShowRecordGivingModal(true)}
              onOpenCheckIn={() => setShowCheckInModal(true)}
              onOpenAddPrayer={() => setShowAddPrayerModal(true)}
            />
          )}

          {activeSection === 'members' && (
            <MembersView
              members={members}
              isLoading={isLoading}
              onSelectMember={(mId) => setSelectedMemberId(mId)}
              onOpenAddMember={() => setShowAddMemberModal(true)}
              onEditMember={(m) => setEditingMember(m)}
              onDeleteMember={handleDeleteMember}
            />
          )}

          {activeSection === 'milestones' && (
            <ImportantDatesView onSelectMember={(mId) => setSelectedMemberId(mId)} />
          )}

          {activeSection === 'households' && (
            <HouseholdsView
              households={households}
              isLoading={isLoading}
              onSelectMember={(mId) => setSelectedMemberId(mId)}
              onAddHousehold={handleAddHousehold}
              onEditHousehold={(h) => setEditingHousehold(h)}
              onDeleteHousehold={handleDeleteHousehold}
            />
          )}

          {activeSection === 'ministries' && (
            <MinistriesView
              ministries={ministries}
              members={members}
              isLoading={isLoading}
              onAddMinistry={handleAddMinistry}
              onSelectMember={(mId) => setSelectedMemberId(mId)}
            />
          )}

          {activeSection === 'calendar' && (
            <ChurchCalendarView
              onNavigate={(section, eventId) => {
                setActiveSection(section as NavSection);
                if (eventId) {
                  setAttendanceEventId(eventId);
                }
              }}
            />
          )}

          {activeSection === 'ledger' && <LedgerView />}

          {activeSection === 'compliance' && <ComplianceView />}

          {activeSection === 'certificates' && <CertificatesView />}

          {activeSection === 'messaging' && <MassMessagingView />}

          {activeSection === 'settings' && <SettingsView />}

          {activeSection === 'finances' && (
            <FinancesView
              summary={financeSummary}
              contributions={contributions}
              expenses={expenses}
              campaigns={campaigns}
              members={members}
              isLoading={isLoading}
              onOpenRecordGiving={() => setShowRecordGivingModal(true)}
              onOpenRecordExpense={() => setShowRecordExpenseModal(true)}
              onOpenDonorStatement={(mId) => setStatementMemberId(mId)}
              onDeleteContribution={handleDeleteContribution}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeSection === 'attendance' && (
            <AttendanceView
              events={events}
              members={members}
              isLoading={isLoading}
              initialEventId={attendanceEventId}
              onOpenCheckInModal={() => setShowCheckInModal(true)}
              onSelectMember={(mId) => setSelectedMemberId(mId)}
              onRefreshEvents={loadAllData}
            />
          )}

          {activeSection === 'pastoral' && (
            <PastoralCareView
              members={members}
              onOpenAddPrayer={() => setShowAddPrayerModal(true)}
              onSelectMember={(mId) => setSelectedMemberId(mId)}
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      {selectedMemberId !== null && (
        <MemberDetailModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          onOpenDonorStatement={(mId) => {
            setSelectedMemberId(null);
            setStatementMemberId(mId);
          }}
          onRefreshList={loadAllData}
          onOpenEditMember={(memberDetail) => {
            setSelectedMemberId(null);
            setEditingMember(memberDetail);
          }}
        />
      )}

      {showAddMemberModal && (
        <AddMemberModal
          households={households}
          onClose={() => setShowAddMemberModal(false)}
          onSubmit={handleAddMember}
        />
      )}

      {editingMember !== null && (
        <EditMemberModal
          member={editingMember}
          households={households}
          onClose={() => setEditingMember(null)}
          onSubmit={handleEditMember}
        />
      )}

      {editingHousehold !== null && (
        <EditHouseholdModal
          household={editingHousehold}
          onClose={() => setEditingHousehold(null)}
          onSubmit={handleEditHousehold}
        />
      )}

      {showRecordGivingModal && (
        <RecordGivingModal
          members={members}
          onClose={() => setShowRecordGivingModal(false)}
          onSubmit={handleRecordContribution}
        />
      )}

      {showRecordExpenseModal && (
        <RecordExpenseModal
          onClose={() => setShowRecordExpenseModal(false)}
          onSubmit={handleRecordExpense}
        />
      )}

      {showAddPrayerModal && (
        <AddPrayerModal
          members={members}
          onClose={() => setShowAddPrayerModal(false)}
          onSubmit={handleAddPrayer}
        />
      )}

      {showCheckInModal && (
        <CheckInModal
          onClose={() => setShowCheckInModal(false)}
          onSubmit={handleCreateEvent}
        />
      )}

      {showCsvMigrationModal && (
        <CsvMigrationModal
          isOpen={showCsvMigrationModal}
          onClose={() => setShowCsvMigrationModal(false)}
          onSuccess={() => {
            showToast('Members & households imported from CSV!');
            loadAllData();
          }}
        />
      )}

      {statementMemberId !== null && (
        <DonorStatementModal
          memberId={statementMemberId}
          onClose={() => setStatementMemberId(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocalizationProvider>
        <AppContent />
      </LocalizationProvider>
    </AuthProvider>
  );
}
