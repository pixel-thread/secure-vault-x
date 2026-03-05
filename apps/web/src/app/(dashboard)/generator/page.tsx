"use client";

import React, { useState, useCallback } from "react";
import { RefreshCw, Copy } from 'lucide-react';
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";

export default function GeneratorScreen(): React.ReactNode {
 const [password, setPassword] = useState("Generating...");
 const [length, setLength] = useState(16);
 const [useUppercase, setUseUppercase] = useState(true);
 const [useLowercase, setUseLowercase] = useState(true);
 const [useNumbers, setUseNumbers] = useState(true);
 const [useSymbols, setUseSymbols] = useState(true);

 const generatePassword = useCallback(() => {
  let chars = "";
  if (useUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (useLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (useNumbers) chars += "0123456789";
  if (useSymbols) chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  if (chars === "") {
   setPassword("Select at least one option");
   return;
  }

  let result = "";
  for (let i = 0; i < length; i++) {
   result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  setPassword(result);
 }, [length, useUppercase, useLowercase, useNumbers, useSymbols]);

 // Initial generation
 useState(() => {
  generatePassword();
 });

 const handleCopy = () => {
  navigator.clipboard.writeText(password);
  alert("Copied to clipboard!");
 };

 return (
  <div className="flex h-full flex-col text-white w-full">
   {/* Header */}
   <div className="z-10 rounded-lg flex flex-col justify-end border-b border-white/5 bg-black/40 px-6 pb-6 pt-12 lg:pt-8 w-full backdrop-blur-md">
    <h1 className="text-3xl font-extrabold tracking-tight">
     Generator
    </h1>
    <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-400">
     Cryptographically Secure
    </p>
   </div>

   <div className="flex-1 w-full overflow-y-auto p-6 md:p-8">
    <div className="mx-auto flex w-full max-w-lg flex-col items-center">
     <GlassCard className="mb-8 mt-8 flex min-h-40 w-full items-center justify-center rounded-3xl !py-8 !px-6 bg-white/[0.02]">
      <h2 className="text-center font-mono text-3xl font-bold tracking-widest text-emerald-400 break-all drop-shadow-md">
       {password}
      </h2>
     </GlassCard>

     <div className="mb-10 flex w-full flex-row gap-4">
      <GlassButton
       onClick={handleCopy}
       className="flex-1 py-4 hover:border-white/20 active:scale-95"
      >
       <Copy size={20} className="mr-2 text-zinc-300" />
       Copy
      </GlassButton>
      <GlassButton
       variant="prominent"
       onClick={generatePassword}
       className="flex-1 py-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 text-[#022c22] font-bold"
      >
       <RefreshCw size={20} className="mr-2 text-[#022c22]" />
       Generate
      </GlassButton>
     </div>

     <div className="w-full">
      <h3 className="mb-4 ml-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
       Parameters
      </h3>

      <GlassCard className="!p-0 overflow-hidden bg-white/[0.03] border-white/10">
       <div className="border-b border-white/5 p-6 bg-white/[0.01]">
        <div className="mb-4 flex flex-row items-center justify-between">
         <span className="text-lg font-bold text-white">Length</span>
         <span className="text-xl font-extrabold text-emerald-400 drop-shadow-sm">
          {length}
         </span>
        </div>
        <input
         type="range"
         min="8"
         max="64"
         value={length}
         onChange={(e) => {
          setLength(parseInt(e.target.value));
          generatePassword();
         }}
         className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
       </div>

       <label className="flex cursor-pointer items-center border-b border-white/5 p-6 transition-colors hover:bg-white/5">
        <div className="flex-1">
         <span className="text-lg font-bold text-white">
          Uppercase
         </span>
         <p className="text-sm text-zinc-400">A-Z</p>
        </div>
        <input
         type="checkbox"
         checked={useUppercase}
         onChange={(e) => {
          setUseUppercase(e.target.checked);
          generatePassword();
         }}
         className="h-6 w-6 rounded text-emerald-500 accent-emerald-500 cursor-pointer border-white/20 bg-black/40"
        />
       </label>

       <label className="flex cursor-pointer items-center border-b border-white/5 p-6 transition-colors hover:bg-white/5">
        <div className="flex-1">
         <span className="text-lg font-bold text-white">
          Lowercase
         </span>
         <p className="text-sm text-zinc-400">a-z</p>
        </div>
        <input
         type="checkbox"
         checked={useLowercase}
         onChange={(e) => {
          setUseLowercase(e.target.checked);
          generatePassword();
         }}
         className="h-6 w-6 rounded text-emerald-500 accent-emerald-500 cursor-pointer border-white/20 bg-black/40"
        />
       </label>

       <label className="flex cursor-pointer items-center border-b border-white/5 p-6 transition-colors hover:bg-white/5">
        <div className="flex-1">
         <span className="text-lg font-bold text-white">Numbers</span>
         <p className="text-sm text-zinc-400">0-9</p>
        </div>
        <input
         type="checkbox"
         checked={useNumbers}
         onChange={(e) => {
          setUseNumbers(e.target.checked);
          generatePassword();
         }}
         className="h-6 w-6 rounded text-emerald-500 accent-emerald-500 cursor-pointer border-white/20 bg-black/40"
        />
       </label>

       <label className="flex cursor-pointer items-center p-6 transition-colors hover:bg-white/5">
        <div className="flex-1">
         <span className="text-lg font-bold text-white">Symbols</span>
         <p className="text-sm text-zinc-400">!@#$%^&*</p>
        </div>
        <input
         type="checkbox"
         checked={useSymbols}
         onChange={(e) => {
          setUseSymbols(e.target.checked);
          generatePassword();
         }}
         className="h-6 w-6 rounded text-emerald-500 accent-emerald-500 cursor-pointer border-white/20 bg-black/40"
        />
       </label>
      </GlassCard>
     </div>
    </div>
   </div>
  </div>
 );
}
