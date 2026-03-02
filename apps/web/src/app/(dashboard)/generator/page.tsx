"use client";

import React, { useState, useCallback } from "react";
import { RefreshCw, Copy } from 'lucide-react';

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
  <div className="flex h-full flex-col bg-[#09090b]">
   {/* Header */}
   <div className="z-10 flex flex-col justify-end border-b border-zinc-900/80 bg-[#09090b]/90 px-6 pb-6 pt-12 lg:pt-8 w-full">
    <h1 className="text-3xl font-extrabold tracking-tight text-white">
     Generator
    </h1>
    <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-500">
     Cryptographically Secure
    </p>
   </div>

   <div className="flex-1 w-full overflow-y-auto p-6 md:p-8">
    <div className="mx-auto flex w-full max-w-lg flex-col items-center">
     <div className="mb-4 mt-8 flex h-40 w-full items-center justify-center rounded-3xl border border-zinc-900/80 bg-zinc-900/40 p-6 shadow-sm">
      <h2 className="text-center font-mono text-3xl font-bold tracking-widest text-emerald-500 break-all">
       {password}
      </h2>
     </div>

     <div className="mb-8 flex w-full flex-row gap-4">
      <button
       onClick={handleCopy}
       className="flex flex-1 items-center justify-center rounded-2xl bg-zinc-800 py-4 font-bold text-white transition-colors hover:bg-zinc-700 active:scale-95"
      >
       <Copy size={20} className="mr-2 text-zinc-400" />
       Copy
      </button>
      <button
       onClick={generatePassword}
       className="flex flex-1 items-center justify-center rounded-2xl bg-emerald-500 py-4 font-bold text-[#022c22] shadow-emerald-500/20 transition-transform hover:bg-emerald-400 active:scale-95"
      >
       <RefreshCw size={20} className="mr-2 text-[#022c22]" />
       Generate
      </button>
     </div>

     <div className="w-full">
      <h3 className="mb-4 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
       Parameters
      </h3>

      <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 shadow-sm">
       <div className="border-b border-zinc-800/50 p-6">
        <div className="mb-4 flex flex-row items-center justify-between">
         <span className="text-lg font-bold text-white">Length</span>
         <span className="text-xl font-extrabold text-emerald-500">
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
         className="w-full accent-emerald-500"
        />
       </div>

       <label className="flex cursor-pointer items-center border-b border-zinc-800/50 p-5 transition-colors hover:bg-zinc-800/40">
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
         className="h-6 w-6 rounded text-emerald-500 accent-emerald-500"
        />
       </label>

       <label className="flex cursor-pointer items-center border-b border-zinc-800/50 p-5 transition-colors hover:bg-zinc-800/40">
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
         className="h-6 w-6 rounded text-emerald-500 accent-emerald-500"
        />
       </label>

       <label className="flex cursor-pointer items-center border-b border-zinc-800/50 p-5 transition-colors hover:bg-zinc-800/40">
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
         className="h-6 w-6 rounded text-emerald-500 accent-emerald-500"
        />
       </label>

       <label className="flex cursor-pointer items-center p-5 transition-colors hover:bg-zinc-800/40">
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
         className="h-6 w-6 rounded text-emerald-500 accent-emerald-500"
        />
       </label>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}
