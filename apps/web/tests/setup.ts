import { beforeAll, afterAll, vi } from "vitest";

// Set environment variables for tests
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
process.env.JWT_SECRET = "mysecret";

beforeAll(() => {
  // Global setup before all tests
  vi.mock("next/server", () => ({
    NextRequest: class {
      url: string;
      headers: { get: (name: string) => string | null };
      body: string;
      constructor(url: string, init?: any) {
        this.url = url;
        const headerMap = new Map<string, string>(Object.entries(init?.headers || {}));
        this.headers = {
          get: (name: string) => headerMap.get(name.toLowerCase()) || null
        };
        this.body = init?.body || "";
      }
      async text() { return this.body; }
      async json() { return JSON.parse(this.body); }
    },
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
