import React from "react";
import { Info, Github, Twitter, Globe } from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";

export default function AboutScreen(): React.ReactNode {
 return (
  <div className="flex h-full flex-col text-white w-full">
   {/* Header */}
   <div className="z-10 rounded-lg flex flex-col justify-end border-b border-white/5 bg-black/40 px-6 pb-6 pt-12 lg:pt-8 w-full backdrop-blur-md">
    <h1 className="text-3xl font-extrabold tracking-tight">
     About Us
    </h1>
    <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-400">
     The SecureVault X Team
    </p>
   </div>

   <div className="flex-1 w-full overflow-y-auto p-6 md:p-8 pb-32">
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center pt-8">
     <div className="mb-12 flex flex-col items-center animate-float">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-md">
       <Info size={64} className="text-emerald-400 drop-shadow-md" />
      </div>
      <h2 className="text-4xl font-extrabold tracking-tight">
       SecureVault <span className="text-emerald-400">X</span>
      </h2>
      <p className="mt-3 text-lg text-zinc-400 font-medium tracking-wide">
       Version 1.0.0 (Web Edition)
      </p>
     </div>

     <GlassCard className="mb-12 text-center !p-8 bg-white/[0.02]">
      <p className="text-lg leading-relaxed text-zinc-300">
       A next-generation, open-source password manager designed with strict
       zero-knowledge principles. Built with Next.js, React Native, and
       robust cryptographic standards.
      </p>
     </GlassCard>

     <div className="w-full space-y-4">
      <Link href="https://github.com/securevault" target="_blank" className="block outline-none">
       <GlassCard interactive className="flex w-full items-center !p-6 bg-white/[0.02] hover:bg-white/[0.04]">
        <div className="mr-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 border border-white/10 shadow-inner">
         <Github size={28} className="text-white drop-shadow-sm" />
        </div>
        <div className="flex-1">
         <h3 className="text-lg font-bold text-white">Source Code</h3>
         <p className="text-zinc-400 text-sm mt-0.5">
          View strictly audited cryptography
         </p>
        </div>
       </GlassCard>
      </Link>

      <Link href="https://securevault.com" target="_blank" className="block outline-none">
       <GlassCard interactive className="flex w-full items-center !p-6 bg-white/[0.02] hover:bg-white/[0.04]">
        <div className="mr-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 border border-white/10 shadow-inner">
         <Globe size={28} className="text-blue-400 drop-shadow-sm" />
        </div>
        <div className="flex-1">
         <h3 className="text-lg font-bold text-white">Website</h3>
         <p className="text-zinc-400 text-sm mt-0.5">Read our bug bounty program</p>
        </div>
       </GlassCard>
      </Link>

      <Link href="https://twitter.com/securevault" target="_blank" className="block outline-none">
       <GlassCard interactive className="flex w-full items-center !p-6 bg-white/[0.02] hover:bg-white/[0.04]">
        <div className="mr-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 border border-white/10 shadow-inner">
         <Twitter size={28} className="text-sky-400 drop-shadow-sm" />
        </div>
        <div className="flex-1">
         <h3 className="text-lg font-bold text-white">Updates</h3>
         <p className="text-zinc-400 text-sm mt-0.5">Follow for patch notes & news</p>
        </div>
       </GlassCard>
      </Link>
     </div>
    </div>
   </div>
  </div>
 );
}
