import { NextRequest, NextResponse } from "next/server";
import { PIIProtectionService } from "../services/piiProtectionService";
import logger from "../lib/logger";

export interface EncryptionMiddlewareConfig {
  enablePIIProtection?: boolean;
  maskingLevel?: "full" | "partial" | "none";
  includeAuditLog?: boolean;
  excludeFields?: string[];
}

/**
 * Middleware to handle PII encryption/decryption for API responses
 */
export function withEncryptionMiddleware<T extends (...args: any[]) => any>(
  handler: T,
  config: EncryptionMiddlewareConfig = {}
): T {
  const {
    enablePIIProtection = true,
    maskingLevel = "partial",
    includeAuditLog = false,
    excludeFields = [],
  } = config;

  return (async (request: NextRequest, ...args: any[]) => {
    try {
      // Initialize PII protection service
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (enablePIIProtection && !encryptionKey) {
        logger.error("Encryption key not configured for PII protection");
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "System configuration error",
          },
          { status: 500 }
        );
      }

      if (encryptionKey) {
        PIIProtectionService.initialize(encryptionKey);
      }

      // Call the original handler
      const response = await handler(request, ...args);

      // If PII protection is disabled, return the original response
      if (!enablePIIProtection) {
        return response;
      }

      // Only process JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        return response;
      }

      // Parse the response body
      const responseData = await response.json();

      // Process PII fields in the response
      const protectedData = processResponseData(
        responseData,
        maskingLevel,
        excludeFields
      );

      // Log PII access if configured
      if (includeAuditLog) {
        logPIIAccess(request, protectedData);
      }

      // Return the protected response
      return NextResponse.json(protectedData, {
        status: response.status,
        headers: response.headers,
      });
    } catch (error) {
      logger.error("Encryption middleware error:", error);
      
      // If there's an error in the middleware, call the handler directly
      return handler(request, ...args);
    }
  }) as T;
}

/**
 * Process response data to protect PII
 */
function processResponseData(
  data: any,
  maskingLevel: string,
  excludeFields: string[]
): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  // Define PII field patterns
  const piiFieldPatterns = [
    /email/i,
    /phone/i,
    /firstName/i,
    /lastName/i,
    /address/i,
    /ssn/i,
    /licenseNumber/i,
    /passport/i,
    /creditCard/i,
    /bankAccount/i,
  ];

  // Define sensitive fields that should always be removed
  const sensitiveFields = [
    "passwordHash",
    "mfaSecret",
    "passwordHistory",
    "refreshToken",
    "sessionToken",
    "apiKey",
    "secretKey",
    "privateKey",
  ];

  // Recursive function to process nested objects
  function processObject(obj: any, path: string = ""): any {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        processObject(item, `${path}[${index}]`)
      );
    }

    if (obj && typeof obj === "object" && !(obj instanceof Date)) {
      const processed: any = {};

      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;

        // Skip excluded fields
        if (excludeFields.includes(key)) {
          processed[key] = value;
          continue;
        }

        // Remove sensitive fields completely
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          continue; // Skip this field entirely
        }

        // Check if field contains PII
        const isPIIField = piiFieldPatterns.some(pattern => pattern.test(key));

        if (isPIIField && value) {
          // Apply masking based on level
          if (maskingLevel === "full") {
            processed[key] = "[REDACTED]";
          } else if (maskingLevel === "partial") {
            processed[key] = maskValue(value, key);
          } else {
            processed[key] = value;
          }
        } else {
          // Recursively process nested objects
          processed[key] = processObject(value, fieldPath);
        }
      }

      return processed;
    }

    return obj;
  }

  return processObject(data);
}

/**
 * Mask PII value based on field type
 */
function maskValue(value: any, fieldName: string): string {
  if (!value || typeof value !== "string") {
    return String(value);
  }

  const lowerFieldName = fieldName.toLowerCase();

  // Email masking
  if (lowerFieldName.includes("email")) {
    const parts = value.split("@");
    if (parts.length === 2) {
      const username = parts[0];
      const domain = parts[1];
      const maskedUsername = username.length > 2 
        ? username[0] + "*".repeat(username.length - 2) + username[username.length - 1]
        : "*".repeat(username.length);
      return `${maskedUsername}@${domain}`;
    }
  }

  // Phone masking
  if (lowerFieldName.includes("phone")) {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 10) {
      return `***-***-${digits.slice(-4)}`;
    }
  }

  // Name masking
  if (lowerFieldName.includes("name")) {
    return value.length > 1 
      ? value[0] + "*".repeat(Math.min(value.length - 1, 5))
      : "*";
  }

  // Address masking
  if (lowerFieldName.includes("address")) {
    return "[Address Protected]";
  }

  // License/ID masking
  if (lowerFieldName.includes("license") || lowerFieldName.includes("ssn")) {
    return value.length > 4 
      ? "*".repeat(value.length - 4) + value.slice(-4)
      : "*".repeat(value.length);
  }

  // Default masking for other PII
  return value.length > 4
    ? value.substring(0, 2) + "*".repeat(Math.min(value.length - 4, 10)) + value.slice(-2)
    : "*".repeat(value.length);
}

/**
 * Log PII access for audit purposes
 */
function logPIIAccess(request: NextRequest, data: any): void {
  try {
    const accessedFields: string[] = [];
    
    // Extract accessed PII fields
    function extractFields(obj: any, path: string = ""): void {
      if (!obj || typeof obj !== "object") return;
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        
        if (key.toLowerCase().includes("email") ||
            key.toLowerCase().includes("phone") ||
            key.toLowerCase().includes("name") ||
            key.toLowerCase().includes("address")) {
          accessedFields.push(fieldPath);
        }
        
        if (value && typeof value === "object") {
          extractFields(value, fieldPath);
        }
      }
    }
    
    extractFields(data);
    
    if (accessedFields.length > 0) {
      logger.info("PII fields accessed in response", {
        path: request.nextUrl.pathname,
        method: request.method,
        fields: accessedFields,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error("Failed to log PII access:", error);
  }
}

export default withEncryptionMiddleware;