"use client";

import React from "react";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import {
 ShieldCheck,
 Cpu,
 Smartphone,
 Server,
 Download,
 AlertTriangle,
 LogOut,
 ChevronRight,
} from "lucide-react";

export default function SettingsScreen(): React.ReactNode {
 const logout = useAuthStore((state) => state.logout);
 const purgeLocalEnclave = useAuthStore(
  (state) => state.purgeLocalEnclave,
 );
 const router = useRouter();

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
     <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 shadow-sm cursor-pointer">
      <div className="flex items-center border-b border-zinc-800/50 p-5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800">
       <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80">
        <Cpu size={22} className="text-emerald-500" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">Hardware Keys</h3>
        <p className="text-sm text-zinc-400">Manage NFC/USB Keys</p>
       </div>
       <ChevronRight size={20} className="text-zinc-500" />
      </div>

      <div className="flex items-center p-5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800">
       <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80">
        <ShieldCheck size={22} className="text-emerald-500" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">
         Security Preferences
        </h3>
        <p className="text-sm text-zinc-400">Biometrics & Auto-lock</p>
       </div>
       <ChevronRight size={20} className="text-zinc-500" />
      </div>
     </div>

     {/* Sync & Devices */}
     <h2 className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
      Sync & Devices
     </h2>
     <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 shadow-sm cursor-pointer">
      <div className="flex items-center border-b border-zinc-800/50 p-5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800">
       <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80">
        <Smartphone size={22} className="text-emerald-500" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">
         Trusted Devices
        </h3>
        <p className="text-sm text-zinc-400">Manage paired devices</p>
       </div>
       <ChevronRight size={20} className="text-zinc-500" />
      </div>

      <div className="flex items-center border-b border-zinc-800/50 p-5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800">
       <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80">
        <Server size={22} className="text-emerald-500" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">
         Sync Configuration
        </h3>
        <p className="text-sm text-zinc-400">
         Server endpoints & polling
        </p>
       </div>
       <ChevronRight size={20} className="text-zinc-500" />
      </div>

      <div className="flex items-center p-5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800">
       <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80">
        <Download size={22} className="text-emerald-500" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">Export Vault</h3>
        <p className="text-sm text-zinc-400">
         Download encrypted backup
        </p>
       </div>
       <ChevronRight size={20} className="text-zinc-500" />
      </div>
     </div>

     {/* Danger Zone */}
     <h2 className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-red-500/80">
      Danger Zone
     </h2>
     <div className="mb-8 overflow-hidden rounded-3xl border border-red-900/40 bg-zinc-900/50 shadow-sm cursor-pointer">
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
