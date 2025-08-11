// Test setup file for security validation tests
import { config } from "dotenv";

// Load environment variables for testing
config({ path: ".env.test" });

// Mock environment variables if not set
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-purposes-only";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/ehr_test";

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock the audit service for tests
jest.mock("../lib/audit", () => ({
  AuditService: {
    log: jest.fn().mockResolvedValue(undefined),
    extractRequestInfo: jest.fn().mockReturnValue({
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
      requestId: "test-request-id",
    }),
  },
  AuditAction: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  },
}));

// Mock the logger for tests
jest.mock("../lib/logger", () => ({
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
  },
}));
