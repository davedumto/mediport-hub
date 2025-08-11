# Frontend PII Encryption Quick Reference

##  **Quick Start**

### **1. Install Dependencies**

```bash
npm install buffer
```

### **2. Environment Setup**

```bash
# .env.local
NEXT_PUBLIC_ENCRYPTION_KEY=your-32-byte-hex-key-here
```

### **3. Basic Usage**

```typescript
import { usePIIDecryption } from "@/hooks/usePIIDecryption";

function PatientCard({ patient }) {
  const { decryptedData, isDecrypting, error } = usePIIDecryption(patient);

  if (isDecrypting) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>
        {decryptedData.firstName} {decryptedData.lastName}
      </h3>
      <p>Phone: {decryptedData.phone || "[Encrypted]"}</p>
      <p>Address: {decryptedData.addressStreet || "[Encrypted]"}</p>
    </div>
  );
}
```

## 📋 **Encrypted vs Non-Encrypted Fields**

### **Safe to Display (Non-Encrypted)**

- `firstName`, `lastName`, `email`
- `dateOfBirth`, `gender`, `bloodType`
- `id`, `status`, `createdAt`

### **🔐 Must Decrypt (Encrypted)**

- `phoneEncrypted` → `phone`
- `addressStreetEncrypted` → `addressStreet`
- `descriptionEncrypted` → `description`
- `findingsEncrypted` → `findings`

##  **Decryption Patterns**

### **Patient Data**

```typescript
import { DecryptionService } from "@/services/decryptionService";

const decrypted = await DecryptionService.decryptPatientPII(patientData);
// Returns: { firstName, lastName, phone, addressStreet, ... }
```

### **Medical Records**

```typescript
const decrypted = await DecryptionService.decryptMedicalRecordPII(recordData);
// Returns: { title, description, findings, recommendations, ... }
```

### **Single Field**

```typescript
const phone = await DecryptionService.decryptPII(patient.phoneEncrypted);
```

## **Security Rules**

1. **Never store decrypted data in state**
2. **Clear decrypted data on unmount**
3. **Handle decryption errors gracefully**
4. **Use the `usePIIDecryption` hook**

##  **Mobile Support**

### **React Native**

```typescript
import { decrypt } from "react-native-crypto";
// Use same decryption logic with react-native-crypto
```

### **WebView**

```typescript
// Web-based decryption works as-is
```

##  **Testing**

### **Mock Data**

```typescript
const mockPatient = {
  firstName: "John",
  lastName: "Doe",
  phoneEncrypted: Buffer.from(
    JSON.stringify({
      encrypted: "mock-data",
      iv: "mock-iv",
      tag: "mock-tag",
    })
  ).toString("base64"),
};
```

### **Test Hook**

```typescript
const { result } = renderHook(() => usePIIDecryption(mockPatient));
expect(result.current.decryptedData).toBeDefined();
```

##  **Troubleshooting**

### **Common Issues**

- **"Encryption key not configured"** → Check `NEXT_PUBLIC_ENCRYPTION_KEY`
- **"Decryption failed"** → Verify data format from API
- **"Buffer not defined"** → Install `buffer` package

### **Debug Mode**

```typescript
// Enable detailed logging
console.log("Encrypted data:", encryptedData);
console.log("Decryption result:", decryptedData);
```

##  **App Router Structure**

### **File Organization**

```
src/
├── app/                    # App Router pages
├── components/            # React components
├── hooks/                 # Custom hooks (including usePIIDecryption)
├── services/              # Services (including DecryptionService)
├── lib/                   # Utility libraries
└── types/                 # TypeScript type definitions
```

### **Import Paths**

```typescript
// Use absolute imports with @ alias
import { usePIIDecryption } from "@/hooks/usePIIDecryption";
import { DecryptionService } from "@/services/decryptionService";

// Or relative imports
import { usePIIDecryption } from "../../hooks/usePIIDecryption";
```

### **Component Examples**

#### **Patient Display Component**

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
      <p>Email: {decryptedData.email}</p>
      <p>Phone: {decryptedData.phone || "[Encrypted]"}</p>
      <p>Address: {decryptedData.addressStreet || "[Encrypted]"}</p>
    </div>
  );
}
```

#### **Medical Record Component**

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
      <p>Description: {decryptedData.description || "[Encrypted]"}</p>
      <p>Findings: {decryptedData.findings || "[Encrypted]"}</p>
    </div>
  );
}
```

##  **Security Best Practices**

### **1. Environment Variables**

```bash
# .env.local (never commit this file)
NEXT_PUBLIC_ENCRYPTION_KEY=your-32-byte-hex-key-here

# .env.example (commit this file)
NEXT_PUBLIC_ENCRYPTION_KEY=your-32-byte-hex-key-here
```

### **2. Component Security**

```typescript
// Always use "use client" for components with hooks
"use client";

// Clear sensitive data on unmount
useEffect(() => {
  return () => {
    setDecryptedData(null);
  };
}, []);
```

### **3. Error Handling**

```typescript
// Never expose encryption errors to users
try {
  const decrypted = await DecryptionService.decryptPII(encryptedData);
  return decrypted;
} catch (error) {
  console.error("Decryption failed:", error);
  return "[Data Unavailable]";
}
```

---

**Need More Details?** → See `FRONTEND_PII_ENCRYPTION_GUIDE.md`
**API Documentation** → See `API_DEVELOPMENT_GUIDE.md`
**Security Info** → See `SECURITY_IMPLEMENTATION_SUMMARY.md`
**App Router Setup** → See `README.md`
