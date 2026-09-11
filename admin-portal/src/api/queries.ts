import { QueryClient, useQuery } from '@tanstack/react-query';
import { api } from './client';
import {
  Contribution,
  DashboardData,
  Event,
  Expense,
  FinanceSummary,
  Household,
  Member,
  Ministry,
  PledgeCampaign,
} from '../types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // Data fresh for 1 minute
      gcTime: 300_000, // Cache persisted in memory for 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  members: ['members'] as const,
  households: ['households'] as const,
  ministries: ['ministries'] as const,
  events: ['events'] as const,
  finances: {
    all: ['finances'] as const,
    summary: ['finances', 'summary'] as const,
    contributions: ['finances', 'contributions'] as const,
    expenses: ['finances', 'expenses'] as const,
    campaigns: ['finances', 'campaigns'] as const,
  },
};

// --- Query Hooks ---

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.getDashboardStats(),
  });
}

export function useMembers() {
  return useQuery<Member[]>({
    queryKey: queryKeys.members,
    queryFn: () => api.getMembers(),
  });
}

export function useHouseholds() {
  return useQuery<Household[]>({
    queryKey: queryKeys.households,
    queryFn: () => api.getHouseholds(),
  });
}

export function useMinistries() {
  return useQuery<Ministry[]>({
    queryKey: queryKeys.ministries,
    queryFn: () => api.getMinistries(),
  });
}

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: queryKeys.events,
    queryFn: () => api.getEvents(),
  });
}

export function useFinanceSummary() {
  return useQuery<FinanceSummary>({
    queryKey: queryKeys.finances.summary,
    queryFn: () => api.getFinanceSummary(),
  });
}

export function useContributions() {
  return useQuery<Contribution[]>({
    queryKey: queryKeys.finances.contributions,
    queryFn: () => api.getContributions(),
  });
}

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: queryKeys.finances.expenses,
    queryFn: () => api.getExpenses(),
  });
}

export function useCampaigns() {
  return useQuery<PledgeCampaign[]>({
    queryKey: queryKeys.finances.campaigns,
    queryFn: () => api.getPledgeCampaigns(),
  });
}

// Composite hook for financial section
export function useFinances() {
  const summaryQuery = useFinanceSummary();
  const contributionsQuery = useContributions();
  const expensesQuery = useExpenses();
  const campaignsQuery = useCampaigns();

  const isLoading =
    summaryQuery.isLoading ||
    contributionsQuery.isLoading ||
    expensesQuery.isLoading ||
    campaignsQuery.isLoading;

  return {
    summary: summaryQuery.data || null,
    contributions: contributionsQuery.data || [],
    expenses: expensesQuery.data || [],
    campaigns: campaignsQuery.data || [],
    isLoading,
    refetchAll: () => {
      summaryQuery.refetch();
      contributionsQuery.refetch();
      expensesQuery.refetch();
      campaignsQuery.refetch();
    },
  };
}

// --- Targeted Cache Invalidation Helpers ---

export function invalidateDashboard() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
}

export function invalidateMembers() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.members }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

export function invalidateHouseholds() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.households });
}

export function invalidateMinistries() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.ministries });
}

export function invalidateEvents() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.events });
}

export function invalidateFinances() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.finances.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

export function invalidateAllQueries() {
  return queryClient.invalidateQueries();
}
