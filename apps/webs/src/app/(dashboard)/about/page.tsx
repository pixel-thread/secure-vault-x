import React from "react";
import { Info, Github, Twitter, Globe } from "lucide-react";
import Link from "next/link";

export default function AboutScreen(): React.ReactNode {
 return (
  <div className="flex h-full flex-col bg-[#09090b]">
   {/* Header */}
   <div className="z-10 flex flex-col justify-end border-b border-zinc-900/80 bg-[#09090b]/90 px-6 pb-6 pt-12 lg:pt-8 w-full">
    <h1 className="text-3xl font-extrabold tracking-tight text-white">
     About Us
    </h1>
    <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-500">
     The SecureVault X Team
    </p>
   </div>

   <div className="flex-1 w-full overflow-y-auto p-6 md:p-8 pb-32">
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center pt-8">
     <div className="mb-8 flex flex-col items-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 shadow-2xl shadow-emerald-500/10">
       <Info size={64} className="text-emerald-500" />
      </div>
      <h2 className="text-4xl font-extrabold text-white">
       SecureVault <span className="text-emerald-500">X</span>
      </h2>
      <p className="mt-2 text-lg text-zinc-400">
       Version 1.0.0 (Web Edition)
      </p>
     </div>

     <p className="mb-10 text-center text-lg leading-relaxed text-zinc-300">
      A next-generation, open-source password manager designed with strict
      zero-knowledge principles. Built with Next.js, React Native, and
      robust cryptographic standards.
     </p>

     <div className="w-full space-y-4">
      <Link
       href="https://github.com/securevault"
       target="_blank"
       className="flex w-full items-center rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-colors hover:bg-zinc-800/60"
      >
       <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
        <Github size={24} className="text-white" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">Source Code</h3>
        <p className="text-zinc-400">
         View strictly audited cryptography
        </p>
       </div>
      </Link>

      <Link
       href="https://securevault.com"
       target="_blank"
       className="flex w-full items-center rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-colors hover:bg-zinc-800/60"
      >
       <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
        <Globe size={24} className="text-blue-400" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">Website</h3>
        <p className="text-zinc-400">Read our bug bounty program</p>
       </div>
      </Link>

      <Link
       href="https://twitter.com/securevault"
       target="_blank"
       className="flex w-full items-center rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-colors hover:bg-zinc-800/60"
      >
       <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
        <Twitter size={24} className="text-sky-400" />
       </div>
       <div className="flex-1">
        <h3 className="text-lg font-bold text-white">Updates</h3>
        <p className="text-zinc-400">Follow for patch notes & news</p>
       </div>
      </Link>
     </div>
    </div>
   </div>
  </div>
 );
}
