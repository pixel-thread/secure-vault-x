"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { decryptData } from "@securevault/crypto";
import {
  ShieldCheck,
  Smartphone,
  Download,
  AlertTriangle,
  LogOut,
  Trash2,
  Fingerprint,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const API_BASE = "http://localhost:3000";

interface DeviceItem {
  id: string;
  deviceName: string;
  isTrusted: boolean;
  createdAt: string;
}

export default function SettingsScreen(): React.ReactNode {
  const { logout, jwtToken, mek } = useAuthStore();
  const purgeLocalEnclave = useAuthStore(
    (state) => state.purgeLocalEnclave,
  );
  const router = useRouter();

  // Device state
  const [devices, setDevices] = useState<DeviceItem[]>([]);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  // Fetch user info to get MFA status and devices
  useEffect(() => {
    if (!jwtToken) return;

    // Fetch devices
    const fetchDevices = () => {
      fetch(`${API_BASE}/api/devices`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) setDevices(data.data);
        })
        .catch(console.error);
    };
    fetchDevices();

    // Fetch user for MFA status
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMfaEnabled(data.data.mfaEnabled ?? data.data.isMfaEnable ?? false);
        }
      })
      .catch(console.error);
  }, [jwtToken]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handlePurge = async () => {
    if (
      confirm(
        "Are you sure you want to permanently delete your local secure keys? This will log you out immediately.",
      )
    ) {
      await purgeLocalEnclave();
      router.push("/");
    }
  };

  // ── Export Vault ──
  const handleExportVault = useCallback(async () => {
    if (!jwtToken || !mek) {
      alert("Not authenticated or MEK not available");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/vault`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const result = await response.json();

      if (!result.success || !result.data) {
        alert("Vault is empty — nothing to export");
        return;
      }

      const entries = Array.isArray(result.data) ? result.data : [];
      if (entries.length === 0) {
        alert("Vault is empty — nothing to export");
        return;
      }

      const decrypted: any[] = [];
      for (const entry of entries) {
        if (!entry.encryptedData || !entry.iv) continue;
        try {
          const payload = await decryptData<any>(
            entry.encryptedData,
            entry.iv,
            mek,
          );
          decrypted.push(payload);
        } catch {
          console.warn("Skipped undecryptable entry");
        }
      }

      if (decrypted.length === 0) {
        alert("No entries could be decrypted");
        return;
      }

      const json = JSON.stringify(decrypted, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const a = document.createElement("a");
      a.href = url;
      a.download = `securevault-export-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to export vault");
    }
  }, [jwtToken, mek]);

  // ── MFA Toggle ──
  const handleMfaToggle = useCallback(async () => {
    if (!jwtToken) return;
    const newValue = !mfaEnabled;

    const msg = newValue
      ? "Enable 2FA? You'll need an OTP code on each login."
      : "Disable 2FA? Your account will be less secure.";
    if (!confirm(msg)) return;

    setMfaLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/mfa/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ enabled: newValue }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMfaEnabled(data.data.mfaEnabled);
      }
    } catch {
      alert("Failed to toggle MFA");
    } finally {
      setMfaLoading(false);
    }
  }, [jwtToken, mfaEnabled]);

  const getActingDeviceId = (): string => {
    // Try to find the local device ID from localStorage
    const stored = localStorage.getItem("SV_DEVICE_ID");
    if (stored) return stored;
    // Fallback to first trusted device for this prototype
    const trusted = devices.find((d) => d.isTrusted);
    return trusted?.id ?? "";
  };

  // ── Remove Device ──
  const handleRemoveDevice = useCallback(
    async (deviceId: string, deviceName: string) => {
      if (!jwtToken) return;
      if (!confirm(`Remove "${deviceName}" from trusted devices?`)) return;

      try {
        const actingId = getActingDeviceId();
        const res = await fetch(`${API_BASE}/api/devices/${deviceId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "X-Device-Id": actingId,
          },
        });
        const data = await res.json();
        if (data.success) {
          setDevices((prev) => prev.filter((d) => d.id !== deviceId));
        } else {
          alert(data.error?.message || "Failed to remove device");
        }
      } catch {
        alert("Failed to remove device");
      }
    },
    [jwtToken, devices],
  );

  // ── Toggle Trust ──
  const handleToggleTrust = useCallback(
    async (deviceId: string, deviceName: string, isTrusted: boolean) => {
      if (!jwtToken) return;
      const msg = isTrusted
        ? `Mark "${deviceName}" as a trusted device? It will be able to manage other devices.`
        : `Remove trust from "${deviceName}"? It will lose device management capabilities.`;

      if (!confirm(msg)) return;

      try {
        const actingId = getActingDeviceId();
        const res = await fetch(`${API_BASE}/api/devices/${deviceId}/trust`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
            "X-Device-Id": actingId,
          },
          body: JSON.stringify({ isTrusted }),
        });
        const data = await res.json();
        if (data.success) {
          setDevices((prev) =>
            prev.map((d) => (d.id === deviceId ? { ...d, isTrusted } : d)),
          );
        } else {
          alert(data.error?.message || "Failed to update trust status");
        }
      } catch {
        alert("Failed to update trust status");
      }
    },
    [jwtToken, devices],
  );

  return (
    <div className="flex h-full flex-col text-white w-full">
      {/* Header */}
      <div className="z-10 rounded-lg flex flex-col justify-end border-b border-white/5 bg-black/40 px-6 pb-6 pt-12 lg:pt-8 w-full backdrop-blur-md">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-400">
          Device Preferences
        </p>
      </div>

      <div className="flex-1 w-full overflow-y-auto p-6 md:p-8 pb-32">
        <div className="mx-auto w-full max-w-2xl space-y-10">

          {/* Security Controls */}
          <div>
            <h2 className="mb-3 ml-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Security Controls
            </h2>
            <GlassCard className="!p-0 overflow-hidden bg-white/[0.03] border-white/10">
              <button
                className="flex w-full items-center p-6 transition-colors hover:bg-white/5 active:bg-white/10 text-left"
                onClick={handleMfaToggle}
                disabled={mfaLoading}
              >
                <div className="mr-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                  <ShieldCheck size={24} className="text-emerald-400 drop-shadow-md" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    Two-Factor Auth
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {mfaEnabled ? "Enabled — OTP on login" : "Disabled"}
                  </p>
                </div>
                <div
                  className={`h-6 w-11 rounded-full transition-colors ${mfaEnabled ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-black/60 border border-white/10"
                    } relative`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow ${mfaEnabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                  />
                </div>
              </button>
            </GlassCard>
          </div>

          {/* Trusted Devices */}
          <div>
            <h2 className="mb-3 ml-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Trusted Devices
            </h2>
            <GlassCard className="!p-0 overflow-hidden bg-white/[0.03] border-white/10">
              {devices.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-sm text-zinc-400">No devices registered</p>
                </div>
              ) : (
                devices.map((device, index) => (
                  <div
                    key={device.id}
                    className={`flex items-center p-6 transition-colors hover:bg-white/5 ${index < devices.length - 1
                      ? "border-b border-white/5"
                      : ""
                      }`}
                  >
                    <div
                      className={`mr-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${device.isTrusted
                        ? "bg-emerald-500/10 border-emerald-500/20 shadow-inner"
                        : "bg-black/40 border-white/5 shadow-inner"
                        }`}
                    >
                      {device.isTrusted ? (
                        <ShieldCheck size={24} className="text-emerald-400 drop-shadow-md" />
                      ) : (
                        <Smartphone size={24} className="text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">
                        {device.deviceName}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {device.isTrusted ? "Trusted • " : "Untrusted • "}
                        {new Date(device.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleToggleTrust(
                            device.id,
                            device.deviceName,
                            !device.isTrusted,
                          )
                        }
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${device.isTrusted
                          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                          }`}
                        title={device.isTrusted ? "Untrust Device" : "Trust Device"}
                      >
                        <ShieldCheck size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleRemoveDevice(device.id, device.deviceName)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                        title="Remove Device"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </GlassCard>
          </div>

          {/* Data Management */}
          <div>
            <h2 className="mb-3 ml-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Data Management
            </h2>
            <GlassCard className="!p-0 overflow-hidden bg-white/[0.03] border-white/10">
              <button
                className="flex w-full items-center p-6 transition-colors hover:bg-white/5 active:bg-white/10 text-left"
                onClick={handleExportVault}
              >
                <div className="mr-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                  <Download size={24} className="text-emerald-400 drop-shadow-md" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Export Vault</h3>
                  <p className="text-sm text-zinc-400">
                    Download decrypted JSON offline backup
                  </p>
                </div>
              </button>
            </GlassCard>
          </div>

          {/* Danger Zone */}
          <div className="pt-4">
            <h2 className="mb-3 ml-2 text-xs font-bold uppercase tracking-wider text-red-500">
              Danger Zone
            </h2>
            <GlassCard className="!p-0 overflow-hidden bg-red-950/20 border-red-900/40">
              <button
                className="flex w-full items-center p-6 transition-colors hover:bg-red-900/30 active:bg-red-900/40 text-left"
                onClick={handlePurge}
              >
                <div className="mr-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={24} className="text-red-400 drop-shadow-md" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-400">
                    Purge Enclave
                  </h3>
                  <p className="text-sm text-red-400/80">Permanently destroys local keys</p>
                </div>
              </button>
            </GlassCard>
          </div>

          {/* Logout Button */}
          <div className="pt-8">
            <button
              className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 py-4 font-bold text-zinc-300 shadow-custom transition-all hover:bg-white/5 hover:border-white/20 hover:text-white interactive-glass"
              onClick={handleLogout}
            >
              <LogOut size={22} className="mr-2 text-red-400" />
              Sign Out Current Device
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
