import '@testing-library/jest-dom';

// Mock Next.js server-side APIs globally
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(init?: any) {
      Object.assign(this, init);
    }
    
    nextUrl = {
      pathname: '/api/test',
      searchParams: new URLSearchParams(),
    };
    
    headers = new Map();
    cookies = new Map();
    json = jest.fn();
    
    get(name: string) {
      return this.headers.get(name);
    }
  },
  
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: jest.fn().mockResolvedValue(data),
      status: options?.status || 200,
      headers: new Map(),
      cookies: {
        set: jest.fn(),
      },
    })),
    redirect: jest.fn(),
    next: jest.fn(),
  },
}));

// Mock Prisma globally
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

// Mock logger globally
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
