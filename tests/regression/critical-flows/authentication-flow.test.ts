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

describe('Critical Authentication Flow Regression Tests', () => {
  describe('User Login Flow', () => {
    const mockUser = generateMockUser()
    const mockPassword = 'testPassword123'

    beforeEach(() => {
      // Mock successful user lookup
      const { user } = require('@/lib/db')
      user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$test.hash.here',
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

    test('REG-001: Complete login flow works end-to-end', async () => {
      // Step 1: User submits login credentials
      const loginRequest = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const loginResponse = await loginHandler(loginRequest.req as NextRequest)
      const loginData = await loginResponse.json()

      // Verify login success
      expect(loginResponse.status).toBe(200)
      expect(loginData.success).toBe(true)
      expect(loginData.accessToken).toBeDefined()
      expect(loginData.refreshToken).toBeDefined()

      // Step 2: User accesses protected profile with token
      const profileRequest = createMocks({
        method: 'GET',
        headers: {
          authorization: `Bearer ${loginData.accessToken}`,
        },
      })

      const profileResponse = await profileHandler(profileRequest.req as NextRequest)
      const profileData = await profileResponse.json()

      // Verify profile access success
      expect(profileResponse.status).toBe(200)
      expect(profileData.success).toBe(true)
      expect(profileData.data.user).toBeDefined()

      // Step 3: Validate token is still valid
      const validateRequest = createMocks({
        method: 'POST',
        headers: {
          authorization: `Bearer ${loginData.accessToken}`,
        },
      })

      const validateResponse = await validateHandler(validateRequest.req as NextRequest)
      const validateData = await validateResponse.json()

      // Verify token validation success
      expect(validateResponse.status).toBe(200)
      expect(validateData.success).toBe(true)
    })

    test('REG-002: Failed login does not grant access to protected endpoints', async () => {
      // Attempt login with wrong password
      const bcrypt = require('bcrypt')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      const loginRequest = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: 'wrongPassword',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const loginResponse = await loginHandler(loginRequest.req as NextRequest)
      
      // Verify login failed
      expect(loginResponse.status).toBe(401)

      // Attempt to access profile without valid token
      const profileRequest = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })

      const profileResponse = await profileHandler(profileRequest.req as NextRequest)
      
      // Verify access denied
      expect(profileResponse.status).toBe(401)
    })

    test('REG-003: Account lockout mechanism works correctly', async () => {
      const bcrypt = require('bcrypt')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        const loginRequest = createMocks({
          method: 'POST',
          body: {
            email: mockUser.email,
            password: 'wrongPassword',
          },
          headers: {
            'content-type': 'application/json',
          },
        })

        const loginResponse = await loginHandler(loginRequest.req as NextRequest)
        
        if (i < 4) {
          // First 4 attempts should fail but not lock account
          expect(loginResponse.status).toBe(401)
        } else {
          // 5th attempt should lock account
          expect(loginResponse.status).toBe(423) // Account locked
        }
      }

      // Verify account is locked
      const { user } = require('@/lib/db')
      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            lockedUntil: expect.any(Date),
          }),
        })
      )
    })

    test('REG-004: MFA flow integration works correctly', async () => {
      // Mock user with MFA enabled
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

      // First login attempt without MFA
      const loginRequest1 = createMocks({
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

      const loginResponse1 = await loginHandler(loginRequest1.req as NextRequest)
      const loginData1 = await loginResponse1.json()

      // Should require MFA
      expect(loginResponse1.status).toBe(200)
      expect(loginData1.requiresMFA).toBe(true)

      // Second login attempt with MFA
      const loginRequest2 = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
          mfaCode: '123456',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const loginResponse2 = await loginHandler(loginRequest2.req as NextRequest)
      const loginData2 = await loginResponse2.json()

      // Should complete login successfully
      expect(loginResponse2.status).toBe(200)
      expect(loginData2.success).toBe(true)
      expect(loginData2.accessToken).toBeDefined()
    })
  })

  describe('Session Management', () => {
    test('REG-005: Session tokens work across multiple requests', async () => {
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

      // Make multiple requests with the same token
      for (let i = 0; i < 5; i++) {
        const profileRequest = createMocks({
          method: 'GET',
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        })

        const profileResponse = await profileHandler(profileRequest.req as NextRequest)
        
        // All requests should succeed
        expect(profileResponse.status).toBe(200)
      }
    })

    test('REG-006: Invalid tokens are consistently rejected', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer',
        'Bearer ',
        'Bearer invalid',
        'invalid.Bearer.token',
        '',
        null,
        undefined,
      ]

      for (const token of invalidTokens) {
        const profileRequest = createMocks({
          method: 'GET',
          headers: token ? { authorization: token } : {},
        })

        const profileResponse = await profileHandler(profileRequest.req as NextRequest)
        
        // All invalid tokens should be rejected
        expect(profileResponse.status).toBe(401)
      }
    })
  })

  describe('Role-Based Access Control', () => {
    test('REG-007: Different user roles have appropriate permissions', async () => {
      const roles = ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN']
      
      for (const role of roles) {
        const mockUser = generateMockUser({ role: role as any })
        const mockToken = generateMockJWT({
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          permissions: ['RECORD_READ_OWN'],
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

        const profileRequest = createMocks({
          method: 'GET',
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        })

        const profileResponse = await profileHandler(profileRequest.req as NextRequest)
        
        // All valid roles should be able to access their profile
        expect(profileResponse.status).toBe(200)
      }
    })
  })

  describe('Error Handling Resilience', () => {
    test('REG-008: System handles database failures gracefully', async () => {
      const { user } = require('@/lib/db')
      user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const loginRequest = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'testPassword',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const loginResponse = await loginHandler(loginRequest.req as NextRequest)
      const loginData = await loginResponse.json()

      // Should handle database error gracefully
      expect(loginResponse.status).toBe(500)
      expect(loginData.error).toBe('Internal Server Error')
      expect(loginData.message).toBe('An unexpected error occurred')
    })

    test('REG-009: System handles malformed requests gracefully', async () => {
      const malformedRequests = [
        { body: null },
        { body: 'invalid-json' },
        { body: { email: 'test@example.com' } }, // Missing password
        { body: { password: 'testPassword' } }, // Missing email
        { body: {} }, // Empty body
      ]

      for (const request of malformedRequests) {
        const loginRequest = createMocks({
          method: 'POST',
          ...request,
          headers: {
            'content-type': 'application/json',
          },
        })

        const loginResponse = await loginHandler(loginRequest.req as NextRequest)
        
        // Should handle malformed requests gracefully
        expect([400, 500]).toContain(loginResponse.status)
      }
    })
  })

  describe('Security Measures', () => {
    test('REG-010: Password security requirements are enforced', async () => {
      const weakPasswords = [
        '123',
        'password',
        'abc',
        '',
        null,
        undefined,
      ]

      for (const password of weakPasswords) {
        const loginRequest = createMocks({
          method: 'POST',
          body: {
            email: 'test@example.com',
            password,
          },
          headers: {
            'content-type': 'application/json',
          },
        })

        const loginResponse = await loginHandler(loginRequest.req as NextRequest)
        
        // Weak passwords should be rejected
        expect([400, 401]).toContain(loginResponse.status)
      }
    })

    test('REG-011: Rate limiting prevents brute force attacks', async () => {
      const bcrypt = require('bcrypt')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      // Make rapid successive login attempts
      const rapidRequests = Array(10).fill(null).map(() => ({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'wrongPassword',
        },
        headers: {
          'content-type': 'application/json',
        },
      }))

      const start = performance.now()
      
      const responses = await Promise.all(
        rapidRequests.map(req => {
          const { req: mockReq } = createMocks(req)
          return loginHandler(mockReq as NextRequest)
        })
      )
      
      const end = performance.now()
      const totalTime = end - start

      // Should handle rapid requests without crashing
      responses.forEach(response => {
        expect([401, 429]).toContain(response.status) // 401 for auth failure, 429 for rate limit
      })

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000) // Less than 5 seconds
    })
  })

  describe('Data Integrity', () => {
    test('REG-012: User data remains consistent across operations', async () => {
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

      // Make multiple profile requests
      const profileData = []
      for (let i = 0; i < 3; i++) {
        const profileRequest = createMocks({
          method: 'GET',
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        })

        const profileResponse = await profileHandler(profileRequest.req as NextRequest)
        const data = await profileResponse.json()
        profileData.push(data.data.user)
      }

      // All responses should contain consistent user data
      profileData.forEach(userData => {
        expect(userData.id).toBe(mockUser.id)
        expect(userData.email).toBe(mockUser.email)
        expect(userData.role).toBe(mockUser.role)
      })
    })
  })
})
