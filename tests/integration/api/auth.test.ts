import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { GET as profileHandler } from '@/app/api/auth/profile/route'
import { POST as validateHandler } from '@/app/api/auth/validate/route'
import { generateMockUser, generateMockJWT } from '@/tests/fixtures/utils/testUtils'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userSession: {
    create: jest.fn(),
  },
}))

// Mock audit service
jest.mock('@/lib/audit', () => ({
  AuditService: {
    logLoginSuccess: jest.fn(),
    logLoginFailed: jest.fn(),
    log: jest.fn(),
  },
}))

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = {
    ...originalEnv,
    JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key-for-testing-purposes-only',
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Authentication API Integration Tests', () => {
  describe('POST /api/auth/login', () => {
    const mockUser = generateMockUser()
    const mockPassword = 'testPassword123'

    beforeEach(() => {
      // Mock successful user lookup
      const { user } = require('@/lib/db')
      user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$test.hash.here', // Mock bcrypt hash
        userRoles: [
          {
            role: {
              permissions: ['RECORD_READ_OWN'],
            },
          },
        ],
      })

      // Mock password verification
      const bcrypt = require('bcrypt')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)
    })

    test('successfully authenticates valid user', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await loginHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Login successful.')
      expect(data.accessToken).toBeDefined()
      expect(data.refreshToken).toBeDefined()
      expect(data.user).toBeDefined()
    })

    test('rejects invalid credentials', async () => {
      const bcrypt = require('bcrypt')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: 'wrongPassword',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await loginHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid email or password.')
    })

    test('handles missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          // Missing password
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await loginHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toBe('Email and password are required')
    })

    test('handles user not found', async () => {
      const { user } = require('@/lib/db')
      user.findUnique.mockResolvedValue(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          password: mockPassword,
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await loginHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid email or password.')
    })

    test('handles inactive user account', async () => {
      const { user } = require('@/lib/db')
      user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
        passwordHash: '$2b$12$test.hash.here',
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await loginHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Account is inactive')
    })

    test('requires MFA when enabled', async () => {
      const { user } = require('@/lib/db')
      user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: 'test-mfa-secret',
        passwordHash: '$2b$12$test.hash.here',
        userRoles: [
          {
            role: {
              permissions: ['RECORD_READ_OWN'],
            },
          },
        ],
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
          // Missing MFA code
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await loginHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.requiresMFA).toBe(true)
      expect(data.message).toBe('MFA code required')
    })
  })

  describe('GET /api/auth/profile', () => {
    const mockUser = generateMockUser()
    const mockToken = generateMockJWT({
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      permissions: mockUser.permissions,
    })

    beforeEach(() => {
      // Mock successful user lookup
      const { user } = require('@/lib/db')
      user.findUnique.mockResolvedValue({
        ...mockUser,
        userRoles: [
          {
            role: {
              permissions: ['RECORD_READ_OWN'],
            },
          },
        ],
      })
    })

    test('returns user profile for valid token', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      })

      const response = await profileHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user).toBeDefined()
      expect(data.data.user.id).toBe(mockUser.id)
      expect(data.data.user.email).toBe(mockUser.email)
    })

    test('rejects request without authorization header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        // Missing authorization header
      })

      const response = await profileHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Missing or invalid authorization header')
    })

    test('rejects request with invalid token format', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'InvalidTokenFormat',
        },
      })

      const response = await profileHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Missing or invalid authorization header')
    })
  })

  describe('POST /api/auth/validate', () => {
    const mockUser = generateMockUser()
    const mockToken = generateMockJWT({
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      permissions: mockUser.permissions,
    })

    test('validates valid token', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      })

      const response = await validateHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Token is valid')
    })

    test('rejects invalid token', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })

      const response = await validateHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid or expired token')
    })
  })

  describe('Error Handling', () => {
    test('handles database connection errors gracefully', async () => {
      const { user } = require('@/lib/db')
      user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'testPassword',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await loginHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('An unexpected error occurred')
    })

    test('handles malformed JSON gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await loginHandler(req as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('Performance', () => {
    test('login endpoint responds within acceptable time', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'testPassword',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const start = performance.now()
      const response = await loginHandler(req as NextRequest)
      const end = performance.now()

      expect(response.status).toBe(401) // Expected for invalid credentials
      expect(end - start).toBeLessThan(1000) // Should respond in less than 1 second
    })

    test('profile endpoint responds quickly for authenticated users', async () => {
      const mockUser = generateMockUser()
      const mockToken = generateMockJWT({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        permissions: mockUser.permissions,
      })

      const { user } = require('@/lib/db')
      user.findUnique.mockResolvedValue({
        ...mockUser,
        userRoles: [
          {
            role: {
              permissions: ['RECORD_READ_OWN'],
            },
          },
        ],
      })

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      })

      const start = performance.now()
      const response = await profileHandler(req as NextRequest)
      const end = performance.now()

      expect(response.status).toBe(200)
      expect(end - start).toBeLessThan(500) // Should respond in less than 500ms
    })
  })
})

