import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data generators
export const generateMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'PATIENT' as const,
  permissions: ['RECORD_READ_OWN'],
  isActive: true,
  mfaEnabled: false,
  ...overrides,
})

export const generateMockPatient = (overrides = {}) => ({
  id: 'test-patient-id',
  userId: 'test-user-id',
  firstName: 'Test',
  lastName: 'Patient',
  email: 'patient@example.com',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'MALE' as const,
  phoneEncrypted: null,
  addressStreetEncrypted: null,
  addressCityEncrypted: null,
  addressStateEncrypted: null,
  addressZipEncrypted: null,
  addressCountryEncrypted: null,
  emergencyNameEncrypted: null,
  emergencyRelationshipEncrypted: null,
  emergencyPhoneEncrypted: null,
  bloodType: 'A_POSITIVE' as const,
  allergies: [],
  chronicConditions: [],
  currentMedications: [],
  assignedProviderId: null,
  status: 'ACTIVE' as const,
  gdprConsent: true,
  gdprConsentDate: new Date(),
  gdprConsentVersion: '1.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const generateMockMedicalRecord = (overrides = {}) => ({
  id: 'test-record-id',
  patientId: 'test-patient-id',
  providerId: 'test-provider-id',
  type: 'CONSULTATION' as const,
  title: 'Test Medical Record',
  recordDate: new Date(),
  descriptionEncrypted: null,
  findingsEncrypted: null,
  recommendationsEncrypted: null,
  attachments: [],
  isPrivate: false,
  restrictedAccess: false,
  accessRestrictions: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const generateMockAppointment = (overrides = {}) => ({
  id: 'test-appointment-id',
  patientId: 'test-patient-id',
  providerId: 'test-provider-id',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
  timezone: 'UTC',
  type: 'CONSULTATION' as const,
  status: 'SCHEDULED' as const,
  reason: 'Regular checkup',
  priority: 'NORMAL' as const,
  notesEncrypted: null,
  reminderSent: false,
  confirmationSent: false,
  locationType: 'IN_PERSON' as const,
  roomNumber: null,
  virtualMeetingUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const generateMockJWT = (payload = {}, secret = 'test-secret') => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  // Simple mock signature (not cryptographically secure)
  const signature = 'mock-signature'
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

// Mock fetch for testing
export const mockFetch = (responses: Record<string, any>) => {
  global.fetch = jest.fn((url: string) => {
    const response = responses[url] || responses['*']
    if (response) {
      return Promise.resolve(mockApiResponse(response.data, response.status))
    }
    return Promise.resolve(mockApiResponse({ error: 'Not found' }, 404))
  }) as jest.MockedFunction<typeof fetch>
}

// Database test utilities
export const createTestDatabase = async () => {
  // This would be implemented with Prisma test utilities
  // For now, return a mock database connection
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    clean: jest.fn(),
  }
}

// Performance test utilities
export const measurePerformance = async (fn: () => Promise<any>) => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  
  return {
    result,
    duration: end - start,
    durationMs: end - start,
  }
}

// Cleanup utilities
export const cleanupTestData = async () => {
  // Clean up any test data created during tests
  localStorage.clear()
  sessionStorage.clear()
  
  // Reset all mocks
  jest.clearAllMocks()
}

// Export everything
export * from '@testing-library/react'
export { customRender as render }
export { cleanupTestData }
export { measurePerformance }
export { createTestDatabase }
export { mockFetch }
export { generateMockUser, generateMockPatient, generateMockMedicalRecord, generateMockAppointment, generateMockJWT }

