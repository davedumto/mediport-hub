import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import validator from "validator";

// Configure DOMPurify for server-side use
const window = new JSDOM("").window;
const purify = DOMPurify(window);

export class SanitizationService {
  // Sanitize HTML content
  static sanitizeHTML(html: string, allowedTags?: string[]): string {
    const defaultAllowedTags = [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "h1",
      "h2",
      "h3",
    ];

    return purify.sanitize(html, {
      ALLOWED_TAGS: allowedTags || defaultAllowedTags,
      ALLOWED_ATTR: ["href", "title"],
      ALLOW_DATA_ATTR: false,
      FORBID_ATTR: ["style", "onclick", "onload", "onerror"],
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
      USE_PROFILES: { html: true },
    });
  }

  // Sanitize plain text
  static sanitizeText(text: string): string {
    if (typeof text !== "string") return "";

    return text
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .slice(0, 10000); // Limit length
  }

  // Sanitize filename
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_\.]/g, "_") // Replace special chars with underscore
      .replace(/\.{2,}/g, ".") // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, "") // Remove leading/trailing dots
      .substring(0, 255); // Limit length
  }

  // Sanitize search query
  static sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/[^\w\s\-]/g, "") // Keep only word characters, spaces, and hyphens
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .substring(0, 100); // Limit length
  }

  // Validate and sanitize medical data
  static sanitizeMedicalData(data: any): any {
    if (typeof data === "string") {
      // Remove potentially dangerous content while preserving medical terminology
      return data
        .replace(/<script[^>]*>.*?<\/script>/gi, "")
        .replace(/<img[^>]*>.*?<\/img>/gi, "")
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
        .replace(/<[^>]*>/g, "") // Remove all remaining HTML tags
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .replace(/alert\(/gi, "") // Remove alert function calls
        .replace(/\)/g, "") // Remove remaining parentheses
        .replace(/"/g, "") // Remove quotes
        .replace(/xss/gi, "") // Remove XSS references
        .trim();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeMedicalData(item));
    }

    if (typeof data === "object" && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeMedicalData(value);
      }
      return sanitized;
    }

    return data;
  }

  // Validate email address
  static isValidEmail(email: string): boolean {
    return validator.isEmail(email) && email.length <= 255;
  }

  // Validate phone number
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
    return phoneRegex.test(phone);
  }

  // Validate medical ID
  static isValidMedicalId(id: string): boolean {
    const medicalIdRegex = /^[A-Z]{2}\d{6,10}$/;
    return medicalIdRegex.test(id);
  }

  // Deep sanitize object
  static deepSanitize(obj: any): any {
    if (typeof obj === "string") {
      return this.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitize(item));
    }

    if (typeof obj === "object" && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key as well
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, "");
        sanitized[sanitizedKey] = this.deepSanitize(value);
      }
      return sanitized;
    }

    return obj;
  }

  // Sanitize URL
  static sanitizeURL(url: string): string {
    if (!validator.isURL(url)) {
      return "";
    }

    // Remove potentially dangerous protocols
    const dangerousProtocols = ["javascript:", "data:", "vbscript:"];
    const lowerUrl = url.toLowerCase();

    if (dangerousProtocols.some((protocol) => lowerUrl.startsWith(protocol))) {
      return "";
    }

    return url.trim();
  }

  // Sanitize medical codes (ICD-10, etc.)
  static sanitizeMedicalCode(code: string): string {
    return code
      .trim()
      .toUpperCase()
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/[^A-Z0-9\.]/g, "") // Keep only letters, numbers, and dots
      .substring(0, 20); // Limit length
  }

  // Sanitize medication names
  static sanitizeMedicationName(name: string): string {
    return name
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .substring(0, 100); // Limit length
  }

  // Sanitize patient notes
  static sanitizePatientNotes(notes: string): string {
    return this.sanitizeHTML(notes, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
    ]);
  }

  // Sanitize diagnosis text
  static sanitizeDiagnosis(diagnosis: string): string {
    return this.sanitizeHTML(diagnosis, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
    ]);
  }

  // Sanitize treatment plan
  static sanitizeTreatmentPlan(plan: string): string {
    return this.sanitizeHTML(plan, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "h1",
      "h2",
      "h3",
    ]);
  }

  // Sanitize symptoms description
  static sanitizeSymptoms(symptoms: string): string {
    return this.sanitizeHTML(symptoms, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
    ]);
  }

  // Sanitize prescription details
  static sanitizePrescription(prescription: string): string {
    return this.sanitizeHTML(prescription, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
    ]);
  }

  // Sanitize lab results
  static sanitizeLabResults(results: string): string {
    return this.sanitizeHTML(results, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "table",
      "tr",
      "td",
      "th",
    ]);
  }

  // Sanitize imaging reports
  static sanitizeImagingReport(report: string): string {
    return this.sanitizeHTML(report, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
    ]);
  }

  // Sanitize procedure notes
  static sanitizeProcedureNotes(notes: string): string {
    return this.sanitizeHTML(notes, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "h1",
      "h2",
      "h3",
    ]);
  }

  // Sanitize consent text
  static sanitizeConsentText(consent: string): string {
    return this.sanitizeHTML(consent, [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
    ]);
  }

  // Sanitize address components
  static sanitizeAddress(address: any): any {
    if (typeof address === "string") {
      return this.sanitizeText(address);
    }

    if (typeof address === "object" && address !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(address)) {
        if (typeof value === "string") {
          sanitized[key] = this.sanitizeText(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return address;
  }

  // Sanitize emergency contact information
  static sanitizeEmergencyContact(contact: any): any {
    if (typeof contact === "object" && contact !== null) {
      return {
        name: this.sanitizeText(contact.name || ""),
        relationship: this.sanitizeText(contact.relationship || ""),
        phone: this.sanitizeText(contact.phone || ""),
      };
    }

    return contact;
  }

  // Sanitize medical history
  static sanitizeMedicalHistory(history: any): any {
    if (typeof history === "object" && history !== null) {
      const sanitized: any = {};

      if (Array.isArray(history.allergies)) {
        sanitized.allergies = history.allergies.map((allergy: string) =>
          this.sanitizeText(allergy)
        );
      }

      if (Array.isArray(history.conditions)) {
        sanitized.conditions = history.conditions.map((condition: string) =>
          this.sanitizeText(condition)
        );
      }

      if (Array.isArray(history.medications)) {
        sanitized.medications = history.medications.map((medication: string) =>
          this.sanitizeMedicationName(medication)
        );
      }

      return sanitized;
    }

    return history;
  }

  // Sanitize vital signs
  static sanitizeVitalSigns(vitals: any): any {
    if (typeof vitals === "object" && vitals !== null) {
      const sanitized: any = {};

      // Only allow numeric values for vital signs
      const vitalFields = [
        "bloodPressureSystolic",
        "bloodPressureDiastolic",
        "heartRate",
        "temperature",
        "respiratoryRate",
        "oxygenSaturation",
      ];

      for (const field of vitalFields) {
        if (vitals[field] !== undefined && vitals[field] !== null) {
          const value = Number(vitals[field]);
          if (!isNaN(value)) {
            sanitized[field] = value;
          }
        }
      }

      return sanitized;
    }

    return vitals;
  }

  // Sanitize medication details
  static sanitizeMedicationDetails(medication: any): any {
    if (typeof medication === "object" && medication !== null) {
      return {
        name: this.sanitizeMedicationName(medication.name || ""),
        dosage: this.sanitizeText(medication.dosage || ""),
        frequency: this.sanitizeText(medication.frequency || ""),
        duration: this.sanitizeText(medication.duration || ""),
      };
    }

    return medication;
  }
}
