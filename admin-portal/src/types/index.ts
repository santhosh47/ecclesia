export interface Member {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  occupation?: string | null;
  avatar_url?: string | null;
  status: string; // 'Active', 'Visitor', 'Regular Attendee', 'Inactive', 'Transferred', 'Clergy'
  member_type: string; // 'Adult', 'Youth', 'Child', 'Senior'
  pan_number?: string | null;
  tax_id?: string | null;
  gift_aid_eligible?: boolean;
  language_preference?: string;
  gdpr_opt_out?: boolean;
  whatsapp_opt_in?: boolean;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  date_of_birth?: string | null;
  wedding_anniversary?: string | null;
  baptism_date?: string | null;
  baptism_location?: string | null;
  confirmation_date?: string | null;
  joined_date?: string | null;
  first_visit_date?: string | null;
  household_id?: number | null;
  household_role?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  household_name?: string | null;
  ministries?: string[];
}

export interface MemberDetail extends Member {
  total_contributions_ytd: number;
  attendance_rate_percent: number;
  last_attended_date?: string | null;
  prayer_requests_count: number;
  pastoral_notes_count: number;
}

export interface MilestoneItem {
  member_id: number;
  member_name: string;
  member_avatar?: string | null;
  milestone_type: string; // 'Birthday' | 'Wedding Anniversary' | 'Baptism Anniversary' | 'Membership Anniversary'
  event_date: string;
  days_until: number;
  years?: number | null;
  phone?: string | null;
  email?: string | null;
}

