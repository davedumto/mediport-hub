"use client";

import { useState, useEffect, useCallback } from "react";
import { ConsentRecord, ConsentType, ConsentStatus } from "../types/consent";

export interface ConsentSummary {
  id: string;
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  status: ConsentStatus;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  consentVersion: string;
  legalBasis: string;
}

export interface ConsentManagementState {
  consents: ConsentSummary[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export interface UseConsentManagementOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export interface ConsentManagementActions {
  refreshConsents: () => Promise<void>;
  withdrawConsent: (consentType: ConsentType, reason: string) => Promise<void>;
  renewConsent: (consentType: ConsentType, newConsentText?: string) => Promise<void>;
  getConsentByType: (consentType: ConsentType) => ConsentSummary | undefined;
  isConsentGranted: (consentType: ConsentType) => boolean;
  isConsentExpired: (consentType: ConsentType) => boolean;
  getExpiringConsents: (daysThreshold?: number) => ConsentSummary[];
}

export function useConsentManagement(
  options: UseConsentManagementOptions
): ConsentManagementState & ConsentManagementActions {
  const { userId, autoRefresh = false, refreshInterval = 300 } = options;

  const [state, setState] = useState<ConsentManagementState>({
    consents: [],
    loading: true,
    error: null,
    refreshing: false,
  });

  const getConsentStatus = useCallback((consent: ConsentRecord): ConsentStatus => {
    if (consent.withdrawnAt) return ConsentStatus.WITHDRAWN;
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) return ConsentStatus.EXPIRED;
    if (consent.granted) return ConsentStatus.GRANTED;
    return ConsentStatus.PENDING;
  }, []);

  const transformConsentData = useCallback((consents: ConsentRecord[]): ConsentSummary[] => {
    return consents.map(consent => ({
      id: consent.id,
      consentType: consent.consentType,
      purpose: consent.purpose,
      granted: consent.granted,
      status: getConsentStatus(consent),
      grantedAt: consent.grantedAt ? new Date(consent.grantedAt) : undefined,
      withdrawnAt: consent.withdrawnAt ? new Date(consent.withdrawnAt) : undefined,
      expiresAt: consent.expiresAt ? new Date(consent.expiresAt) : undefined,
      consentVersion: consent.consentVersion,
      legalBasis: consent.legalBasis,
    }));
  }, [getConsentStatus]);

  const fetchConsents = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setState(prev => ({ ...prev, refreshing: true, error: null }));
      } else {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const response = await fetch(`/api/consent/manage?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consent data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const consents = transformConsentData(data.consentHistory || []);

      setState(prev => ({
        ...prev,
        consents,
        loading: false,
        refreshing: false,
        error: null,
      }));
    } catch (error) {
      console.error("Error fetching consents:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : "Failed to fetch consent data",
      }));
    }
  }, [userId, transformConsentData]);

  const refreshConsents = useCallback(async () => {
    await fetchConsents(true);
  }, [fetchConsents]);

  const withdrawConsent = useCallback(async (consentType: ConsentType, reason: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const response = await fetch("/api/consent/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          consentType,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Failed to withdraw consent: ${response.status}`);
      }

      // Refresh consents after withdrawal
      await refreshConsents();
    } catch (error) {
      console.error("Error withdrawing consent:", error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to withdraw consent",
      }));
      throw error; // Re-throw for component handling
    }
  }, [userId, refreshConsents]);

  const renewConsent = useCallback(async (consentType: ConsentType, newConsentText?: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const response = await fetch("/api/consent/manage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          consentType,
          newConsentText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Failed to renew consent: ${response.status}`);
      }

      // Refresh consents after renewal
      await refreshConsents();
    } catch (error) {
      console.error("Error renewing consent:", error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to renew consent",
      }));
      throw error; // Re-throw for component handling
    }
  }, [userId, refreshConsents]);

  const getConsentByType = useCallback((consentType: ConsentType): ConsentSummary | undefined => {
    return state.consents.find(consent => consent.consentType === consentType);
  }, [state.consents]);

  const isConsentGranted = useCallback((consentType: ConsentType): boolean => {
    const consent = getConsentByType(consentType);
    return consent?.status === ConsentStatus.GRANTED || false;
  }, [getConsentByType]);

  const isConsentExpired = useCallback((consentType: ConsentType): boolean => {
    const consent = getConsentByType(consentType);
    return consent?.status === ConsentStatus.EXPIRED || false;
  }, [getConsentByType]);

  const getExpiringConsents = useCallback((daysThreshold = 30): ConsentSummary[] => {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));

    return state.consents.filter(consent => {
      if (consent.status !== ConsentStatus.GRANTED || !consent.expiresAt) {
        return false;
      }
      return consent.expiresAt <= thresholdDate && consent.expiresAt > now;
    });
  }, [state.consents]);

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchConsents();
    }
  }, [userId, fetchConsents]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      refreshConsents();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, userId, refreshConsents]);

  return {
    // State
    consents: state.consents,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    // Actions
    refreshConsents,
    withdrawConsent,
    renewConsent,
    getConsentByType,
    isConsentGranted,
    isConsentExpired,
    getExpiringConsents,
  };
}

// Utility hook for consent template management
export function useConsentTemplates() {
  const [templates, setTemplates] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplate = useCallback(async (type?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = type ? `/api/consent/templates?type=${type}` : "/api/consent/templates";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch consent templates: ${response.status}`);
      }

      const data = await response.json();
      setTemplates(data.templates || data.template);
    } catch (err) {
      console.error("Error fetching consent templates:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplate = useCallback((type: string) => {
    if (!templates) return null;
    return templates[type] || null;
  }, [templates]);

  return {
    templates,
    loading,
    error,
    fetchTemplate,
    getTemplate,
  };
}

// Export types for external use
export type { ConsentManagementState, ConsentManagementActions, UseConsentManagementOptions };