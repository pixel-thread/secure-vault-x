import { beforeAll, afterAll, vi } from "vitest";

// Set environment variables for tests
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
process.env.JWT_SECRET = "mysecret";

beforeAll(() => {
  // Global setup before all tests
  vi.mock("next/server", () => ({
    NextRequest: vi.fn(),
    NextResponse: {
      json: vi.fn((data, init) => ({
        status: init?.status || 200,
        json: async () => data,
      })),
      next: vi.fn(),
    },
  }));
});

afterAll(() => {
  // Global cleanup after all tests
  vi.clearAllMocks();
});
