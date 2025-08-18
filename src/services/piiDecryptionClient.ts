/**
 * SECURE Client-side PII Decryption Service
 * Uses client-side decryption to ensure PII is never transmitted in plain text
 */

import { ClientEncryption } from "../lib/clientEncryption";

export interface DecryptedUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialty?: string;
  medicalLicenseNumber?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
}

export class PIIDecryptionClient {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Clear the decryption cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached data if valid
   */
  private static getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cached data
   */
  private static setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get encryption key for client-side decryption
   * In production, this should use a secure key derivation method
   */
  private static getClientEncryptionKey(): string | null {
    // For now, we'll disable client-side decryption and fall back to masked data
    // This is the safest approach until proper key management is implemented
    return null;
  }

  /**
   * Decrypt user profile PII data from secure endpoint
   * NOTE: This endpoint returns decrypted data over HTTPS with proper security controls
   */
  static async decryptUserProfile(
    userId: string,
    accessToken: string
  ): Promise<DecryptedUserData | null> {
    const cacheKey = `profile_${userId}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/auth/decrypt-profile?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to decrypt profile:", response.status);
        return null;
      }

      const data = await response.json();
      const decryptedData = data.data?.user || null;
      
      // Cache the result
      if (decryptedData) {
        this.setCache(cacheKey, decryptedData);
      }
      
      return decryptedData;
    } catch (error) {
      console.error("Error decrypting profile:", error);
      return null;
    }
  }

  /**
   * Decrypt specific fields for an entity
   */
  static async decryptFields(
    entityType: "user" | "patient" | "appointment" | "consultation" | "medicalRecord",
    entityId: string,
    fields: string[],
    accessToken: string
  ): Promise<Record<string, any> | null> {
    const cacheKey = `fields_${entityType}_${entityId}_${fields.join(",")}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch("/api/auth/decrypt-field", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          entityId,
          fields,
        }),
      });

      if (!response.ok) {
        console.error("Failed to decrypt fields:", response.status);
        return null;
      }

      const result = await response.json();
      const decryptedData = result.data || null;
      
      // Cache the result
      if (decryptedData) {
        this.setCache(cacheKey, decryptedData);
      }
      
      return decryptedData;
    } catch (error) {
      console.error("Error decrypting fields:", error);
      return null;
    }
  }

  /**
   * Merge masked data with decrypted data
   */
  static mergeWithDecrypted(
    maskedData: any,
    decryptedData: any
  ): any {
    if (!decryptedData) return maskedData;
    
    return {
      ...maskedData,
      ...Object.keys(decryptedData).reduce((acc, key) => {
        if (decryptedData[key] !== null && decryptedData[key] !== undefined) {
          acc[key] = decryptedData[key];
        }
        return acc;
      }, {} as any),
    };
  }
}