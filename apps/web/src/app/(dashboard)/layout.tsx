"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Key,
  RefreshCw,
  Settings,
  BookOpen,
  Info,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { name: "My Vault", href: "/vault", icon: Key },
  { name: "Generator", href: "/generator", icon: RefreshCw },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Documentation", href: "/documentation", icon: BookOpen },
  { name: "About Us", href: "/about", icon: Info },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-100 relative">
      <div className="absolute inset-0 bg-blue-500/5 blur-[100px] -z-10"></div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-black/40 px-4 backdrop-blur-xl rounded-lg">
        <div className="flex items-center gap-2">
          <ShieldCheck size={28} className="text-emerald-400" />
          <span className="text-xl font-extrabold tracking-tight">
            SecureVault <span className="text-emerald-500">X</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-300 focus:outline-none interactive-glass rounded-lg"
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/10 bg-black/20 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="hidden lg:flex h-24 items-center justify-center border-b border-white/5 rounded-lg">
            <div className="flex flex-col items-center">
              <ShieldCheck size={36} className="text-emerald-400 mb-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
              <div className="text-2xl font-extrabold tracking-tight text-white gap-2">
                SecureVault <span className="text-emerald-500 font-black">X</span>
              </div>
            </div>
          </div>

          <div className="lg:hidden h-16 border-b border-white/5 mb-2"></div>

          {/* Nav Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            <div className="mb-4 ml-2 text-xs font-bold uppercase tracking-widest text-emerald-500/60 drop-shadow-sm">
              Dashboard
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-300 ${isActive
                    ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] inset-shadow-sm border border-white/5"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <Icon
                    size={22}
                    className={isActive ? "text-emerald-400" : "text-zinc-500"}
                  />
                  <span
                    className={`text-base font-medium ${isActive ? "font-bold tracking-wide" : ""}`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 py-3.5 font-semibold text-zinc-300 transition-all hover:bg-white/10 hover:border-white/20 hover:text-white interactive-glass"
            >
              <LogOut size={20} className="text-zinc-400 group-hover:text-red-400 transition-colors" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="flex min-h-full flex-col p-6 lg:p-10">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
