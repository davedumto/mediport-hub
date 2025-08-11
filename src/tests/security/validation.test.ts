import {
  createPatientSchema,
  passwordSchema,
  searchQuerySchema,
  emailSchema,
  nameSchema,
  phoneSchema,
} from "../../lib/validation";
import { SanitizationService } from "../../services/sanitizationService";

describe("Security Validation", () => {
  describe("Input Validation", () => {
    it("should reject SQL injection attempts in patient data", async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM patients",
        "admin'--",
        "' OR 1=1#",
      ];

      for (const maliciousInput of maliciousInputs) {
        const result = createPatientSchema.safeParse({
          firstName: maliciousInput,
          lastName: "User",
          email: "test@example.com",
          phone: "+1234567890",
          dateOfBirth: "1990-01-01T00:00:00Z",
          gender: "MALE",
          address: {
            street: "123 Main St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "Test Country",
          },
          emergencyContact: {
            name: "Emergency Contact",
            relationship: "Spouse",
            phone: "+1234567890",
          },
          gdprConsent: true,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(
            result.error.issues.some((issue) =>
              issue.message.includes("potentially dangerous")
            )
          ).toBe(true);
        }
      }
    });

    it("should reject XSS attempts in text fields", async () => {
      const xssInputs = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<iframe src=javascript:alert('xss')></iframe>",
        "<svg onload=alert('xss')>",
      ];

      for (const xssInput of xssInputs) {
        const result = nameSchema.safeParse(xssInput);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(
            result.error.issues.some(
              (issue) =>
                issue.message.includes("potentially dangerous") ||
                issue.message.includes("Invalid format")
            )
          ).toBe(true);
        }
      }
    });

    it("should validate password complexity", () => {
      const weakPasswords = [
        "password", // Too common
        "12345678", // No letters
        "Password", // No numbers or special chars
        "password1", // No uppercase or special chars
        "PASSWORD1!", // No lowercase
        "Pass1!", // Too short
        "aaa111!!!", // Repeated characters
        "pass word1!", // Contains space
      ];

      weakPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
      });

      // Valid password
      const validPassword = "SecurePass123!";
      const result = passwordSchema.safeParse(validPassword);
      expect(result.success).toBe(true);
    });

    it("should validate email format and security", () => {
      const invalidEmails = [
        "test@", // Incomplete domain
        "@example.com", // Missing local part
        "test..test@example.com", // Double dots
        "test@example..com", // Double dots in domain
        "test@.com", // Empty domain
      ];

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });

      // Valid email
      const validEmail = "test@example.com";
      const result = emailSchema.safeParse(validEmail);
      expect(result.success).toBe(true);
    });

    it("should validate phone number format", () => {
      const invalidPhones = [
        "abc123", // Contains letters
        "123", // Too short
        "123456789012345678901234567890", // Too long
      ];

      invalidPhones.forEach((phone) => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(false);
      });

      // Valid phones
      const validPhones = [
        "+1234567890",
        "(123) 456-7890",
        "123-456-7890",
        "1234567890",
      ];

      validPhones.forEach((phone) => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Sanitization Service", () => {
    it("should sanitize HTML content", () => {
      const maliciousHTML = "<script>alert('xss')</script><p>Safe content</p>";
      const sanitized = SanitizationService.sanitizeHTML(maliciousHTML);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("<p>Safe content</p>");
    });

    it("should sanitize plain text", () => {
      const maliciousText = "Hello<script>alert('xss')</script>World";
      const sanitized = SanitizationService.sanitizeText(maliciousText);

      expect(sanitized).toBe("HelloWorld");
      expect(sanitized).not.toContain("<script>");
    });

    it("should sanitize filenames", () => {
      const maliciousFilename = "../../../etc/passwd<script>.exe";
      const sanitized = SanitizationService.sanitizeFilename(maliciousFilename);

      expect(sanitized).not.toContain("../");
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("_etc_passwd_script_.exe");
    });

    it("should sanitize search queries", () => {
      const maliciousQuery = "test<script>alert('xss')</script>query";
      const sanitized = SanitizationService.sanitizeSearchQuery(maliciousQuery);

      // The sanitizeSearchQuery function removes non-word characters, so <script> becomes script
      expect(sanitized).toBe("testscriptalertxssscriptquery");
      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
    });

    it("should sanitize medical data", () => {
      const maliciousMedicalData = {
        diagnosis: "Flu<script>alert('xss')</script>",
        symptoms: ["fever", "<img src=x onerror=alert('xss')>", "cough"],
        notes: "Patient has <iframe>malicious content</iframe>",
      };

      const sanitized =
        SanitizationService.sanitizeMedicalData(maliciousMedicalData);

      expect(sanitized.diagnosis).not.toContain("<script>");
      expect(sanitized.symptoms[1]).not.toContain("<img");
      expect(sanitized.notes).not.toContain("<iframe>");
    });
  });

  describe("Schema Validation", () => {
    it("should validate patient creation schema", () => {
      const validPatient = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        dateOfBirth: "1990-01-01T00:00:00Z",
        gender: "MALE",
        address: {
          street: "123 Main St",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
          country: "Test Country",
        },
        emergencyContact: {
          name: "Emergency Contact",
          relationship: "Spouse",
          phone: "+1234567890",
        },
        gdprConsent: true,
      };

      const result = createPatientSchema.safeParse(validPatient);
      expect(result.success).toBe(true);
    });

    it("should validate search query schema", () => {
      const validQuery = {
        query: "patient name",
        page: "1",
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const result = searchQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });
  });
});
