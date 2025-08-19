// Mock Next.js server-side APIs for testing
export const NextRequest = class MockNextRequest {
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
};

export const NextResponse = {
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
};

// Mock the entire Next.js module
jest.mock('next/server', () => ({
  NextRequest,
  NextResponse,
}));
