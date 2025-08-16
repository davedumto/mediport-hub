import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { GET as profileHandler } from '@/app/api/auth/profile/route'
import { generateMockUser, generateMockJWT, measurePerformance } from '@/tests/fixtures/utils/testUtils'

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

describe('API Performance Tests', () => {
  describe('Load Testing', () => {
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

    test('handles concurrent login requests efficiently', async () => {
      const concurrentRequests = 10
      const requests = Array(concurrentRequests).fill(null).map(() => ({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
        },
        headers: {
          'content-type': 'application/json',
        },
      }))

      const start = performance.now()
      
      const responses = await Promise.all(
        requests.map(req => {
          const { req: mockReq } = createMocks(req)
          return loginHandler(mockReq as NextRequest)
        })
      )
      
      const end = performance.now()
      const totalTime = end - start

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Should handle 10 concurrent requests in reasonable time
      expect(totalTime).toBeLessThan(2000) // Less than 2 seconds
      
      // Average response time should be reasonable
      const averageResponseTime = totalTime / concurrentRequests
      expect(averageResponseTime).toBeLessThan(200) // Less than 200ms average
    })

    test('maintains performance under sustained load', async () => {
      const sustainedRequests = 50
      const batchSize = 10
      const responseTimes: number[] = []

      for (let i = 0; i < sustainedRequests; i += batchSize) {
        const batch = Array(batchSize).fill(null).map(() => ({
          method: 'POST',
          body: {
            email: mockUser.email,
            password: mockPassword,
          },
          headers: {
            'content-type': 'application/json',
          },
        }))

        const batchStart = performance.now()
        
        const responses = await Promise.all(
          batch.map(req => {
            const { req: mockReq } = createMocks(req)
            return loginHandler(mockReq as NextRequest)
          })
        )
        
        const batchEnd = performance.now()
        const batchTime = batchEnd - batchStart
        
        responseTimes.push(batchTime)
        
        // Each batch should complete successfully
        responses.forEach(response => {
          expect(response.status).toBe(200)
        })
      }

      // Calculate performance metrics
      const totalTime = responseTimes.reduce((sum, time) => sum + time, 0)
      const averageTime = totalTime / responseTimes.length
      const maxTime = Math.max(...responseTimes)
      const minTime = Math.min(...responseTimes)

      // Performance should remain consistent
      expect(averageTime).toBeLessThan(500) // Average batch time < 500ms
      expect(maxTime).toBeLessThan(1000) // No batch should take > 1 second
      expect(maxTime / minTime).toBeLessThan(5) // Max/min ratio should be reasonable
    })

    test('handles mixed request types efficiently', async () => {
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

      const mixedRequests = [
        // Login requests
        ...Array(5).fill(null).map(() => ({
          type: 'login',
          data: {
            method: 'POST',
            body: { email: mockUser.email, password: mockPassword },
            headers: { 'content-type': 'application/json' },
          },
        })),
        // Profile requests
        ...Array(5).fill(null).map(() => ({
          type: 'profile',
          data: {
            method: 'GET',
            headers: { authorization: `Bearer ${mockToken}` },
          },
        })),
      ]

      const start = performance.now()
      
      const responses = await Promise.all(
        mixedRequests.map(async (req) => {
          const { req: mockReq } = createMocks(req.data)
          
          if (req.type === 'login') {
            return loginHandler(mockReq as NextRequest)
          } else {
            return profileHandler(mockReq as NextRequest)
          }
        })
      )
      
      const end = performance.now()
      const totalTime = end - start

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Mixed requests should complete efficiently
      expect(totalTime).toBeLessThan(1000) // Less than 1 second total
    })
  })

  describe('Response Time Benchmarks', () => {
    test('login endpoint meets performance SLA', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'testPassword',
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const { duration } = await measurePerformance(async () => {
        return loginHandler(req as NextRequest)
      })

      // Should respond within 200ms SLA
      expect(duration).toBeLessThan(200)
    })

    test('profile endpoint meets performance SLA', async () => {
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

      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      })

      const { duration } = await measurePerformance(async () => {
        return profileHandler(req as NextRequest)
      })

      // Should respond within 100ms SLA
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Memory Usage', () => {
    test('memory usage remains stable under load', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      const requests = Array(100).fill(null).map(() => ({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
        },
        headers: {
          'content-type': 'application/json',
        },
      }))

      // Process requests in batches to avoid overwhelming the system
      for (let i = 0; i < requests.length; i += 10) {
        const batch = requests.slice(i, i + 10)
        
        await Promise.all(
          batch.map(req => {
            const { req: mockReq } = createMocks(req)
            return loginHandler(mockReq as NextRequest)
          })
        )

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024

      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncreaseMB).toBeLessThan(50)
    })
  })

  describe('Database Performance', () => {
    test('database queries are optimized', async () => {
      const { user } = require('@/lib/db')
      
      // Mock database query timing
      user.findUnique.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
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
          }, 10) // Simulate 10ms database query
        })
      })

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      const { duration } = await measurePerformance(async () => {
        return loginHandler(req as NextRequest)
      })

      // Total time should be close to database query time
      expect(duration).toBeLessThan(50) // Should be close to 10ms + overhead
    })
  })

  describe('Caching Performance', () => {
    test('repeated requests benefit from caching', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: mockUser.email,
          password: mockPassword,
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      // First request
      const { duration: firstRequest } = await measurePerformance(async () => {
        return loginHandler(req as NextRequest)
      })

      // Second request (should be faster due to caching)
      const { duration: secondRequest } = await measurePerformance(async () => {
        return loginHandler(req as NextRequest)
      })

      // Second request should be at least as fast as first
      expect(secondRequest).toBeLessThanOrEqual(firstRequest)
    })
  })
})
