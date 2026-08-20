import {
  AbsenteeAlertItem,
  Account,
  AttendanceRecord,
  AttendanceSummary,
  CertificateTemplate,
  ChurchActivity,
  ChurchProfile,
  Contribution,
  CsvImportResult,
  DashboardData,
  DonorStatement,
  Event,
  Expense,
  FCRALog,
  FinanceSummary,
  Form10BDExportReport,
  Household,
  IssuedCertificate,
  JournalEntry,
  LocalizationConfig,
  LocalizationMode,
  Member,
  MemberDetail,
  MessageBroadcast,
  MessageTemplate,
  MilestoneItem,
  Ministry,
  MinistryDetail,
  PastoralCareNote,
  PayrollRecord,
  PledgeCampaign,
  PrayerRequest,
  RoleDefinition,
  Staff,
  TaxReceipt,
  TrialBalanceReport,
  UKGiftAidClaimReport,
  VisitorFollowUp,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = 'An error occurred while communicating with the server.';
    try {
      const errorJson = await response.json();
      if (errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      // Ignore fallback
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Base URLs
  apiBase: API_BASE,

  // Dashboard
  getDashboardStats: () => request<DashboardData>('/dashboard/stats'),

  // Members
  getMembers: (params?: { search?: string; status?: string; member_type?: string; household_id?: number; ministry_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.member_type) query.append('member_type', params.member_type);
    if (params?.household_id) query.append('household_id', params.household_id.toString());
    if (params?.ministry_id) query.append('ministry_id', params.ministry_id.toString());
    return request<Member[]>(`/members?${query.toString()}`);
  },
  getMemberDetail: (id: number) => request<MemberDetail>(`/members/${id}`),
  createMember: (data: Partial<Member>) =>
    request<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMember: (id: number, data: Partial<Member>) =>
    request<Member>(`/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteMember: (id: number) => request<void>(`/members/${id}`, { method: 'DELETE' }),

  // Households
  getHouseholds: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Household[]>(`/households${query}`);
  },
  getHousehold: (id: number) => request<Household>(`/households/${id}`),
  createHousehold: (data: Partial<Household>) =>
    request<Household>('/households', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateHousehold: (id: number, data: Partial<Household>) =>
    request<Household>(`/households/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Milestones
  getUpcomingMilestones: (days: number = 30, milestoneType?: string) => {
    const query = new URLSearchParams();
    query.append('days', days.toString());
    if (milestoneType) query.append('milestone_type', milestoneType);
    return request<MilestoneItem[]>(`/members/milestones/upcoming?${query.toString()}`);
  },

  // Double-Entry Ledger & Chart of Accounts
  getAccounts: (accountType?: string, isFcra?: boolean) => {
    const query = new URLSearchParams();
    if (accountType) query.append('account_type', accountType);
    if (isFcra !== undefined) query.append('is_fcra', isFcra.toString());
    return request<Account[]>(`/ledger/accounts?${query.toString()}`);
  },
  createAccount: (data: Partial<Account>) =>
    request<Account>('/ledger/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getJournalEntries: (isFcra?: boolean) => {
    const query = isFcra !== undefined ? `?is_fcra=${isFcra}` : '';
    return request<JournalEntry[]>(`/ledger/journal-entries${query}`);
  },
  createJournalEntry: (data: {
    description: string;
    reference?: string;
    entry_date?: string;
    is_fcra?: boolean;
    posted_by?: string;
    lines: { account_id: number; debit: number; credit: number; memo?: string }[];
  }) =>
    request<JournalEntry>('/ledger/journal-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTrialBalance: (isFcra?: boolean) => {
    const query = isFcra !== undefined ? `?is_fcra=${isFcra}` : '';
    return request<TrialBalanceReport>(`/ledger/trial-balance${query}`);
  },
  getStaff: () => request<Staff[]>('/ledger/staff'),
  createStaff: (data: Partial<Staff>) =>
    request<Staff>('/ledger/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPayrollRecords: (staffId?: number, payPeriod?: string) => {
    const query = new URLSearchParams();
    if (staffId) query.append('staff_id', staffId.toString());
    if (payPeriod) query.append('pay_period', payPeriod);
    return request<PayrollRecord[]>(`/ledger/payroll?${query.toString()}`);
  },
  disbursePayroll: (data: {
    staff_id: number;
    pay_period: string;
    payment_date?: string;
    basic_salary: number;
    allowances?: number;
    deductions?: number;
    payment_method?: string;
  }) =>
    request<PayrollRecord>('/ledger/payroll/disburse', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Church Activities Calendar
  getChurchActivities: (params?: { category?: string; activity_type?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.activity_type) query.append('activity_type', params.activity_type);
    return request<ChurchActivity[]>(`/church-calendar/activities?${query.toString()}`);
  },
  createChurchActivity: (data: Partial<ChurchActivity>) =>
    request<ChurchActivity>('/church-calendar/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateChurchActivity: (id: number, data: Partial<ChurchActivity>) =>
    request<ChurchActivity>(`/church-calendar/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteChurchActivity: (id: number) =>
    request<void>(`/church-calendar/activities/${id}`, { method: 'DELETE' }),

  // Milestone Certificates
  getCertificateTemplates: () => request<CertificateTemplate[]>('/certificates/templates'),
  getIssuedCertificates: (type?: string, memberId?: number) => {
    const query = new URLSearchParams();
    if (type) query.append('type', type);
    if (memberId) query.append('member_id', memberId.toString());
    return request<IssuedCertificate[]>(`/certificates/issued?${query.toString()}`);
  },
  issueCertificate: (data: {
    certificate_type: string;
    member_id?: number;
    recipient_name: string;
    secondary_name?: string;
    issue_date?: string;
    event_date?: string;
    officiant_name?: string;
    witness_1?: string;
    witness_2?: string;
    church_name?: string;
    church_registration_no?: string;
    church_address?: string;
    notes?: string;
  }) =>
    request<IssuedCertificate>('/certificates/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCertificatePdfUrl: (certificateId: number) => `${API_BASE}/certificates/${certificateId}/pdf`,
  verifyCertificate: (code: string) =>
    request<{ is_valid: boolean; recipient_name?: string; certificate_type?: string; church_name?: string }>(
      `/certificates/verify/${code}`
    ),

  // Mass Messaging & WhatsApp
  getMessageTemplates: (channel?: string) => {
    const query = channel ? `?channel=${channel}` : '';
    return request<MessageTemplate[]>(`/messaging/templates${query}`);
  },
  createMessageTemplate: (data: Partial<MessageTemplate>) =>
    request<MessageTemplate>('/messaging/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMessageBroadcasts: () => request<MessageBroadcast[]>('/messaging/broadcasts'),
  sendBroadcast: (data: {
    title: string;
    channel?: string;
    target_group?: string;
    template_id?: number;
    custom_message?: string;
  }) =>
    request<MessageBroadcast>('/messaging/broadcasts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tax Compliance (80G, Form 10BD, FCRA, 501c3, Gift Aid)
  getTaxReceipts: (financialYearParam?: string | { financial_year?: string }, memberId?: number) => {
    const fy = typeof financialYearParam === 'object' ? financialYearParam.financial_year : financialYearParam;
    const query = new URLSearchParams();
    if (fy) query.append('financial_year', fy);
    if (memberId) query.append('member_id', memberId.toString());
    return request<TaxReceipt[]>(`/compliance/receipts?${query.toString()}`);
  },
  generateTaxReceipt: (data: {
    contribution_id: number;
    tax_regime?: string;
    donor_pan_or_tax_id?: string;
    financial_year?: string;
    notes?: string;
  }) =>
    request<TaxReceipt>('/compliance/receipts/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTaxReceiptPdfUrl: (receiptId: number) => `${API_BASE}/compliance/receipts/${receiptId}/pdf`,
  getForm10BDReport: (financialYearParam?: string | { financial_year?: string }) => {
    const fy = typeof financialYearParam === 'object' ? financialYearParam.financial_year : financialYearParam;
    const query = fy ? `?financial_year=${fy}` : '';
    return request<Form10BDExportReport>(`/compliance/form-10bd${query}`);
  },
  getFcraLogs: () => request<FCRALog[]>('/compliance/fcra-logs'),
  getFCRALogs: () => request<FCRALog[]>('/compliance/fcra-logs'),
  createFcraLog: (data: Partial<FCRALog>) =>
    request<FCRALog>('/compliance/fcra-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logFCRARemittance: (data: Partial<FCRALog>) =>
    request<FCRALog>('/compliance/fcra-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUKGiftAidReport: (taxYear?: string) => {
    const query = taxYear ? `?tax_year=${taxYear}` : '';
    return request<UKGiftAidClaimReport>(`/compliance/uk-gift-aid${query}`);
  },
  getGiftAidClaims: (taxYear?: string) => {
    const query = taxYear ? `?tax_year=${taxYear}` : '';
    return request<UKGiftAidClaimReport>(`/compliance/uk-gift-aid${query}`);
  },

  // Localization Engine, Church Profile, Feature Toggles & RBAC Roles
  getLocalizationConfig: () => request<LocalizationConfig>('/localization/config'),
  toggleLocalizationMode: (mode: LocalizationMode) =>
    request<LocalizationConfig>('/localization/toggle-mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  updateChurchProfile: (profile: Partial<ChurchProfile>) =>
    request<LocalizationConfig>('/localization/church-profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  toggleModule: (moduleKey: string, enabled: boolean) =>
    request<LocalizationConfig>('/localization/toggle-module', {
      method: 'POST',
      body: JSON.stringify({ module_key: moduleKey, enabled }),
    }),
  saveRole: (role: Partial<RoleDefinition>) =>
    request<LocalizationConfig>('/localization/roles', {
      method: 'PUT',
      body: JSON.stringify(role),
    }),
  deleteRole: (roleId: string) =>
    request<LocalizationConfig>(`/localization/roles/${roleId}`, { method: 'DELETE' }),
  updateLocalizationConfig: (data: Partial<LocalizationConfig>) =>
    request<LocalizationConfig>('/localization/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // CSV Migration (ChurchCRM / Excel)
  importMembersCsv: (csvContent: string) =>
    request<CsvImportResult>('/members/csv/import', {
      method: 'POST',
      body: JSON.stringify({ csv_content: csvContent }),
    }),
  getExportMembersCsvUrl: () => `${API_BASE}/members/csv/export`,

  // Finances (Giving, Expenses, Campaigns)
  getFinanceSummary: () => request<FinanceSummary>('/finances/summary'),
  getContributions: (params?: { member_id?: number; fund?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.member_id) query.append('member_id', params.member_id.toString());
    if (params?.fund) query.append('fund', params.fund);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    return request<Contribution[]>(`/finances/contributions?${query.toString()}`);
  },
  createContribution: (data: Partial<Contribution>) =>
    request<Contribution>('/finances/contributions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getExpenses: (params?: { category?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    return request<Expense[]>(`/finances/expenses?${query.toString()}`);
  },
  createExpense: (data: Partial<Expense>) =>
    request<Expense>('/finances/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPledgeCampaigns: () => request<PledgeCampaign[]>('/finances/campaigns'),
  getCampaigns: () => request<PledgeCampaign[]>('/finances/campaigns'),
  createPledgeCampaign: (data: Partial<PledgeCampaign>) =>
    request<PledgeCampaign>('/finances/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDonorStatement: (memberId: number, startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    return request<DonorStatement>(`/finances/statements/${memberId}?${query.toString()}`);
  },

  // Events & Attendance
  getEvents: () => request<Event[]>('/events'),
  createEvent: (data: Partial<Event>) =>
    request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAttendanceRecords: (eventId?: number) => {
    const query = eventId !== undefined ? `?event_id=${eventId}` : '';
    return request<AttendanceRecord[]>(`/attendance${query}`);
  },
  getAttendanceSummary: () => request<AttendanceSummary>('/attendance/summary'),
  getAbsenteeAlerts: (weeksThreshold: number = 3) =>
    request<AbsenteeAlertItem[]>(`/attendance/absentee-alerts?weeks_threshold=${weeksThreshold}`),
  checkInMember: (
    dataOrEventId: number | { event_id: number; member_id: number; status?: string; notes?: string },
    memberId?: number,
    status: string = 'Present',
    notes?: string
  ) => {
    let payload: { event_id: number; member_id: number; status?: string; notes?: string };
    if (typeof dataOrEventId === 'object') {
      payload = dataOrEventId;
    } else {
      payload = { event_id: dataOrEventId, member_id: memberId!, status, notes };
    }
    return request<AttendanceRecord>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Ministries
  getMinistries: () => request<Ministry[]>('/ministries'),
  getMinistryDetail: (id: number) => request<MinistryDetail>(`/ministries/${id}`),
  createMinistry: (data: Partial<Ministry>) =>
    request<Ministry>('/ministries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  joinMinistry: (ministryId: number, memberId: number, role: string = 'Member') =>
    request<{ status: string }>('/ministries/join', {
      method: 'POST',
      body: JSON.stringify({ ministry_id: ministryId, member_id: memberId, role }),
    }),

  // Pastoral Care & Prayer
  getPastoralNotes: (memberId?: number) => {
    const query = memberId ? `?member_id=${memberId}` : '';
    return request<PastoralCareNote[]>(`/pastoral/notes${query}`);
  },
  createPastoralNote: (data: Partial<PastoralCareNote>) =>
    request<PastoralCareNote>('/pastoral/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPrayerRequests: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<PrayerRequest[]>(`/pastoral/prayers${query}`);
  },
  createPrayerRequest: (data: Partial<PrayerRequest>) =>
    request<PrayerRequest>('/pastoral/prayers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePrayerRequest: (id: number, data: Partial<PrayerRequest>) =>
    request<PrayerRequest>(`/pastoral/prayers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getVisitorFollowUps: () => request<VisitorFollowUp[]>('/pastoral/visitors'),
  createVisitorFollowUp: (data: Partial<VisitorFollowUp>) =>
    request<VisitorFollowUp>('/pastoral/visitors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVisitorFollowUp: (id: number, data: Partial<VisitorFollowUp>) =>
    request<VisitorFollowUp>(`/pastoral/visitors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // System Seed
  seedDatabase: () => request<{ status: string; message: string }>('/seed', { method: 'POST' }),
};
