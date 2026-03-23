"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ArrowLeft } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";

export default function SignupScreen(): React.ReactNode {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    // Mock Signup
    router.push("/");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-8 text-white">
      <div className="absolute top-8 left-8">
        <Link href="/">
          <GlassButton className="!px-4 !py-2 text-sm text-zinc-300">
            <ArrowLeft size={16} />
            Back to Home
          </GlassButton>
        </Link>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center">
        <GlassCard className="w-full flex-col items-center p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-lg shadow-emerald-500/20 animate-pulse-glow">
              <UserPlus size={48} className="text-emerald-500" />
            </div>
            <h1 className="text-center text-3xl font-extrabold tracking-tighter text-white">
              Create Account
            </h1>
            <p className="mt-2 text-center text-sm font-medium tracking-wide text-zinc-400">
              Join SecureVault X today
            </p>
          </div>

          <form onSubmit={handleSignup} className="w-full space-y-5">
            <div className="flex flex-col space-y-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Email
              </label>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md px-5 py-4 text-base text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md px-5 py-4 text-base text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <GlassButton
              type="submit"
              variant="prominent"
              className="mt-8 w-full !py-4"
            >
              <UserPlus size={20} />
              <span>Sign Up</span>
            </GlassButton>

            <div className="mt-6 flex flex-row gap-1 justify-center">
              <span className="text-zinc-400 text-sm">
                Already have an account?{" "}
              </span>
              <Link
                href="/login"
                className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Log in
              </Link>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
