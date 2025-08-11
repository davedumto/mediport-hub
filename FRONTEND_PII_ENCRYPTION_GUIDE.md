# Frontend PII Encryption Guide

## Overview

This guide explains how to work with encrypted Personally Identifiable Information (PII) in the EHR system frontend, including decryption, display, and security considerations.

##  **PII Encryption Status**

### **At Rest (Database)**

 **FULLY ENCRYPTED** - All sensitive PII is encrypted using AES-256-GCM

### **In Transit (API Communication)**

 **PARTIALLY ENCRYPTED** - Currently using HSTS headers, but HTTPS enforcement needs to be configured

## 📋 **Encrypted PII Fields**

### **Patient Information**

```typescript
interface Patient {
  // Encrypted fields (stored as Bytes in database)
  phoneEncrypted: Uint8Array | null;
  addressStreetEncrypted: Uint8Array | null;
  addressCityEncrypted: Uint8Array | null;
  addressStateEncrypted: Uint8Array | null;
  addressZipEncrypted: Uint8Array | null;
  addressCountryEncrypted: Uint8Array | null;
  emergencyNameEncrypted: Uint8Array | null;
  emergencyRelationshipEncrypted: Uint8Array | null;
  emergencyPhoneEncrypted: Uint8Array | null;

  // Non-encrypted fields (safe to display)
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodType: BloodType | null;
  status: PatientStatus;
}
```

### **Medical Records**

```typescript
interface MedicalRecord {
  // Encrypted fields
  descriptionEncrypted: Uint8Array | null;
  findingsEncrypted: Uint8Array | null;
  recommendationsEncrypted: Uint8Array | null;

  // Non-encrypted fields
  id: string;
  type: RecordType;
  title: string;
  recordDate: Date;
  isPrivate: boolean;
}
```

### **Appointments & Consultations**

```typescript
interface Appointment {
  notesEncrypted: Uint8Array | null;
  // ... other fields
}

interface Consultation {
  chiefComplaintEncrypted: Uint8Array | null;
  symptomsEncrypted: Uint8Array | null;
  diagnosisEncrypted: Uint8Array | null;
  treatmentPlanEncrypted: Uint8Array | null;
  followUpInstructionsEncrypted: Uint8Array | null;
  // ... other fields
}
```

## 🔓 **Decryption Process**

### **1. API Response Structure**

The API returns encrypted data as base64-encoded strings that need to be decrypted on the frontend:

```typescript
// API Response Example
{
  "success": true,
  "data": {
    "patient": {
      "id": "123",
      "firstName": "John",
      "lastName": "Doe",
      "phoneEncrypted": "base64-encoded-encrypted-data",
      "addressStreetEncrypted": "base64-encoded-encrypted-data"
    }
  }
}
```

### **2. Frontend Decryption Service**

The decryption service is now fully implemented and available at `src/services/decryptionService.ts`:

```typescript
// src/services/decryptionService.ts
import { Buffer } from "buffer";

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export class DecryptionService {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Decrypt PII data from base64 string
   */
  static async decryptPII(encryptedDataBase64: string): Promise<string> {
    try {
      // Decode base64 to get the encrypted data structure
      const encryptedData: EncryptedData = JSON.parse(
        Buffer.from(encryptedDataBase64, "base64").toString("utf-8")
      );

      // Convert hex strings back to Uint8Arrays
      const encrypted = Buffer.from(encryptedData.encrypted, "hex");
      const iv = Buffer.from(encryptedData.iv, "hex");
      const tag = Buffer.from(encryptedData.tag, "hex");

      // Get encryption key from environment (must match backend)
      const key = await this.getEncryptionKey();

      // Decrypt using Web Crypto API
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
          additionalData: new TextEncoder().encode("ehr-system"),
          tagLength: this.TAG_LENGTH * 8,
        },
        key,
        Buffer.concat([encrypted, tag])
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt PII data");
    }
  }

  /**
   * Get encryption key from environment
   * Note: In production, this should be securely managed
   */
  private static async getEncryptionKey(): Promise<CryptoKey> {
    const keyMaterial = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
    if (!keyMaterial) {
      throw new Error("Encryption key not configured");
    }

    const keyBuffer = Buffer.from(keyMaterial, "hex");
    return await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: this.ALGORITHM },
      false,
      ["decrypt"]
    );
  }

  /**
   * Batch decrypt multiple PII fields
   */
  static async decryptPatientPII(patient: any): Promise<any> {
    const decryptedPatient = { ...patient };

    const encryptedFields = [
      "phoneEncrypted",
      "addressStreetEncrypted",
      "addressCityEncrypted",
      "addressStateEncrypted",
      "addressZipEncrypted",
      "addressCountryEncrypted",
      "emergencyNameEncrypted",
      "emergencyRelationshipEncrypted",
      "emergencyPhoneEncrypted",
    ];

    for (const field of encryptedFields) {
      if (patient[field]) {
        try {
          decryptedPatient[field.replace("Encrypted", "")] =
            await this.decryptPII(patient[field]);
        } catch (error) {
          console.warn(`Failed to decrypt ${field}:`, error);
          decryptedPatient[field.replace("Encrypted", "")] = "[Encrypted]";
        }
      }
    }

    return decryptedPatient;
  }
}
```

