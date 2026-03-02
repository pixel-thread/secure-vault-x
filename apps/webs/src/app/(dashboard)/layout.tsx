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
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-white">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-zinc-900/80 bg-[#09090b]/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ShieldCheck size={28} className="text-emerald-500" />
          <span className="text-xl font-extrabold tracking-tight">
            SecureVault <span className="text-emerald-500">X</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 focus:outline-none"
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-zinc-900/80 bg-[#09090b] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="hidden lg:flex h-24 items-center justify-center border-b border-zinc-900/80">
            <div className="flex flex-col items-center">
              <ShieldCheck size={36} className="text-emerald-500 mb-2" />
              <div className="text-2xl font-extrabold tracking-tight">
                SecureVault <span className="text-emerald-500">X</span>
              </div>
            </div>
          </div>

          <div className="lg:hidden h-16 border-b border-zinc-900/80 mb-2"></div>

          {/* Nav Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            <div className="mb-4 ml-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Menu
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-4 transition-colors ${isActive
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                    }`}
                >
                  <Icon
                    size={24}
                    className={isActive ? "text-emerald-500" : "text-zinc-500"}
                  />
                  <span
                    className={`text-lg font-medium ${isActive ? "font-bold" : ""}`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-zinc-900/80 p-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 py-4 font-bold text-zinc-300 shadow-sm transition-colors hover:bg-zinc-800"
            >
              <LogOut size={22} className="text-zinc-400" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="flex min-h-full flex-col">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
