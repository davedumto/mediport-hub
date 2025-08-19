import { ConsentRecord, ConsentType, ConsentRecordCreate, ConsentRecordUpdate } from "../types/consent";

export interface ConsentHistoryResponse {
  consentHistory: ConsentRecord[];
}

export interface ConsentTemplateResponse {
  template?: {
    title: string;
    text: string;
    version: string;
    legalBasis: string;
  };
  templates?: Record<string, {
    title: string;
    text: string;
    version: string;
    legalBasis: string;
  }>;
}

export interface WithdrawConsentRequest {
  userId: string;
  consentType: ConsentType;
  reason: string;
}

export interface RenewConsentRequest {
  userId: string;
  consentType: ConsentType;
  newConsentText?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ConsentApiService {
  private baseUrl = "/api/consent";

  /**
   * Fetch consent history for a specific user
   */
  async getConsentHistory(userId: string): Promise<ConsentHistoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/manage?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consent history: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching consent history:", error);
      throw error;
    }
  }

  /**
   * Withdraw consent for a specific type
   */
  async withdrawConsent(request: WithdrawConsentRequest): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/manage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to withdraw consent: ${response.status}`);
      }

      return {
        success: true,
        message: data.message || "Consent withdrawn successfully",
      };
    } catch (error) {
      console.error("Error withdrawing consent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to withdraw consent",
      };
    }
  }

  /**
   * Renew consent for a specific type
   */
  async renewConsent(request: RenewConsentRequest): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/manage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to renew consent: ${response.status}`);
      }

      return {
        success: true,
        message: data.message || "Consent renewed successfully",
      };
    } catch (error) {
      console.error("Error renewing consent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to renew consent",
      };
    }
  }

  /**
   * Get consent templates
   */
  async getConsentTemplates(): Promise<ConsentTemplateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consent templates: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching consent templates:", error);
      throw error;
    }
  }

  /**
   * Get a specific consent template by type
   */
  async getConsentTemplate(type: string): Promise<ConsentTemplateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/templates?type=${encodeURIComponent(type)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consent template: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching consent template:", error);
      throw error;
    }
  }

  /**
   * Batch withdrawal of multiple consents
   */
  async withdrawMultipleConsents(requests: WithdrawConsentRequest[]): Promise<ApiResponse<{ 
    successful: ConsentType[]; 
    failed: Array<{ consentType: ConsentType; error: string }>;
  }>> {
    const successful: ConsentType[] = [];
    const failed: Array<{ consentType: ConsentType; error: string }> = [];

    for (const request of requests) {
      try {
        const result = await this.withdrawConsent(request);
        if (result.success) {
          successful.push(request.consentType);
        } else {
          failed.push({
            consentType: request.consentType,
            error: result.error || "Unknown error",
          });
        }
      } catch (error) {
        failed.push({
          consentType: request.consentType,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: failed.length === 0,
      data: { successful, failed },
      message: failed.length === 0 
        ? `Successfully withdrew ${successful.length} consents`
        : `Withdrew ${successful.length} consents, ${failed.length} failed`,
    };
  }

  /**
   * Check if user has granted specific consent types
   */
  async checkConsentStatus(userId: string, consentTypes: ConsentType[]): Promise<Record<ConsentType, boolean>> {
    try {
      const history = await this.getConsentHistory(userId);
      const consentMap: Record<ConsentType, boolean> = {} as any;

      // Initialize all requested types as false
      consentTypes.forEach(type => {
        consentMap[type] = false;
      });

      // Check each consent in history
      history.consentHistory?.forEach(consent => {
        if (consentTypes.includes(consent.consentType)) {
          // Consider consent granted if:
          // 1. It's granted
          // 2. Not withdrawn
          // 3. Not expired
          const isGranted = consent.granted && 
            !consent.withdrawnAt && 
            (!consent.expiresAt || new Date(consent.expiresAt) > new Date());
          
          consentMap[consent.consentType] = isGranted;
        }
      });

      return consentMap;
    } catch (error) {
      console.error("Error checking consent status:", error);
      throw error;
    }
  }

  /**
   * Get consents expiring within specified days
   */
  async getExpiringConsents(userId: string, daysThreshold = 30): Promise<ConsentRecord[]> {
    try {
      const history = await this.getConsentHistory(userId);
      const now = new Date();
      const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));

      return history.consentHistory?.filter(consent => {
        if (!consent.granted || consent.withdrawnAt || !consent.expiresAt) {
          return false;
        }
        
        const expiresAt = new Date(consent.expiresAt);
        return expiresAt <= thresholdDate && expiresAt > now;
      }) || [];
    } catch (error) {
      console.error("Error getting expiring consents:", error);
      throw error;
    }
  }

  /**
   * Format consent type for display
   */
  formatConsentType(type: ConsentType): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get consent status string
   */
  getConsentStatusString(consent: ConsentRecord): string {
    if (consent.withdrawnAt) return "WITHDRAWN";
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) return "EXPIRED";
    if (consent.granted) return "GRANTED";
    return "PENDING";
  }

  /**
   * Calculate compliance score for a user
   */
  async calculateComplianceScore(userId: string, requiredConsents: ConsentType[] = []): Promise<{
    score: number;
    total: number;
    granted: number;
    missing: ConsentType[];
  }> {
    try {
      // Use default required consents if none provided
      const defaultRequired = [
        ConsentType.DATA_PROCESSING,
        ConsentType.PRIVACY_POLICY,
      ];
      
      const required = requiredConsents.length > 0 ? requiredConsents : defaultRequired;
      const consentStatus = await this.checkConsentStatus(userId, required);
      
      const granted = Object.values(consentStatus).filter(status => status).length;
      const missing = Object.entries(consentStatus)
        .filter(([_, status]) => !status)
        .map(([type, _]) => type as ConsentType);

      const score = Math.round((granted / required.length) * 100);

      return {
        score,
        total: required.length,
        granted,
        missing,
      };
    } catch (error) {
      console.error("Error calculating compliance score:", error);
      throw error;
    }
  }

  /**
   * Validate consent data before submission
   */
  validateConsentData(data: ConsentRecordCreate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.userId?.trim()) {
      errors.push("User ID is required");
    }

    if (!data.consentType) {
      errors.push("Consent type is required");
    }

    if (!data.purpose?.trim()) {
      errors.push("Purpose is required");
    }

    if (!data.consentText?.trim()) {
      errors.push("Consent text is required");
    }

    if (!data.consentVersion?.trim()) {
      errors.push("Consent version is required");
    }

    if (!data.legalBasis) {
      errors.push("Legal basis is required");
    }

    if (!data.ipAddress?.trim()) {
      errors.push("IP address is required");
    }

    if (!data.userAgent?.trim()) {
      errors.push("User agent is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const consentApi = new ConsentApiService();

// Export the class for advanced usage
export default ConsentApiService;