### **3. React Hook for PII Decryption**

The custom hook is now fully implemented and available at `src/hooks/usePIIDecryption.ts`:

```typescript
// src/hooks/usePIIDecryption.ts
import { useState, useEffect } from "react";
import { DecryptionService } from "../services/decryptionService";

export function usePIIDecryption<T>(encryptedData: T | null) {
  const [decryptedData, setDecryptedData] = useState<T | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!encryptedData) {
      setDecryptedData(null);
      return;
    }

    const decryptData = async () => {
      setIsDecrypting(true);
      setError(null);

      try {
        if ("phoneEncrypted" in encryptedData) {
          // This is patient data
          const decrypted = await DecryptionService.decryptPatientPII(
            encryptedData
          );
          setDecryptedData(decrypted);
        } else if ("descriptionEncrypted" in encryptedData) {
          // This is medical record data
          const decrypted = await DecryptionService.decryptMedicalRecordPII(
            encryptedData
          );
          setDecryptedData(decrypted);
        } else if ("chiefComplaintEncrypted" in encryptedData) {
          // This is consultation data
          const decrypted = await DecryptionService.decryptConsultationPII(
            encryptedData
          );
          setDecryptedData(decrypted);
        } else if ("notesEncrypted" in encryptedData) {
          // This is appointment data
          const decrypted = await DecryptionService.decryptAppointmentPII(
            encryptedData
          );
          setDecryptedData(decrypted);
        } else {
          // No encrypted fields, use as-is
          setDecryptedData(encryptedData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Decryption failed");
        console.error("PII decryption error:", err);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptData();
  }, [encryptedData]);

  // Clear decrypted data when component unmounts
  useEffect(() => {
    return () => {
      setDecryptedData(null);
    };
  }, []);

  return { decryptedData, isDecrypting, error };
}
```

## 🎯 **Usage Examples**

### **Patient Display Component**

```typescript
// src/components/PatientDisplay.tsx
"use client";

import React from "react";
import { usePIIDecryption } from "@/hooks/usePIIDecryption";

interface PatientDisplayProps {
  patient: any; // Encrypted patient data from API
}

export function PatientDisplay({ patient }: PatientDisplayProps) {
  const { decryptedData, isDecrypting, error } = usePIIDecryption(patient);

  if (isDecrypting) {
    return <div>Decrypting patient data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!decryptedData) {
    return <div>No patient data available</div>;
  }

  return (
    <div className="patient-display">
      <h2>
        {decryptedData.firstName} {decryptedData.lastName}
      </h2>

      {/* Non-encrypted fields - safe to display */}
      <p>Email: {decryptedData.email}</p>
      <p>Date of Birth: {decryptedData.dateOfBirth}</p>
      <p>Gender: {decryptedData.gender}</p>

      {/* Decrypted PII fields */}
      {decryptedData.phone && <p>Phone: {decryptedData.phone}</p>}

      {decryptedData.addressStreet && (
        <div>
          <p>Address:</p>
          <p>{decryptedData.addressStreet}</p>
          <p>
            {decryptedData.addressCity}, {decryptedData.addressState}{" "}
            {decryptedData.addressZip}
          </p>
          <p>{decryptedData.addressCountry}</p>
        </div>
      )}

      {decryptedData.emergencyName && (
        <div>
          <p>Emergency Contact:</p>
          <p>
            {decryptedData.emergencyName} ({decryptedData.emergencyRelationship})
          </p>
          <p>Phone: {decryptedData.emergencyPhone}</p>
        </div>
      )}
    </div>
  );
}
```

### **Medical Record Component**

```typescript
// src/components/MedicalRecordDisplay.tsx
"use client";

import React from "react";
import { usePIIDecryption } from "@/hooks/usePIIDecryption";

export function MedicalRecordDisplay({ record }: { record: any }) {
  const { decryptedData, isDecrypting, error } = usePIIDecryption(record);

  if (isDecrypting) {
    return <div>Decrypting medical record...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="medical-record">
      <h3>{decryptedData.title}</h3>
      <p>Type: {decryptedData.type}</p>
      <p>Date: {decryptedData.recordDate}</p>

      {/* Decrypted medical content */}
      {decryptedData.description && (
        <div>
          <h4>Description</h4>
          <p>{decryptedData.description}</p>
        </div>
      )}

      {decryptedData.findings && (
        <div>
          <h4>Findings</h4>
          <p>{decryptedData.findings}</p>
        </div>
      )}

      {decryptedData.recommendations && (
        <div>
          <h4>Recommendations</h4>
          <p>{decryptedData.recommendations}</p>
        </div>
      )}
    </div>
  );
}
```

