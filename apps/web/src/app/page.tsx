"use client";

import React from "react";
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Cloud,
  ArrowRight,
  Download,
  Mail,
  Github,
  Twitter,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-slate-100">
      {/* Headers */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <GlassCard className="mx-auto flex max-w-5xl items-center justify-between !py-3 !px-6 backdrop-blur-xl bg-white/5 border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={28} />
            <span className="text-xl font-bold tracking-tight">
              SecureVault <span className="text-emerald-500">X</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-emerald-400 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-emerald-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => router.push("/docs")}
              className="hover:text-emerald-400 transition-colors"
            >
              Documentation
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="hover:text-emerald-400 transition-colors"
            >
              Contact
            </button>
          </nav>
        </GlassCard>
      </header>

      <main className="pt-32 pb-20">
        {/* HERO SECTION */}
        <section
          id="hero"
          className="mx-auto flex max-w-6xl flex-col-reverse items-center justify-between gap-12 px-6 py-12 md:flex-row md:py-24"
        >
          <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              v2.0 Liquid Release
            </div>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tighter md:text-7xl">
              Military-Grade <br />
              <span className="text-gradient">Digital Security</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-slate-400">
              Your passwords, cards, and secure notes encrypted locally and
              synced across all your devices with unbreakable precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <GlassButton
                variant="prominent"
                className="text-lg !px-8"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/appVersion/latest");
                    if (response.ok) {
                      const data = await response.json();
                      if (data.downloadUrl) {
                        window.location.href = data.downloadUrl;
                      }
                    } else {
                      console.error("Failed to fetch latest version");
                      // Fallback or toast could be added here
                    }
                  } catch (error) {
                    console.error("Error during download request:", error);
                  }
                }}
              >
                <Download size={20} />
                Download App
              </GlassButton>
              <GlassButton
                className="text-lg !px-8"
                onClick={() => scrollToSection("features")}
              >
                Explore Features
              </GlassButton>
            </div>
          </div>

          {/* Hero Mockup */}
          <div className="relative flex-1 w-full max-w-sm">
            <div className="absolute inset-0 -z-10 animate-pulse-glow rounded-[3rem] bg-emerald-500/20 blur-3xl"></div>
            <GlassCard
              interactive
              className="animate-float aspect-[1/2] border-white/20 bg-white/5 !p-2 flex flex-col justify-between overflow-hidden shadow-2xl shadow-emerald-900/50"
            >
              <div className="flex justify-center pt-8 pb-4">
                <ShieldCheck
                  size={64}
                  className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                />
              </div>
              <div className="p-4 space-y-4">
                <div className="h-20 rounded-2xl bg-white/10 p-4">
                  <div className="h-3 w-1/2 rounded bg-white/20 mb-3"></div>
                  <div className="h-5 w-3/4 rounded bg-white/30"></div>
                </div>
                <div className="h-20 rounded-2xl bg-white/10 p-4">
                  <div className="h-3 w-1/3 rounded bg-white/20 mb-3"></div>
                  <div className="h-5 w-5/6 rounded bg-white/30"></div>
                </div>
                <div className="h-20 rounded-2xl bg-[rgba(59,130,246,0.2)] p-4 border border-blue-400/30">
                  <div className="h-3 w-1/2 rounded bg-blue-200/50 mb-3"></div>
                  <div className="h-5 w-2/3 rounded bg-blue-100/80"></div>
                </div>
              </div>
              <div className="mx-auto mb-2 h-1 w-1/3 rounded-full bg-white/20"></div>
            </GlassCard>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="mx-auto max-w-5xl px-6 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl text-white mb-4">
              Why SecureVault X?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We built SecureVault to be the fortress for your digital identity,
              ensuring your secrets remain yours.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard
              interactive
              className="group border-white/5 bg-[#0f172a]/40 hover:bg-[#1e293b]/60"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-blue-500/20 p-3 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                <Lock size={28} />
              </div>
              <h3 className="mb-2 text-xl font-bold">
                Zero-Knowledge Architecture
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Your data is encrypted and decrypted on your local device. We
                never have access to your master password or your unencrypted
                data.
              </p>
            </GlassCard>

            <GlassCard
              interactive
              className="group border-white/5 bg-[#0f172a]/40 hover:bg-[#1e293b]/60"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-purple-500/20 p-3 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                <Cloud size={28} />
              </div>
              <h3 className="mb-2 text-xl font-bold">Seamless Cloud Sync</h3>
              <p className="text-slate-400 leading-relaxed">
                Changes made on one device instantly propagate to all your
                authorized endpoints via our secure, encrypted websocket relays.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* FEATURES / PRODUCT DETAIL SECTION */}
        <section id="features" className="relative py-24">
          <div className="absolute inset-0 bg-blue-500/5 blur-[100px] -z-10"></div>
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-5xl text-white mb-6">
                Designed for Excellence
              </h2>
              <p className="text-slate-400 text-lg">
                A beautiful liquid glass interface that feels right at home on
                iOS and the Web.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Secure Notes",
                  desc: "Store private journals, recovery codes, and sensitive information.",
                  icon: <Smartphone />,
                  color: "text-emerald-400",
                },
                {
                  title: "Card Wallet",
                  desc: "Keep your credit cards handy for quick and secure online checkouts.",
                  icon: <Lock />,
                  color: "text-blue-400",
                },
                {
                  title: "Password Generator",
                  desc: "Create complex, uncrackable passwords with a single tap.",
                  icon: <ShieldCheck />,
                  color: "text-purple-400",
                },
              ].map((feature, idx) => (
                <GlassCard
                  key={idx}
                  interactive
                  className="flex flex-col items-center text-center !p-8 bg-white/[0.03] border-white/10 border-t-white/20 inset-shadow-sm"
                >
                  <div
                    className={`mb-6 p-4 rounded-full bg-white/5 shadow-inner ${feature.color}`}
                  >
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* SCREENSHOTS ALONG SCROLL */}
        <section className="mx-auto max-w-6xl px-6 py-24 overflow-hidden">
          <h2 className="text-center text-3xl font-bold mb-12">
            Experience the App
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide py-4 px-[10vw] md:px-0 md:justify-center">
            {[1, 2, 3].map((i) => (
              <GlassCard
                key={i}
                className="min-w-[280px] md:min-w-[320px] aspect-[9/19] flex-shrink-0 snap-center bg-gradient-to-b from-white/10 to-transparent border-white/20 relative overflow-hidden group"
              >
                {/* Mockup screen content */}
                <div className="absolute top-0 left-0 right-0 h-10 flex justify-center items-center">
                  <div className="w-1/3 h-4 bg-black/50 rounded-b-xl backdrop-blur-md"></div>
                </div>
                <div className="mt-12 space-y-4 px-4">
                  <div className="text-lg font-bold">Vault {i}</div>
                  <div className="space-y-3">
                    <div className="h-16 rounded-xl bg-white/5 border border-white/10"></div>
                    <div className="h-16 rounded-xl bg-white/5 border border-white/10"></div>
                    <div className="h-16 rounded-xl bg-white/5 border border-white/10"></div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="mx-auto max-w-3xl px-6 py-24">
          <GlassCard className="relative overflow-hidden border-emerald-500/20 bg-emerald-950/20 !p-10 md:!p-16 text-center">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl mix-blend-screen"></div>

            <Mail size={48} className="mx-auto mb-6 text-emerald-400" />
            <h2 className="mb-4 text-3xl font-bold">Get In Touch</h2>
            <p className="mb-8 text-slate-300">
              Have questions about enterprise deployment or our security model?
              Our engineering team is ready to assist.
            </p>

            <form className="mx-auto flex max-w-md flex-col gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-emerald-500/50 focus:bg-black/60 backdrop-blur-md transition-all"
              />
              <GlassButton
                variant="prominent"
                className="w-full !py-4"
                onClick={(e) => e.preventDefault()}
              >
                <span>Send Message</span>
                <ArrowRight size={18} />
              </GlassButton>
            </form>
          </GlassCard>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md pt-16 pb-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-emerald-500" size={24} />
                <span className="font-bold">SecureVault</span>
              </div>
              <p className="text-sm text-slate-400">
                The most secure way to store your digital life. Built with
                military-grade encryption.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Download Apps
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <div className="flex gap-4 mt-6">
                  <a
                    href="#"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Twitter size={20} />
                  </a>
                  <a
                    href="#"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Github size={20} />
                  </a>
                </div>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SecureVault X. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
