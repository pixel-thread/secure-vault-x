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

const API_BASE = "http://localhost:3000";

interface DeviceItem {
 id: string;
 deviceName: string;
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
  fetch(`${API_BASE}/api/devices`, {
   headers: { Authorization: `Bearer ${jwtToken}` },
  })
   .then((res) => res.json())
   .then((data) => {
    if (data.success && data.data) setDevices(data.data);
   })
   .catch(console.error);

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

 // ── Remove Device ──
 const handleRemoveDevice = useCallback(
  async (deviceId: string, deviceName: string) => {
   if (!jwtToken) return;
   if (!confirm(`Remove "${deviceName}" from trusted devices?`)) return;

   try {
    const res = await fetch(`${API_BASE}/api/devices/${deviceId}`, {
     method: "DELETE",
     headers: { Authorization: `Bearer ${jwtToken}` },
    });
    const data = await res.json();
    if (data.success) {
     setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    }
   } catch {
    alert("Failed to remove device");
   }
  },
  [jwtToken],
 );

 return (
  <div className="flex h-full flex-col bg-[#09090b]">
   {/* Header */}
   <div className="z-10 flex flex-col justify-end border-b border-zinc-900/80 bg-[#09090b]/90 px-6 pb-6 pt-12 lg:pt-8 w-full">
    <h1 className="text-3xl font-extrabold tracking-tight text-white">
     Settings
    </h1>
    <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-500">
     Device Preferences
    </p>
   </div>

   <div className="flex-1 w-full overflow-y-auto p-6 md:p-8 pb-32">
    <div className="mx-auto w-full max-w-2xl">
     {/* Security Controls */}
     <h2 className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
      Security Controls
     </h2>
     <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 shadow-sm">
      {/* MFA Toggle */}
      <button
       className="flex w-full items-center p-5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800 text-left"
       onClick={handleMfaToggle}
       disabled={mfaLoading}
      >
       <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80">
        <ShieldCheck size={22} className="text-emerald-500" />
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
        className={`h-6 w-11 rounded-full transition-colors ${mfaEnabled ? "bg-emerald-500" : "bg-zinc-700"
         } relative`}
       >
        <div
         className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow ${mfaEnabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
       </div>
      </button>
     </div>

     {/* Trusted Devices */}
     <h2 className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
      Trusted Devices
     </h2>
     <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 shadow-sm">
      {devices.length === 0 ? (
       <div className="flex items-center justify-center p-6">
        <p className="text-sm text-zinc-400">No devices registered</p>
       </div>
      ) : (
       devices.map((device, index) => (
        <div
         key={device.id}
         className={`flex items-center p-5 transition-colors hover:bg-zinc-800/60 ${index < devices.length - 1
           ? "border-b border-zinc-800/50"
           : ""
          }`}
        >
         <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80">
          <Smartphone size={22} className="text-emerald-500" />
         </div>
         <div className="flex-1">
          <h3 className="text-lg font-bold text-white">
           {device.deviceName}
          </h3>
          <p className="text-sm text-zinc-400">
           Added{" "}
           {new Date(device.createdAt).toLocaleDateString()}
          </p>
         </div>
         <button
          onClick={() =>
           handleRemoveDevice(device.id, device.deviceName)
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 transition-colors hover:bg-red-500/20"
         >
          <Trash2 size={18} className="text-red-500" />
         </button>
        </div>
       ))
      )}
     </div>

     {/* Data Management */}
     <h2 className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
      Data Management
     </h2>
     <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 shadow-sm">
      <button
       className="flex w-full items-center p-5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800 text-left"
       onClick={handleExportVault}
      >
       <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80">
        <Download size={22} className="text-emerald-500" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">Export Vault</h3>
        <p className="text-sm text-zinc-400">
         Download decrypted JSON
        </p>
       </div>
      </button>
     </div>

     {/* Danger Zone */}
     <h2 className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-red-500/80">
      Danger Zone
     </h2>
     <div className="mb-8 overflow-hidden rounded-3xl border border-red-900/40 bg-zinc-900/50 shadow-sm">
      <button
       className="flex w-full items-center p-5 transition-colors hover:bg-red-500/10 active:bg-red-500/20 text-left"
       onClick={handlePurge}
      >
       <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
        <AlertTriangle size={22} className="text-red-500" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-red-500">
         Purge Enclave
        </h3>
        <p className="text-sm text-red-400/80">Destroys local keys</p>
       </div>
      </button>
     </div>

     {/* Logout Button */}
     <button
      className="flex w-full items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/80 py-4 font-bold text-zinc-300 shadow-sm transition-colors hover:bg-zinc-800 active:bg-zinc-700"
      onClick={handleLogout}
     >
      <LogOut size={22} className="mr-2 text-zinc-400" />
      Sign Out Device
     </button>
    </div>
   </div>
  </div>
 );
}