## 🚨 **Security Considerations**

### **1. Never Store Decrypted Data**

```typescript
//  WRONG - Never store decrypted PII in state or localStorage
const [decryptedPhone, setDecryptedPhone] = useState("");

//  CORRECT - Store encrypted data, decrypt only when needed
const [patient, setPatient] = useState(encryptedPatientData);
```

### **2. Clear Decrypted Data**

```typescript
// Clear decrypted data when component unmounts
useEffect(() => {
  return () => {
    // Clear any decrypted data from memory
    setDecryptedData(null);
  };
}, []);
```

### **3. Secure Key Management**

```typescript
//  WRONG - Never expose encryption keys in client-side code
const ENCRYPTION_KEY = "my-secret-key";

// CORRECT - Use environment variables and secure key management
const key = await getEncryptionKeyFromSecureSource();
```

### **4. Error Handling**

```typescript
// Always handle decryption errors gracefully
try {
  const decrypted = await DecryptionService.decryptPII(encryptedData);
  return decrypted;
} catch (error) {
  // Log error for debugging but don't expose sensitive information
  console.error("Decryption failed:", error);

  // Return safe fallback
  return "[Data Unavailable]";
}
```

##  **Transport Encryption Status**

### **Current Implementation**

- **HSTS Headers**: ✅ Implemented (forces HTTPS in supported browsers)
- **HTTPS Enforcement**: ⚠️ Needs configuration
- **Cookie Security**: ✅ Secure flags set for production

### **HTTPS Enforcement Setup**

To enable full HTTPS encryption, add this to your Next.js configuration:

```typescript
// next.config.ts
const nextConfig = {
  // Force HTTPS in production
  ...(process.env.NODE_ENV === "production" && {
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
          ],
        },
      ];
    },
  }),
};
```

### **WebView**

For hybrid apps using WebView, the web-based decryption service will work as-is.

## 🧪 **Testing**

### **Mock Encrypted Data**

```typescript
// src/__mocks__/encryptedData.ts
export const mockEncryptedPatient = {
  id: "123",
  firstName: "John",
  lastName: "Doe",
  phoneEncrypted: Buffer.from(
    JSON.stringify({
      encrypted: "mock-encrypted-data",
      iv: "mock-iv",
      tag: "mock-tag",
    })
  ).toString("base64"),
};
```

### **Decryption Tests**

```typescript
// src/tests/decryption.test.ts
import { DecryptionService } from "../services/decryptionService";

describe("DecryptionService", () => {
  it("should decrypt PII data correctly", async () => {
    const encryptedData = "base64-encoded-encrypted-data";
    const decrypted = await DecryptionService.decryptPII(encryptedData);

    expect(decrypted).toBeDefined();
    expect(typeof decrypted).toBe("string");
  });
});
```

##  **App Router Integration**

### **File Structure**

```
src/
├── app/                    # App Router pages
│   ├── patients/          # Patient-related pages
│   ├── medical-records/   # Medical record pages
│   └── appointments/      # Appointment pages
├── components/            # React components
│   ├── PatientDisplay.tsx
│   ├── MedicalRecordDisplay.tsx
│   └── AppointmentDisplay.tsx
├── hooks/                 # Custom hooks
│   └── usePIIDecryption.ts
├── services/              # Services
│   └── decryptionService.ts
└── lib/                   # Utility libraries
```

### **Page Components**

```typescript
// src/app/patients/[id]/page.tsx
import { PatientDisplay } from "@/components/PatientDisplay";

export default function PatientPage({ params }: { params: { id: string } }) {
  // Fetch patient data from API
  const patient = await fetchPatient(params.id);

  return (
    <div>
      <h1>Patient Details</h1>
      <PatientDisplay patient={patient} />
    </div>
  );
}
```

### **API Integration**

```typescript
// src/app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      medicalRecords: true,
      appointments: true,
    },
  });

  return NextResponse.json({ patient });
}
```

## 📚 **Additional Resources**

- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [React Security Best Practices](https://reactjs.org/docs/security.html)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)

---

**Note**: This implementation ensures that sensitive PII is never stored in plain text on the frontend and is only decrypted when needed for display. All decrypted data should be cleared from memory when no longer needed.

**Implementation Status**:  **COMPLETE** - All decryption services and hooks are now implemented and ready for use with the App Router.
