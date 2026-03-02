"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { ShieldCheck, LogIn } from "lucide-react";

export default function LoginScreen(): React.ReactNode {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await setAuth(email, "mock_jwt_token");
      router.push("/vault");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || 'Authentication Failed');
      } else {
        alert('Authentication Failed');
      }
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#09090b] p-8 text-white">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="mb-12 flex flex-col items-center">
          <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={48} className="text-emerald-500" />
          </div>
          <h1 className="text-center text-4xl font-extrabold tracking-tighter text-white">
            SecureVault <span className="text-emerald-500">X</span>
          </h1>
          <p className="mt-3 text-center text-base font-medium tracking-wide text-zinc-400">
            Military-grade encryption for your digital life.
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Email
            </label>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-lg text-white outline-none focus:border-emerald-500/50 focus:bg-zinc-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-lg text-white outline-none focus:border-emerald-500/50 focus:bg-zinc-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-emerald-500 py-4 font-bold text-[#022c22] text-lg shadow-xl shadow-emerald-500/20 transition-transform active:scale-[0.98] hover:bg-emerald-600"
          >
            <LogIn size={24} className="mr-2 text-[#064e3b]" />
            <span>Login</span>
          </button>

          <div className="mt-6 flex flex-row gap-1 justify-center pb-20">
            <span className="text-zinc-400">Don&apos;t have an account? </span>
            <Link
              href="/signup"
              className="font-bold text-emerald-500 hover:text-emerald-400"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
