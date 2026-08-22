import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { ChurchProfile, LocalizationConfig, LocalizationMode, RoleDefinition } from '../types';

interface LocalizationContextType {
  mode: LocalizationMode;
  config: LocalizationConfig | null;
  churchProfile: ChurchProfile;
  modules: Record<string, boolean>;
  roles: RoleDefinition[];
  currentRole: string;
  loading: boolean;
  currencySymbol: string;
  isIndia: boolean;
  formatCurrency: (amount: number) => string;
  toggleMode: (targetMode?: LocalizationMode) => Promise<void>;
  updateChurchProfile: (profile: Partial<ChurchProfile>) => Promise<void>;
  toggleModule: (moduleKey: string, enabled: boolean) => Promise<void>;
  setCurrentRole: (roleId: string) => void;
  hasPermission: (permission: string) => boolean;
  saveRole: (role: Partial<RoleDefinition>) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
}

export const WORLD_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', locale: 'en-NZ' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', locale: 'en-ZA' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬', locale: 'en-NG' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪', locale: 'en-KE' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', flag: '🇬🇭', locale: 'en-GH' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬', locale: 'en-UG' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿', locale: 'en-TZ' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', locale: 'en-SG' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', locale: 'ms-MY' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭', locale: 'en-PH' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', locale: 'id-ID' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', locale: 'th-TH' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳', locale: 'vi-VN' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', locale: 'ko-KR' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰', locale: 'zh-HK' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', locale: 'ar-AE' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', flag: '🇶🇦', locale: 'ar-QA' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', flag: '🇰🇼', locale: 'ar-KW' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', flag: '🇲🇽', locale: 'es-MX' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', flag: '🇨🇴', locale: 'es-CO' },
  { code: 'ARS', symbol: 'ARS$', name: 'Argentine Peso', flag: '🇦🇷', locale: 'es-AR' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', flag: '🇨🇱', locale: 'es-CL' },
  { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol', flag: '🇵🇪', locale: 'es-PE' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', locale: 'de-CH' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴', locale: 'nb-NO' },
  { code: 'DKK', symbol: 'kr.', name: 'Danish Krone', flag: '🇩🇰', locale: 'da-DK' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱', locale: 'pl-PL' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', locale: 'tr-TR' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬', locale: 'ar-EG' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱', locale: 'he-IL' },
];

const defaultProfile: ChurchProfile = {
  name: "Ecclesia Church",
  senior_pastor: "Pastor Dr. Samuel Thomas",
  denomination: "Ecumenical & Anglican Communion",
  motto: "Worship • Community • Discipleship",
  established_year: 1985,
  address: "12 Cathedral Road, Bangalore, KA 560001",
  city: "Bangalore",
  state: "KA",
  postal_code: "560001",
  country: "India",
  email: "office@ecclesia-church.org",
  phone: "+91 80 2345 6789",
  website: "https://ecclesia-church.org",
  currency_in: "INR",
  currency_symbol_in: "₹",
  currency_global: "USD",
  currency_symbol_global: "$",
};

const defaultModules: Record<string, boolean> = {
  double_entry_ledger: true,
  payroll_staff_ledger: true,
  giving_and_pledges: true,
  church_activities_calendar: true,
  pdf_certificates: true,
  mass_messaging: true,
  tax_compliance: false, // Dev preview only
  attendance_checkin: true,
  ministries_groups: true,
  pastoral_care: true,
  csv_migration: true,
  demo_data_seeding: false,
  quick_test_logins: false, // Disabled by default for public downloads
};

const defaultLocalizationContext: LocalizationContextType = {
  mode: 'IN',
  config: null,
  churchProfile: defaultProfile,
  modules: defaultModules,
  roles: [],
  currentRole: 'super_admin',
  loading: true,
  currencySymbol: '₹',
  isIndia: true,
  formatCurrency: (amount: number) => `₹${amount.toLocaleString('en-IN')}`,
  toggleMode: async () => {},
  updateChurchProfile: async () => {},
  toggleModule: async () => {},
  setCurrentRole: () => {},
  hasPermission: () => true,
  saveRole: async () => {},
  deleteRole: async () => {},
  refreshConfig: async () => {},
};

const LocalizationContext = createContext<LocalizationContextType>(defaultLocalizationContext);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<LocalizationConfig | null>(null);
  const [mode, setMode] = useState<LocalizationMode>(() => {
    const savedMode = localStorage.getItem('ecclesia_localization_mode') as LocalizationMode;
    return savedMode || 'IN';
  });
  const [churchProfile, setChurchProfile] = useState<ChurchProfile>(() => {
    try {
      const savedProfile = localStorage.getItem('ecclesia_church_profile');
      if (savedProfile) return JSON.parse(savedProfile);
    } catch (e) {
      console.error('Failed to parse saved church profile:', e);
    }
    return defaultProfile;
  });
  const [modules, setModules] = useState<Record<string, boolean>>(defaultModules);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [currentRole, setCurrentRole] = useState<string>('super_admin');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getLocalizationConfig();
      setConfig(data);
      if (data.active_mode) {
        setMode(data.active_mode);
        localStorage.setItem('ecclesia_localization_mode', data.active_mode);
      }
      if (data.organization) {
        setChurchProfile(data.organization);
        localStorage.setItem('ecclesia_church_profile', JSON.stringify(data.organization));
      }
      if (data.modules) setModules(data.modules);
      if (data.roles) setRoles(data.roles);
    } catch (err) {
      console.warn('Failed to load localization config from backend, using cached/default values', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const toggleMode = async (targetMode?: LocalizationMode) => {
    const nextMode = targetMode || (mode === 'IN' ? 'GLOBAL' : 'IN');
    setMode(nextMode);
    localStorage.setItem('ecclesia_localization_mode', nextMode);
    try {
      const updatedConfig = await api.toggleLocalizationMode(nextMode);
      setConfig(updatedConfig);
      setMode(updatedConfig.active_mode);
      localStorage.setItem('ecclesia_localization_mode', updatedConfig.active_mode);
    } catch (err) {
      console.error('Failed to toggle localization mode on backend:', err);
    }
  };

  const updateChurchProfile = async (profile: Partial<ChurchProfile>) => {
    const merged = { ...churchProfile, ...profile };
    setChurchProfile(merged);
    localStorage.setItem('ecclesia_church_profile', JSON.stringify(merged));
    try {
      const updatedConfig = await api.updateChurchProfile(profile);
      setConfig(updatedConfig);
      if (updatedConfig.organization) {
        setChurchProfile(updatedConfig.organization);
        localStorage.setItem('ecclesia_church_profile', JSON.stringify(updatedConfig.organization));
      }
    } catch (err) {
      console.error('Failed to update church profile on backend:', err);
    }
  };

  const toggleModule = async (moduleKey: string, enabled: boolean) => {
    try {
      const updatedConfig = await api.toggleModule(moduleKey, enabled);
      setConfig(updatedConfig);
      if (updatedConfig.modules) setModules(updatedConfig.modules);
    } catch (err) {
      console.error('Failed to toggle module:', err);
      setModules((prev) => ({ ...prev, [moduleKey]: enabled }));
    }
  };

  const saveRole = async (role: Partial<RoleDefinition>) => {
    try {
      const updatedConfig = await api.saveRole(role);
      setConfig(updatedConfig);
      if (updatedConfig.roles) setRoles(updatedConfig.roles);
    } catch (err) {
      console.error('Failed to save role:', err);
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const updatedConfig = await api.deleteRole(roleId);
      setConfig(updatedConfig);
      if (updatedConfig.roles) setRoles(updatedConfig.roles);
    } catch (err) {
      console.error('Failed to delete role:', err);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (currentRole === 'super_admin') return true;
    const activeRoleObj = roles.find((r) => r.id === currentRole);
    if (!activeRoleObj) return true;
    return activeRoleObj.permissions.includes(permission);
  };

  const isIndia = mode === 'IN';
  const activeCurrencyCode = isIndia
    ? churchProfile.currency_in || 'INR'
    : churchProfile.currency_global || 'USD';

  const activeCurrency = WORLD_CURRENCIES.find((c) => c.code === activeCurrencyCode);
  const currencySymbol = isIndia
    ? churchProfile.currency_symbol_in || activeCurrency?.symbol || '₹'
    : churchProfile.currency_symbol_global || activeCurrency?.symbol || '$';

  const formatCurrency = (amount: number, customCode?: string) => {
    const code = customCode || activeCurrencyCode;
    const cur = WORLD_CURRENCIES.find((c) => c.code === code);
    const sym = cur ? cur.symbol : (isIndia ? '₹' : '$');
    const loc = cur ? cur.locale : (isIndia ? 'en-IN' : 'en-US');
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'UGX', 'VND', 'IDR', 'CLP', 'PYG'];
    const maxDigits = zeroDecimalCurrencies.includes(code) ? 0 : isIndia ? 0 : 2;
    const minDigits = zeroDecimalCurrencies.includes(code) ? 0 : isIndia ? 0 : 2;
    return `${sym}${Number(amount || 0).toLocaleString(loc, { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })}`;
  };

  return (
    <LocalizationContext.Provider
      value={{
        mode,
        config,
        churchProfile,
        modules,
        roles,
        currentRole,
        loading,
        currencySymbol,
        isIndia,
        formatCurrency,
        toggleMode,
        updateChurchProfile,
        toggleModule,
        setCurrentRole,
        hasPermission,
        saveRole,
        deleteRole,
        refreshConfig: fetchConfig,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