export interface HouseholdMemberSummary {
  id: number;
  first_name: string;
  last_name: string;
  household_role?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface Household {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  home_phone?: string | null;
  ward_zone?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  primary_contact_id?: number | null;
  created_at: string;
  members: HouseholdMemberSummary[];
}

export interface Ministry {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  meeting_time?: string | null;
  meeting_location?: string | null;
  leader_id?: number | null;
  created_at: string;
  member_count: number;
  leader_name?: string | null;
}

export interface MemberMinistryLink {
  member_id: number;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
}

export interface MinistryDetail extends Ministry {
  members: MemberMinistryLink[];
}

export interface Contribution {
  id: number;
  member_id?: number | null;
  donor_name?: string | null;
  donor_pan_or_tax_id?: string | null;
  amount: number;
  currency: string;
  fund: string;
  payment_method: string;
  reference_number?: string | null;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  date: string;
  is_anonymous: boolean;
  is_fcra: boolean;
  donor_country?: string | null;
  tax_receipt_issued: boolean;
  tax_receipt_number?: string | null;
  notes?: string | null;
  created_at: string;
  member_name?: string | null;
}

export interface Expense {
  id: number;
  category: string;
  title: string;
  amount: number;
  currency: string;
  payee: string;
  date: string;
  payment_method: string;
  approved_by?: string | null;
  receipt_reference?: string | null;
  receipt_file_url?: string | null;
  gst_amount: number;
  is_fcra_expense: boolean;
  description?: string | null;
  created_at: string;
}

export interface PledgeCampaign {
  id: number;
  title: string;
  target_amount: number;
  start_date: string;
  end_date?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  total_pledged: number;
  total_received: number;
  pledge_count: number;
  percent_completed: number;
}

export interface Pledge {
  id: number;
  campaign_id: number;
  member_id: number;
  amount_pledged: number;
  amount_paid: number;
  status: string;
  created_at: string;
  member_name?: string | null;
}

export interface FundSummary {
  fund_name: string;
  total_amount: number;
  percentage: number;
}

export interface MonthlyFinanceData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinanceSummary {
  total_income_ytd: number;
  total_expense_ytd: number;
  net_operating_balance: number;
  total_pledges_active: number;
  recent_contributions: Contribution[];
  fund_breakdown: FundSummary[];
  monthly_trends: MonthlyFinanceData[];
}

export interface DonorStatement {
  member_id?: number | null;
  donor_name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  start_date: string;
  end_date: string;
  total_amount: number;
  contributions: Contribution[];
  generated_at: string;
}

export interface Event {
  id: number;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  description?: string | null;
  is_completed: boolean;
  headcount_adults: number;
  headcount_children: number;
  headcount_online?: number;
  total_headcount?: number;
  created_at: string;
  attendance_count?: number;
}

export interface AttendanceRecord {
  id: number;
  event_id: number;
  member_id: number;
  status: string;
  check_in_time: string;
  created_at: string;
  member_name?: string | null;
  member_avatar?: string | null;
  member_phone?: string | null;
  household_name?: string | null;
}

export interface AbsenteeAlertItem {
  member_id: number;
  member_name: string;
  member_phone?: string | null;
  member_email?: string | null;
  member_avatar?: string | null;
  consecutive_absences_count: number;
  last_attended_date?: string | null;
  household_name?: string | null;
  status?: string;
  weeks_absent?: number;
  notes?: string;
  phone?: string | null;
  email?: string | null;
}

export interface AttendanceSummary {
  recent_average: number;
  last_service_attendance: number;
  absentee_count: number;
}

export interface PastoralCareNote {
  id: number;
  member_id: number;
  author_name: string;
  category: string;
  content: string;
  follow_up_needed: boolean;
  follow_up_date?: string | null;
  created_at: string;
  date?: string;
  is_confidential?: boolean;
  member_name?: string | null;
}

export interface PrayerRequest {
  id: number;
  member_id?: number | null;
  requester_name: string;
  title: string;
  details?: string | null;
  category: string;
  is_confidential: boolean;
  status: string;
  answer_notes?: string | null;
  date_requested?: string;
  date_answered?: string;
  created_at: string;
}

export interface VisitorFollowUp {
  id: number;
  visitor_id: number;
  assigned_to?: string | null;
  status: string;
  notes?: string | null;
  first_visit_date: string;
  visit_date?: string;
  phone?: string | null;
  email?: string | null;
  last_contact_date?: string | null;
  created_at: string;
  visitor_name?: string | null;
  visitor_phone?: string | null;
  visitor_email?: string | null;
}

export interface DashboardKPICards {
  total_members: number;
  active_members: number;
  total_households: number;
  total_ministries: number;
  ytd_contributions: number;
  ytd_expenses: number;
  net_operating_cash: number;
  avg_sunday_attendance: number;
  upcoming_milestones_count: number;
  absentee_alerts_count: number;
  active_prayer_requests_count: number;
  pending_visitors_count: number;
}

export interface DashboardData {
  kpis: DashboardKPICards;
  upcoming_milestones: MilestoneItem[];
  absentee_alerts: AbsenteeAlertItem[];
  recent_contributions: Contribution[];
  monthly_finance_trends: { month: string; income: number; expense: number; net: number }[];
  active_prayer_requests: PrayerRequest[];
  pending_visitors: VisitorFollowUp[];
}

// --- Double-Entry Ledger ---
export interface Account {
  id: number;
  code: string;
  name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  sub_category?: string | null;
  balance: number;
  currency: string;
  is_active: boolean;
  is_fcra: boolean;
  description?: string | null;
  created_at: string;
}

export interface JournalLine {
  id?: number;
  account_id: number;
  account_code?: string | null;
  account_name?: string | null;
  debit: number;
  credit: number;
  memo?: string | null;
}

export interface JournalEntry {
  id: number;
  entry_number: string;
  entry_date: string;
  description: string;
  reference?: string | null;
  status: string;
  is_fcra: boolean;
  posted_by?: string | null;
  total_debit: number;
  total_credit: number;
  lines: JournalLine[];
  created_at: string;
}

export interface TrialBalanceItem {
  account_id: number;
  code: string;
  name: string;
  account_type: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  as_of_date: string;
  currency: string;
  items: TrialBalanceItem[];
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
}

export interface Staff {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string | null;
  role_title: string;
  email?: string | null;
  phone?: string | null;
  pan_or_tax_id?: string | null;
  bank_account_number?: string | null;
  bank_ifsc_or_routing?: string | null;
  base_salary_monthly: number;
  housing_allowance: number;
  travel_allowance: number;
  is_active: boolean;
  joined_date?: string | null;
  expense_account_id?: number | null;
  created_at: string;
}

export interface PayrollRecord {
  id: number;
  staff_id: number;
  staff_name?: string | null;
  staff_role?: string | null;
  pay_period: string;
  payment_date: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  payment_method: string;
  status: string;
  payslip_reference?: string | null;
  created_at: string;
}

// --- Church Activities & Events Calendar ---
export interface ChurchActivity {
  id: number;
  title: string;
  category: string; // 'Worship Service' | 'Prayer Meeting' | 'Bible Study' | 'Choir Practice' | 'Committee Meeting' | 'Youth Fellowship' | 'Community Outreach' | 'Special Conference' | 'Fellowship Gathering'
  activity_type: string; // 'Regular Weekly' | 'Monthly' | 'Special Event' | 'Annual'
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  organizer_name?: string | null;
  target_group: string;
  description?: string | null;
  is_recurring: boolean;
  recurrence_pattern?: string | null;
  contact_phone?: string | null;
  is_active: boolean;
  created_at: string;
}

// --- Milestone Certificates ---
export interface CertificateTemplate {
  id: number;
  type: string;
  title: string;
  scripture_verse?: string | null;
  header_text?: string | null;
  body_template: string;
  signatory_1_title: string;
  signatory_2_title: string;
  border_style: string;
}

export interface IssuedCertificate {
  id: number;
  certificate_number: string;
  certificate_type: string;
  member_id?: number | null;
  recipient_name: string;
  secondary_name?: string | null;
  issue_date: string;
  event_date: string;
  officiant_name: string;
  witness_1?: string | null;
  witness_2?: string | null;
  church_name: string;
  verification_code: string;
  notes?: string | null;
  pdf_file_url?: string | null;
  created_at: string;
}

// --- Mass Messaging ---
export interface MessageTemplate {
  id: number;
  name: string;
  category: string;
  channel: string;
  subject?: string | null;
  body_text: string;
  trai_dlt_template_id?: string | null;
  trai_dlt_entity_id?: string | null;
  trai_sender_header?: string | null;
  twilio_10dlc_campaign_id?: string | null;
  is_opt_out_appended: boolean;
  is_active: boolean;
  created_at: string;
}

export interface MessageLog {
  id: number;
  broadcast_id?: number | null;
  recipient_name: string;
  recipient_contact: string;
  channel: string;
  rendered_message: string;
  status: string;
  gateway_message_id?: string | null;
  error_message?: string | null;
  sent_at: string;
}

export interface MessageBroadcast {
  id: number;
  title: string;
  channel: string;
  target_group: string;
  template_id?: number | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  sent_at: string;
  created_at: string;
  logs: MessageLog[];
}

// --- Tax Compliance ---
export interface TaxReceipt {
  id: number;
  receipt_number: string;
  tax_regime: string;
  member_id?: number | null;
  donor_name: string;
  donor_pan_or_tax_id?: string | null;
  donor_address?: string | null;
  contribution_id?: number | null;
  amount: number;
  eligible_tax_amount: number;
  currency: string;
  financial_year: string;
  issue_date: string;
  authorized_signatory: string;
  church_tax_registration_no: string;
  pdf_download_url?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Form10BDEntry {
  sl_no: number;
  pre_acknowledgment_number: string;
  unique_donor_id_type: string;
  unique_donor_id_number: string;
  donor_name: string;
  donor_address?: string | null;
  donation_type: string;
  mode_of_receipt: string;
  amount_inr: number;
}

export interface Form10BDExportReport {
  church_pan: string;
  form_type: string;
  financial_year: string;
  total_donations_count: number;
  total_aggregate_amount: number;
  records: Form10BDEntry[];
}

export interface FCRALog {
  id: number;
  contribution_id?: number | null;
  donor_name: string;
  donor_country: string;
  foreign_currency: string;
  foreign_amount: number;
  inr_realized_amount: number;
  exchange_rate: number;
  fcra_designated_bank: string;
  fcra_purpose_code: string;
  remittance_date: string;
  firc_reference?: string | null;
  is_reported_in_fc4: boolean;
  created_at: string;
}

export interface UKGiftAidClaimReport {
  tax_year: string;
  total_gift_aid_donations: number;
  reclaim_rate_percent: number;
  total_tax_reclaim_amount: number;
  eligible_donors_count: number;
  donors: {
    member_id: number;
    donor_name: string;
    tax_id?: string | null;
    donation_total: number;
    gift_aid_reclaim_amount: number;
  }[];
}

// --- Church Profile, Customization & RBAC ---
export interface ChurchProfile {
  name: string;
  senior_pastor?: string;
  denomination?: string;
  motto?: string;
  established_year?: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  tax_id_in_80g?: string;
  pan_number?: string;
  fcra_registration_no?: string;
  us_ein?: string;
  uk_charity_number?: string;
  currency_in: string;
  currency_symbol_in: string;
  currency_global: string;
  currency_symbol_global: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}

export type LocalizationMode = 'IN' | 'GLOBAL';

export interface LocalizationConfig {
  active_mode: LocalizationMode;
  organization: ChurchProfile;
  modules: Record<string, boolean>;
  roles: RoleDefinition[];
  in_mode_settings: {
    payment_gateways: {
      razorpay_enabled: boolean;
      razorpay_key_id?: string;
      upi_enabled: boolean;
      upi_vpa?: string;
    };
    tax_and_compliance: {
      auto_80g_receipts: boolean;
      pan_mandatory_for_donations_above: number;
      form_10bd_export_enabled: boolean;
      fcra_split_ledger_enabled: boolean;
      gst_breakdown_enabled: boolean;
    };
    messaging: {
      sms_provider: string;
      trai_entity_id?: string;
      trai_header_id?: string;
      whatsapp_enabled: boolean;
    };
  };
  global_mode_settings: {
    payment_gateways: {
      stripe_enabled: boolean;
      stripe_publishable_key?: string;
      paypal_enabled: boolean;
      paypal_client_id?: string;
    };
    tax_and_compliance: {
      us_501c3_receipts: boolean;
      uk_gift_aid_claim_rate: number;
      eu_tax_receipts: boolean;
    };
    messaging: {
      sms_provider: string;
      twilio_10dlc_campaign_id?: string;
      gdpr_opt_out_link_mandatory: boolean;
      whatsapp_enabled: boolean;
    };
  };
}

export interface CsvImportResult {
  success: boolean;
  imported_members_count: number;
  imported_households_count: number;
  skipped_count: number;
  errors: string[];
  sample_records: string[];
}
