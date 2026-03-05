import { vi } from "vitest";

process.env.JWT_SECRET = "test-secret-for-vitest";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

class RedisMock {
 constructor() { }
 on() { }
 get() { return null; }
 set() { return "OK"; }
 setex() { return "OK"; }
 del() { return 1; }
 incr() { return 1; }
 expire() { return 1; }
 multi() {
  return {
   incr: () => this,
   expire: () => this,
   exec: () => [[null, 1], [null, 1]]
  };
 }
}

// Mock ioredis completely so tests run natively without needing a docker container
vi.mock("ioredis", () => {
 return {
  default: RedisMock,
  Redis: RedisMock,
 };
});
