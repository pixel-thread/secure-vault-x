"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Key, CreditCard, Copy, Plus, X, Eye, EyeOff, RefreshCw, ArchiveRestore } from 'lucide-react';
import { useAuthStore } from "@/store/auth";
import { encryptData, decryptData } from "@securevault/crypto";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";

export type SecretType = "password" | "card";

interface BaseSecret {
  id: string;
  type: SecretType;
  note?: string;
}

interface PasswordSecret extends BaseSecret {
  type: "password";
  website: string;
  username: string;
  secretInfo: string;
}

interface CardSecret extends BaseSecret {
  type: "card";
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}

export type VaultSecret = PasswordSecret | CardSecret;

const API_VAULT = "http://localhost:3000/vault";

export default function VaultScreen(): React.ReactNode {
  const { jwtToken, mek } = useAuthStore();
  const [vault, setVault] = useState<VaultSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<SecretType>("password");

  // Password fields
  const [newWebsite, setNewWebsite] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Card fields
  const [newCardName, setNewCardName] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newExp, setNewExp] = useState("");
  const [newCvv, setNewCvv] = useState("");

  // Shared
  const [newNote, setNewNote] = useState("");

  const generatePassword = useCallback((length = 32) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }, []);

  const syncVault = useCallback(async () => {
    if (!jwtToken || !mek) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_VAULT, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.encryptedData) {
          const envelope = JSON.parse(data.encryptedData);
          if (envelope.e && envelope.iv) {
            const decryptedData = await decryptData<VaultSecret[]>(
              envelope.e,
              envelope.iv,
              mek,
            );
            setVault(decryptedData);
            setVersion(data.version);
          }
        } else {
          setVault([]);
        }
      }
    } catch (e: unknown) {
      console.warn("Sync failed (using local mock data instead):", e);
    } finally {
      setLoading(false);
    }
  }, [jwtToken, mek]);

  useEffect(() => {
    syncVault();
  }, [syncVault]);

  useEffect(() => {
    if (!loading && vault.length === 0) {
      setVault([
        {
          id: "1",
          type: "password",
          website: "https://google.com",
          username: "user@gmail.com",
          secretInfo: "password123",
        },
        {
          id: "2",
          type: "card",
          cardholderName: "John Doe",
          cardNumber: "4111222233334444",
          expirationDate: "12/26",
          cvv: "123",
        },
        {
          id: "3",
          type: "password",
          website: "https://bank.com",
          username: "user123",
          secretInfo: "bank_auth",
        },
      ]);
    }
  }, [loading, vault.length]);

  const handleAddNewItem = async () => {
    let newItem: VaultSecret;

    if (selectedType === "password") {
      if (!newWebsite || !newUsername || !newPassword) {
        alert("Please fill in Website, Username and Password");
        return;
      }
      newItem = {
        id: Date.now().toString(),
        type: "password",
        website: newWebsite,
        username: newUsername,
        secretInfo: newPassword,
        note: newNote,
      };
    } else {
      if (!newCardName || !newCardNumber || !newExp || !newCvv) {
        alert("Please fill in all Card details");
        return;
      }
      newItem = {
        id: Date.now().toString(),
        type: "card",
        cardholderName: newCardName,
        cardNumber: newCardNumber,
        expirationDate: newExp,
        cvv: newCvv,
        note: newNote,
      };
    }

    const newVaultState = [newItem, ...vault];
    setVault(newVaultState);
    setModalVisible(false);

    setNewWebsite("");
    setNewUsername("");
    setNewPassword("");
    setNewCardName("");
    setNewCardNumber("");
    setNewExp("");
    setNewCvv("");
    setNewNote("");

    if (!jwtToken || !mek) return;

    try {
      const envelope = await encryptData(newVaultState, mek);

      const payload = {
        encryptedData: JSON.stringify({
          e: envelope.encryptedData,
          iv: envelope.iv,
        }),
        version: version + 1,
      };

      const res = await fetch(API_VAULT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setVersion(data.version);
      } else {
        const errData = await res.json();
        console.warn(
          "Save Conflict",
          errData.error || "Failed to push vault up",
        );
      }
    } catch (e) {
      console.error(e);
      console.warn("Encryption bounds failed locally.");
    }
  };

  return (
    <div className="flex h-full flex-col relative w-full text-white">
      {/* Header */}
      <div className="z-10 rounded-lg flex items-center justify-between border-b border-white/5 bg-black/40 px-6 pb-6 pt-12 lg:pt-8 w-full backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            My Vault
          </h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            End-to-End Encrypted
          </p>
        </div>
        <GlassButton
          className="!p-3 shadow-md"
          onClick={syncVault}
        >
          {loading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          ) : (
            <RefreshCw size={24} className="text-emerald-400" />
          )}
        </GlassButton>
      </div>

      <div className="flex-1 w-full overflow-y-auto px-4 py-8 md:px-6 lg:px-8 pb-32">
        {!loading && vault.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center animate-float">
            <GlassCard className="mb-6 rounded-full !p-8 border-dashed border-white/20 bg-white/5">
              <ArchiveRestore size={64} className="text-zinc-500" />
            </GlassCard>
            <h2 className="text-xl font-bold text-zinc-300">
              Your Vault is Empty
            </h2>
            <p className="mt-2 text-center text-zinc-500">
              Tap the button below to add your first encrypted secret.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            {vault.map((item) => (
              <GlassCard
                key={item.id}
                interactive
                className="flex items-center !p-5 w-full bg-white/[0.03] border-white/10"
              >
                <div className="mr-5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-inner">
                  {item.type === "password" ? (
                    <Key size={24} className="text-emerald-400 drop-shadow-md" />
                  ) : (
                    <CreditCard size={24} className="text-emerald-400 drop-shadow-md" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {item.type === "password" ? (
                    <>
                      <h3 className="mb-1 truncate text-lg font-bold text-white md:text-xl">
                        {item.website}
                      </h3>
                      <p className="truncate text-sm font-medium text-zinc-400">
                        {item.username}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="mb-1 truncate text-lg font-bold text-white md:text-xl">
                        {item.cardholderName}
                      </h3>
                      <p className="font-mono text-sm font-medium tracking-widest text-zinc-400">
                        •••• {item.cardNumber.slice(-4)}
                      </p>
                    </>
                  )}
                </div>
                <button className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10 active:scale-95">
                  <Copy size={20} className="text-zinc-400 hover:text-white" />
                </button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <button
        className="fixed bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-transform active:scale-95 hover:bg-emerald-400 z-20 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]"
        onClick={() => {
          setNewWebsite("https://");
          setNewPassword(generatePassword(32));
          setSelectedType("password");
          setModalVisible(true);
        }}
      >
        <Plus size={32} className="text-[#022c22]" />
      </button>

      {/* Modal View */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm pt-10 sm:items-center animate-in fade-in duration-200">
          <GlassCard className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-black/40 border-white/20 !p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add Secret</h2>
              <button
                onClick={() => setModalVisible(false)}
                className="rounded-full bg-white/5 p-2 hover:bg-white/10 transition-colors"
              >
                <X size={24} className="text-zinc-400" />
              </button>
            </div>

            <div className="mb-6 flex space-x-2 rounded-xl bg-black/40 p-1 border border-white/5">
              <button
                className={`flex-1 rounded-lg py-2 font-bold transition-colors ${selectedType === "password"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-500 hover:text-white"
                  }`}
                onClick={() => setSelectedType("password")}
              >
                Password
              </button>
              <button
                className={`flex-1 rounded-lg py-2 font-bold transition-colors ${selectedType === "card"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-500 hover:text-white"
                  }`}
                onClick={() => setSelectedType("card")}
              >
                Bank Card
              </button>
            </div>

            <div className="mb-6 flex flex-col space-y-5">
              {selectedType === "password" ? (
                <>
                  <div className="flex flex-col">
                    <label className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                      value={newWebsite}
                      onChange={(e) => setNewWebsite(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Username / Email
                    </label>
                    <input
                      type="text"
                      placeholder="john@example.com"
                      className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Password
                    </label>
                    <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 pr-2 focus-within:border-emerald-500/50 focus-within:bg-black/40 transition-colors">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="flex-1 bg-transparent px-5 py-4 text-white outline-none"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        className="p-3"
                        onMouseDown={() => setShowPassword(true)}
                        onMouseUp={() => setShowPassword(false)}
                        onMouseLeave={() => setShowPassword(false)}
                      >
                        {showPassword ? (
                          <Eye size={22} className="text-emerald-400" />
                        ) : (
                          <EyeOff size={22} className="text-zinc-500 hover:text-zinc-300" />
                        )}
                      </button>
                      <button
                        className="p-3 hover:opacity-80 transition-opacity"
                        onClick={() => setNewPassword(generatePassword(32))}
                      >
                        <RefreshCw size={22} className="text-zinc-500 hover:text-zinc-300" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col">
                    <label className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                      value={newCardName}
                      onChange={(e) => setNewCardName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 font-mono text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-1 flex-col">
                      <label className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Expires
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                        value={newExp}
                        onChange={(e) => setNewExp(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <label className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                        value={newCvv}
                        onChange={(e) => setNewCvv(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="flex flex-col">
                <label className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Note
                </label>
                <textarea
                  placeholder="Any extra details..."
                  className="min-h-[100px] resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
            </div>

            <GlassButton
              variant="prominent"
              onClick={handleAddNewItem}
              className="w-full !py-4 shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck size={20} className="text-[#022c22]" />
              Save to Vault
            </GlassButton>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
