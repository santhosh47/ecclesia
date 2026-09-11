import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api/client';
import {
  useDashboardData,
  useMembers,
  useHouseholds,
  useMinistries,
  useEvents,
  useFinances,
  invalidateDashboard,
  invalidateMembers,
  invalidateHouseholds,
  invalidateMinistries,
  invalidateEvents,
  invalidateFinances,
  invalidateAllQueries,
} from './api/queries';
import { AttendanceView } from './components/AttendanceView';
import { CertificatesView } from './components/CertificatesView';
import { ChurchCalendarView } from './components/ChurchCalendarView';
import { ComplianceView } from './components/ComplianceView';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
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
  Event,
  Household,
  Member,
  MemberDetail,
} from './types';

function AppContent() {
  const { user, activeRole } = useAuth();
  const { setCurrentRole } = useLocalization();
  const location = useLocation();
  const navigate = useNavigate();

  // Map pathname to NavSection
  const getActiveSectionFromPath = (pathname: string): NavSection => {
    const segment = pathname.replace(/^\//, '').split('/')[0];
    const validSections: NavSection[] = [
      'dashboard',
      'members',
      'milestones',
      'households',
      'calendar',
      'attendance',
      'ministries',
      'pastoral',
      'ledger',
      'finances',
      'compliance',
      'certificates',
      'messaging',
      'settings',
    ];
    if (validSections.includes(segment as NavSection)) {
      return segment as NavSection;
    }
    return 'dashboard';
  };

  const activeSection = getActiveSectionFromPath(location.pathname);

  const handleNavigate = (section: NavSection) => {
    if (section === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${section}`);
    }
    setMobileMenuOpen(false);
  };

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // TanStack Query server-state data
  const dashboardQuery = useDashboardData();
  const membersQuery = useMembers();
  const householdsQuery = useHouseholds();
  const ministriesQuery = useMinistries();
  const eventsQuery = useEvents();
  const finances = useFinances();

  const dashboardData = dashboardQuery.data || null;
  const members = membersQuery.data || [];
  const households = householdsQuery.data || [];
  const ministries = ministriesQuery.data || [];
  const events = eventsQuery.data || [];
  const financeSummary = finances.summary;
  const contributions = finances.contributions;
  const expenses = finances.expenses;
  const campaigns = finances.campaigns;

  const isLoading =
    dashboardQuery.isLoading ||
    membersQuery.isLoading ||
    householdsQuery.isLoading ||
    ministriesQuery.isLoading ||
    eventsQuery.isLoading ||
    finances.isLoading;

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
      await invalidateAllQueries();
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
      invalidateMembers();
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
      invalidateMembers();
    } catch (err: any) {
      alert(err.message || 'Error updating member');
    }
  };

  const handleDeleteMember = async (id: number) => {
    try {
      await api.deleteMember(id);
      showToast('Member record deleted');
      if (selectedMemberId === id) setSelectedMemberId(null);
      invalidateMembers();
    } catch (err: any) {
      alert(err.message || 'Error deleting member');
    }
  };

  const handleAddHousehold = async (data: any) => {
    try {
      await api.createHousehold(data);
      showToast('Household registered!');
      invalidateHouseholds();
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
      invalidateHouseholds();
    } catch (err: any) {
      alert(err.message || 'Error updating household');
    }
  };

  const handleDeleteHousehold = async (id: number) => {
    try {
      await api.deleteHousehold(id);
      showToast('Household removed. Members set to independent.');
      invalidateHouseholds();
      invalidateMembers();
    } catch (err: any) {
      alert(err.message || 'Error deleting household');
    }
  };

  const handleAddMinistry = async (data: any) => {
    try {
      await api.createMinistry(data);
      showToast('Ministry created!');
      invalidateMinistries();
    } catch (err: any) {
      alert(err.message || 'Error creating ministry');
    }
  };

  const handleRecordContribution = async (data: any) => {
    try {
      await api.createContribution(data);
      showToast('Contribution recorded!');
      setShowRecordGivingModal(false);
      invalidateFinances();
    } catch (err: any) {
      alert(err.message || 'Error recording contribution');
    }
  };

  const handleDeleteContribution = async (id: number) => {
    try {
      await api.deleteContribution(id);
      showToast('Contribution removed');
      invalidateFinances();
    } catch (err: any) {
      alert(err.message || 'Error deleting contribution');
    }
  };

  const handleRecordExpense = async (data: any) => {
    try {
      await api.createExpense(data);
      showToast('Expense logged!');
      setShowRecordExpenseModal(false);
      invalidateFinances();
    } catch (err: any) {
      alert(err.message || 'Error recording expense');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      showToast('Expense removed');
      invalidateFinances();
    } catch (err: any) {
      alert(err.message || 'Error deleting expense');
    }
  };

  const handleAddPrayer = async (data: any) => {
    try {
      await api.createPrayerRequest(data);
      showToast('Prayer request submitted!');
      setShowAddPrayerModal(false);
      invalidateDashboard();
    } catch (err: any) {
      alert(err.message || 'Error submitting prayer request');
    }
  };

  const handleCreateEvent = async (data: Partial<Event>) => {
    try {
      await api.createEvent(data);
      showToast('Service / Gathering logged!');
      setShowCheckInModal(false);
      invalidateEvents();
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
          handleNavigate(sec);
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
              handleNavigate('members');
            }
          }}
          onOpenAddMember={() => setShowAddMemberModal(true)}
          onOpenRecordGiving={() => setShowRecordGivingModal(true)}
          onOpenCheckIn={() => setShowCheckInModal(true)}
          onOpenAddPrayer={() => setShowAddPrayerModal(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onNavigate={handleNavigate}
        />

        <main className="content-body">
          <ErrorBoundary key={activeSection} moduleName={activeSection}>
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardView
                    data={dashboardData}
                    isLoading={isLoading}
                    onNavigate={(sec) => handleNavigate(sec)}
                    onSelectMember={(mId) => setSelectedMemberId(mId)}
                    onOpenAddMember={() => setShowAddMemberModal(true)}
                    onOpenRecordGiving={() => setShowRecordGivingModal(true)}
                    onOpenCheckIn={() => setShowCheckInModal(true)}
                    onOpenAddPrayer={() => setShowAddPrayerModal(true)}
                  />
                }
              />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route
                path="/members"
                element={
                  <MembersView
                    members={members}
                    isLoading={isLoading}
                    onSelectMember={(mId) => setSelectedMemberId(mId)}
                    onOpenAddMember={() => setShowAddMemberModal(true)}
                    onEditMember={(m) => setEditingMember(m)}
                    onDeleteMember={handleDeleteMember}
                  />
                }
              />
              <Route
                path="/milestones"
                element={<ImportantDatesView onSelectMember={(mId) => setSelectedMemberId(mId)} />}
              />
              <Route
                path="/households"
                element={
                  <HouseholdsView
                    households={households}
                    isLoading={isLoading}
                    onSelectMember={(mId) => setSelectedMemberId(mId)}
                    onAddHousehold={handleAddHousehold}
                    onEditHousehold={(h) => setEditingHousehold(h)}
                    onDeleteHousehold={handleDeleteHousehold}
                  />
                }
              />
              <Route
                path="/ministries"
                element={
                  <MinistriesView
                    ministries={ministries}
                    members={members}
                    isLoading={isLoading}
                    onAddMinistry={handleAddMinistry}
                    onSelectMember={(mId) => setSelectedMemberId(mId)}
                  />
                }
              />
              <Route
                path="/calendar"
                element={
                  <ChurchCalendarView
                    onNavigate={(section, eventId) => {
                      if (eventId) {
                        setAttendanceEventId(eventId);
                      }
                      handleNavigate(section as NavSection);
                    }}
                  />
                }
              />
              <Route
                path="/attendance"
                element={
                  <AttendanceView
                    events={events}
                    members={members}
                    isLoading={isLoading}
                    initialEventId={attendanceEventId}
                    onOpenCheckInModal={() => setShowCheckInModal(true)}
                    onSelectMember={(mId) => setSelectedMemberId(mId)}
                    onRefreshEvents={() => invalidateEvents()}
                  />
                }
              />
              <Route path="/ledger" element={<LedgerView />} />
              <Route path="/compliance" element={<ComplianceView />} />
              <Route path="/certificates" element={<CertificatesView />} />
              <Route path="/messaging" element={<MassMessagingView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route
                path="/finances"
                element={
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
                }
              />
              <Route
                path="/pastoral"
                element={
                  <PastoralCareView
                    members={members}
                    onOpenAddPrayer={() => setShowAddPrayerModal(true)}
                    onSelectMember={(mId) => setSelectedMemberId(mId)}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
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
          onRefreshList={() => invalidateMembers()}
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
            invalidateAllQueries();
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
