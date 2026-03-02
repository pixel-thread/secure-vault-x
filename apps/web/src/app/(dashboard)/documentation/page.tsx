import React from "react";

const Divider = () => <div className="my-6 h-px w-full bg-zinc-800" />;

const Heading1 = ({ children }: { children: React.ReactNode }) => (
  <h1 className="mb-3 mt-8 text-2xl font-bold text-white">{children}</h1>
);

const Heading2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-2 mt-6 text-xl font-semibold text-zinc-100">{children}</h2>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 text-base leading-relaxed text-zinc-400">{children}</p>
);

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 flex flex-row pl-2">
    <span className="mr-2 text-base text-zinc-400">•</span>
    <span className="flex-1 text-base leading-relaxed text-zinc-400">
      {children}
    </span>
  </div>
);

const NumberedListItem = ({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) => (
  <div className="mb-2 flex flex-row pl-2">
    <span className="mr-2 font-semibold text-zinc-400">{number}.</span>
    <span className="flex-1 text-base leading-relaxed text-zinc-400">
      {children}
    </span>
  </div>
);

export default function DocumentationScreen(): React.ReactNode {
  return (
    <div className="flex h-full flex-col bg-[#09090b]">
      {/* Header */}
      <div className="z-10 flex flex-col justify-end border-b border-zinc-900/80 bg-[#09090b]/90 px-6 pb-6 pt-12 lg:pt-8 w-full">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          README
        </h1>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-500">
          SecureVault X App Documentation
        </p>
      </div>

      <div className="flex-1 w-full overflow-y-auto px-6 pb-6 pt-2 md:px-8">
        <div className="mx-auto w-full max-w-3xl">
          {/* Intro */}
          <Heading1>🔐 SecureVault X App Documentation</Heading1>
          <Paragraph>
            Zero-Knowledge, End-to-End Encrypted Password Manager
            <br />
            Monorepo • TypeScript • Next.js • Tailwind • WebAuthn
          </Paragraph>

          <Divider />

          {/* Why SecureVault X */}
          <Heading2>🚀 Why SecureVault X?</Heading2>
          <Paragraph>
            SecureVault X is a production-grade, zero-knowledge password manager
            built to ensure maximum privacy and offline availability.
          </Paragraph>
          <Paragraph>
            The core philosophy is{" "}
            <span className="font-bold text-white">
              Security through Architecture, not patching
            </span>
            . The system is designed so that even a full backend database
            compromise does not expose your vault contents.
          </Paragraph>
          <div className="mb-4 flex flex-col">
            <ListItem>No plaintext storage</ListItem>
            <ListItem>No encryption keys stored server-side</ListItem>
            <ListItem>Short-lived, heavily rotated tokens</ListItem>
            <ListItem>Strict key lifecycle control</ListItem>
          </div>

          <Divider />

          {/* Architecture & Stack */}
          <Heading1>🏗 Architecture & Stack</Heading1>
          <Paragraph>
            SecureVault X uses a monorepo structure with shared packages across
            mobile and web environments.
          </Paragraph>
          <div className="mb-4 flex flex-col">
            <ListItem>
              <span className="font-bold text-white">Frontend</span>: Next.js,
              React DOM, Tailwind CSS
            </ListItem>
            <ListItem>
              <span className="font-bold text-white">Backend API</span>: Hono,
              TypeScript, PostgreSQL (via Prisma)
            </ListItem>
            <ListItem>
              <span className="font-bold text-white">Authentication</span>:
              Passwordless WebAuthn (Passkeys)
            </ListItem>
            <ListItem>
              <span className="font-bold text-white">Shared Packages</span>:
              Monorepo standardizing Types, Configs, and Cryptography across the
              stack.
            </ListItem>
          </div>

          <Divider />

          {/* Zero-Knowledge Model */}
          <Heading1>🧠 Zero-Knowledge Model</Heading1>
          <Paragraph>SecureVault X is designed so that:</Paragraph>
          <div className="mb-4 flex flex-col">
            <ListItem>
              All encryption happens strictly{" "}
              <span className="font-bold text-white">client-side</span>.
            </ListItem>
            <ListItem>
              The Master Encryption Key (MEK) is generated locally on your
              device.
            </ListItem>
            <ListItem>
              The server only ever receives and stores encrypted blobs.
            </ListItem>
            <ListItem>
              Encryption keys never leave the client unencrypted.
            </ListItem>
          </div>

          <Divider />

          {/* Cryptographic Design */}
          <Heading1>🔐 Cryptographic Design</Heading1>
          <Heading2>Key Hierarchy</Heading2>
          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="font-mono text-sm text-emerald-400">
              Master Encryption Key (MEK)
            </div>
            <div className="my-1 font-mono text-sm text-zinc-500">↓</div>
            <div className="font-mono text-sm text-zinc-300">
              AES-256-GCM vault encryption
            </div>
          </div>
          <Paragraph>
            The MEK is heavily guarded and encrypted via native Device hardware
            (or Web Storage limits) before being stored:
          </Paragraph>
          <div className="mb-4 flex flex-col">
            <ListItem>
              <span className="font-bold text-white">iOS / Android</span>:
              Secure Enclave / Hardware Keystore
            </ListItem>
            <ListItem>
              <span className="font-bold text-white">Web</span>: Encrypted
              LocalStorage mapped to Session Keys
            </ListItem>
          </div>

          <Heading2>Encryption Standards</Heading2>
          <Paragraph>
            All Vault encryption runs on{" "}
            <span className="font-bold text-white">AES-256-GCM</span> using
            unique 12-byte random IVs (No IV Reuse) to ensure Authenticated
            Encryption. Every piece of randomness utilizes cryptographically
            secure RNG native APIs.
          </Paragraph>

          <Divider />

          {/* Authentication */}
          <Heading1>🔑 Authentication (WebAuthn)</Heading1>
          <Paragraph>
            SecureVault uses modern passwordless authentication natively via
            biometric Passkeys (WebAuthn).
          </Paragraph>
          <Paragraph>
            No passwords are ever stored or transmitted. During login, the
            client signs a hardware-bound cryptographic challenge locally which
            the server independently verifies.
          </Paragraph>

          <Divider />

          {/* Sync */}
          <Heading1>🔄 Multi-Device Encrypted Sync</Heading1>
          <Paragraph>When adding a new device to your account:</Paragraph>
          <div className="mb-4 flex flex-col">
            <NumberedListItem number={1}>
              The new device generates a local asymmetric key pair.
            </NumberedListItem>
            <NumberedListItem number={2}>
              An existing, already-trusted device encrypts the MEK with the new
              device&apos;s public key.
            </NumberedListItem>
            <NumberedListItem number={3}>
              The server ferries the encrypted MEK.
            </NumberedListItem>
            <NumberedListItem number={4}>
              The new device decrypts the MEK locally.
            </NumberedListItem>
          </div>
          <Paragraph>
            At no point does the Server ever see the plaintext encryption keys.
          </Paragraph>

          <Divider />

          {/* Offline First */}
          <Heading1>📱 Offline-First Mobile Design</Heading1>
          <Paragraph>
            The mobile application is designed to function entirely offline:
          </Paragraph>
          <div className="mb-4 flex flex-col">
            <ListItem>
              Stores your encrypted vault locally via fast embedded storage
              (SQLite/MMKV).
            </ListItem>
            <ListItem>
              Allows full CRUD (Create, Read, Update, Delete) vault changes
              while offline.
            </ListItem>
            <ListItem>Queues sync operations locally.</ListItem>
            <ListItem>
              Resolves cloud conflicts using smart versioning.
            </ListItem>
            <ListItem>
              Keeps the local vault strictly encrypted at rest at all times.
            </ListItem>
          </div>

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}
