import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../src/app/api/webhook/eas/route";
import { NextRequest } from "next/server";
import { verifyExpoSignature } from "../src/utils/eas/verifyExpoSignature";
import { upsertEASWebhook } from "../src/services/easWebhook.service";
import { promoteToAppVersion } from "../src/services/appVersion/promoteToAppVersion";

vi.mock("../src/utils/eas/verifyExpoSignature");
vi.mock("../src/services/easWebhook.service");
vi.mock("../src/services/appVersion/promoteToAppVersion");

describe("EAS Webhook API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if signature is invalid", async () => {
    vi.mocked(verifyExpoSignature).mockReturnValue(false);

    const req = new NextRequest("https://example.com/api/webhook/eas", {
      method: "POST",
      body: JSON.stringify({ id: "123" }),
      headers: { "expo-signature": "invalid" },
    });

    const res = await POST(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(401);
  });

  it("should handle BUILD webhook and promote on success", async () => {
    vi.mocked(verifyExpoSignature).mockReturnValue(true);
    const payload = {
      id: "build-123",
      status: "finished",
      buildDetailsPageUrl: "https://expo.dev/build/123",
      accountName: "test",
      projectName: "test",
      appId: "test",
      platform: "android",
      createdAt: new Date().toISOString(),
      enqueuedAt: new Date().toISOString(),
    };

    const req = new NextRequest("https://example.com/api/webhook/eas", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "expo-signature": "valid" },
    });

    const res = await POST(req, { params: Promise.resolve({}) } as any);
    if (res.status !== 201) {
      console.log("Error Response:", await res.json());
    }
    expect(res.status).toBe(201);
    expect(upsertEASWebhook).toHaveBeenCalledWith("BUILD", expect.objectContaining({ id: "build-123" }));
    expect(promoteToAppVersion).toHaveBeenCalled();
  });

  it("should handle UPDATE webhook", async () => {
    vi.mocked(verifyExpoSignature).mockReturnValue(true);
    const payload = {
      id: "update-123",
      status: "finished",
      updateDetailsPageUrl: "https://expo.dev/update/123",
      accountName: "test",
      projectName: "test",
      appId: "test",
      platform: "android",
      createdAt: new Date().toISOString(),
    };

    const req = new NextRequest("https://example.com/api/webhook/eas", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "expo-signature": "valid" },
    });

    const res = await POST(req, { params: Promise.resolve({}) } as any);
    if (res.status !== 201) {
      console.log("Error Response:", await res.json());
    }
    expect(res.status).toBe(201);
    expect(upsertEASWebhook).toHaveBeenCalledWith("UPDATE", expect.objectContaining({ id: "update-123" }));
    expect(promoteToAppVersion).not.toHaveBeenCalled();
  });
});
