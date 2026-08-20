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
  tax_compliance: true,
  attendance_checkin: true,
  ministries_groups: true,
  pastoral_care: true,
  csv_migration: true,
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
  const currencySymbol = isIndia ? churchProfile.currency_symbol_in || '₹' : churchProfile.currency_symbol_global || '$';

  const formatCurrency = (amount: number) => {
    if (isIndia) {
      return `${currencySymbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
