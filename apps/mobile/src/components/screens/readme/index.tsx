import { View, Text, ScrollView } from 'react-native';
import Header from '@components/common/Header';

const Divider = () => <View className="my-6 h-px w-full bg-zinc-200 dark:bg-zinc-800" />;

const Heading1 = ({ children }: { children: React.ReactNode }) => (
  <Text className="mb-3 mt-8 text-2xl font-bold text-zinc-900 dark:text-white">{children}</Text>
);

const Heading2 = ({ children }: { children: React.ReactNode }) => (
  <Text className="mb-2 mt-6 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
    {children}
  </Text>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text className="mb-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
    {children}
  </Text>
);

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <View className="mb-2 flex-row pl-2">
    <Text className="mr-2 text-base text-zinc-600 dark:text-zinc-400">•</Text>
    <Text className="flex-1 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
      {children}
    </Text>
  </View>
);

const NumberedListItem = ({ number, children }: { number: number; children: React.ReactNode }) => (
  <View className="mb-2 flex-row pl-2">
    <Text className="mr-2 font-semibold text-zinc-600 dark:text-zinc-400">{number}.</Text>
    <Text className="flex-1 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
      {children}
    </Text>
  </View>
);

export default function ReadmeScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-[#09090b]">
      <Header title="README" subtitle="How SecureVault X Protects You" />
      <ScrollView className="flex-1 px-6 pb-6 pt-2">
        {/* Intro */}
        <Heading1>🔐 Your Security, Simplified</Heading1>
        <Paragraph>
          SecureVault X is built on one simple rule:{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">
            Your secrets are for your eyes only.
          </Text>
        </Paragraph>
        <Paragraph>
          We use "Zero-Knowledge" architecture. This means our servers are designed to be "blind" to
          your data. Even if our database was fully compromised, your passwords would remain
          unreadable locked safes that only you have the keys to.
        </Paragraph>

        <Divider />

        {/* The Blind Server Analogy */}
        <Heading2>✉️ The "Post Office" Analogy</Heading2>
        <Paragraph>
          Imagine our server is a Post Office. Most apps send your passwords in regular envelopes
          that the postmaster could open.
        </Paragraph>
        <Paragraph>
          SecureVault X is different. You put your secrets in a{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">solid steel safe</Text> before
          heading to the post office. You keep the only key in the world. We store the safe for you,
          but we have no way to see what's inside.
        </Paragraph>

        <Divider />

        {/* The Lifecycle of Your Data */}
        <Heading1>🔄 The Lifecycle of Your Data</Heading1>
        <Paragraph>
          To understand exactly how SecureVault X protects you, let's walk through the journey of
          your data from the moment you log in to the moment it syncs with the cloud.
        </Paragraph>

        <Heading2>Step 1: Secure Login (Identity Verification)</Heading2>
        <Paragraph>
          When you enter your email and password, two things happen simultaneously:
        </Paragraph>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Backend Verification</Text>:
            Your email and a hashed version of your password are sent to the server. The server
            verifies your account and issues a temporary session token.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Salt Retrieval</Text>: The
            server returns your <Text className="italic">Unique Encryption Salt</Text>. This salt
            is key to the next step and is mathematically unique to your account.
          </ListItem>
        </View>

        <Heading2>Step 2: Password-to-MEK Transformation</Heading2>
        <Paragraph>
          This is the most critical security step. Your phone uses the <Text className="font-bold text-zinc-900 dark:text-white">Argon2id</Text>{' '}
          algorithm to combine your <Text className="font-bold">raw password</Text> (which only you know)
          with the <Text className="font-bold">server salt</Text> to derive your Master Encryption Key (MEK).
        </Paragraph>
        <View className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Text className="text-sm italic text-zinc-600 dark:text-zinc-400">
            "Your password is the ingredient, the salt is the secret spice, and Argon2id is the oven.
            The resulting MEK is the only key that can open your vault safes."
          </Text>
        </View>
        <Paragraph>
          If you enter the wrong password, the oven produces the <Text className="italic">wrong key</Text>.
          Because our encryption is mathematical, the wrong key simply cannot unlock your data—it remains
          unreadable garbage.
        </Paragraph>

        <Heading2>Step 3: Vault Decryption (The "Key Check")</Heading2>
        <Paragraph>
          When you open your vault, the app takes the derived MEK and applies it to your stored data using{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">AES-256-GCM</Text>.
        </Paragraph>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold">Correct Password</Text>: The key fits, the "Authentication Tag"
            matches, and your passwords appear instantly in plaintext.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-rose-600 dark:text-rose-400">Incorrect Password</Text>:
            The key doesn't fit. The mathematical check fails, and the app refuses to decrypt,
            ensuring your data stays safe.
          </ListItem>
        </View>

        <Heading2>Step 4: The Blind Sync (Push & Pull)</Heading2>
        <Paragraph>
          Synchronization ensures your data is available on all your devices without the server ever
          seeing it:
        </Paragraph>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold">Pushing Changes</Text>: When you save an item, your phone
            encrypts it locally and sends the <Text className="italic">Encrypted Blob</Text> to the
            server. The server accepts this blob and stores it in our database.
          </ListItem>
          <ListItem>
            <Text className="font-bold">Pulling Changes</Text>: When you log in on another device,
            that device "Pulls" the encrypted blobs. It then uses YOUR password to derive the MEK locally
            and decrypt the items.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">LWW Conflict Resolution</Text>:
            If you changed the same item on two devices, we use "Last-Write-Wins" logic based on
            server-verified timestamps to keep everything aligned.
          </ListItem>
        </View>

        <Heading2>Step 5: The Zero-Knowledge Proof</Heading2>
        <Paragraph>
          To prove our "Blind Server" model, here is the exact list of what we hold:
        </Paragraph>
        <View className="mb-4 rounded-xl border border-zinc-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <Text className="mb-1 font-bold text-emerald-800 dark:text-emerald-400">✅ Server Stores (Metadata):</Text>
          <Text className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            • Your User ID (A random string){'\n'}
            • Encryption Salt (To derive keys locally){'\n'}
            • Timestamps (Sync synchronization){'\n'}
            • Encrypted Blobs (The locked safes)
          </Text>
          <Text className="mb-1 mt-4 font-bold text-rose-800 dark:text-rose-400">❌ Server NEVER Sees (Plaintext):</Text>
          <Text className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            • Your actual Password{'\n'}
            • Your derived Master Key{'\n'}
            • Your Vault content (Names, URLs, Passwords)
          </Text>
        </View>

        <Divider />

        {/* Technical Deep Dive */}
        <Divider />
        <Heading1>🚀 Technical Deep-Dive</Heading1>
        <Paragraph>
          For security professionals and the technically curious, here are the exact specifications
          of our security architecture.
        </Paragraph>

        <Heading2>1. Key Derivation (KDF)</Heading2>
        <Paragraph>
          We use <Text className="font-bold text-zinc-900 dark:text-white">Argon2id</Text> as our
          primary Master Key derivation function. It is currently the industry standard, providing
          superior resistance to GPU and ASIC-based brute force attacks.
        </Paragraph>
        <View className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Text className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            • Mode: Argon2id (Version 1.3){'\n'}
            • Memory Cost: 19,456 KB (~19.5 MB){'\n'}
            • Time Cost (Iterations): 3{'\n'}
            • Parallelism: 1{'\n'}
            • Output Length: 256 bits (32 bytes)
          </Text>
        </View>
        <Paragraph>
          As an alternative or fallback, we support{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">PBKDF2-HMAC-SHA256</Text> with{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">310,000 iterations</Text>,
          meeting OWASP's high-security recommendations.
        </Paragraph>

        <Heading2>2. Vault Encryption (AES-GCM)</Heading2>
        <Paragraph>
          All vault entries are encrypted using{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">AES-256-GCM</Text> (Galois/Counter
          Mode). This provides both confidentiality and data integrity (authenticated encryption).
        </Paragraph>
        <View className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Text className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            • Algorithm: AES-256{'\n'}
            • Mode: GCM (Authenticated Encryption){'\n'}
            • IV Size: 96 bits (12 bytes, unique per entry){'\n'}
            • Auth Tag: 128 bits (16 bytes, appended to cipher)
          </Text>
        </View>

        <Heading2>3. Session & API Security</Heading2>
        <Paragraph>
          Our API uses short-lived JWTs (JSON Web Tokens) with a strict rotation policy to minimize
          the impact of a stolen token.
        </Paragraph>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Access Token</Text>: 5-minute
            lifespan, issued after every successful authentication.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Refresh Token</Text>: 7-day
            lifespan with <Text className="italic">Rotation Enforced</Text>. Using a refresh token
            once invalidates it and issues a new one.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Reuse Detection</Text>: If a
            refresh token is reused, our system triggers a "honeypot" response, revoking ALL active
            sessions for that user account immediately.
          </ListItem>
        </View>

        <Heading2>4. Device-Bound Identity</Heading2>
        <Paragraph>
          Each device generates its own hardware-bound identity using{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">ECDSA P-256</Text>. Requests to
          sensitive endpoints must be signed by the device's private key, which never leaves the
          Secure Enclave.
        </Paragraph>

        {/* Comprehensive Tech Stack */}
        <Heading1>🏗 Full Technical Stack</Heading1>
        <Paragraph>
          SecureVault X is built as a high-performance monorepo using cutting-edge technologies
          standardized for security and scalability.
        </Paragraph>

        <Heading2>Monorepo & Build System</Heading2>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">TurboRepo</Text>: High-performance
            build system for orchestrating tasks across the monorepo.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">pnpm Workspaces</Text>: Efficient
            package management with lightning-fast linking and storage.
          </ListItem>
        </View>

        <Heading2>Mobile App (Frontend)</Heading2>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Expo (SDK 54)</Text>: Modern React
            Native framework with file-based routing via <Text className="italic">Expo Router</Text>.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">NativeWind (Tailwind CSS)</Text>:
            Utility-first styling for consistent UI/UX across light and dark modes.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">TanStack Query</Text>: Robust
            server-state management, caching, and background synchronization.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Zustand</Text>: Simplified
            client-side state management for authentication and global settings.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Drizzle ORM</Text>: Type-safe ORM
            powering our lightning-fast local persistence layer.
          </ListItem>
        </View>

        <Heading2>Backend & Infrastructure</Heading2>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Next.js</Text>: Powering the API
            and centralized web services.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Prisma</Text>: Industry-standard
            ORM for reliable PostgreSQL database interactions.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">PostgreSQL</Text>: Primary relational
            database for encrypted blobs and user account metadata.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Redis (Upstash)</Text>: High-speed
            caching and session management for OTPs and rate-limiting.
          </ListItem>
        </View>

        <Heading2>Internal Shared Packages</Heading2>
        <Paragraph>
          We maintain several internal packages to ensure code reuse and cryptographic consistency:
        </Paragraph>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">@securevault/crypto</Text>:
            Centralized implementation of Argon2id, AES-256-GCM, and ECDSA P-256.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">@securevault/libs</Text>: Shared
            business logic and reusable utility services.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">@securevault/types</Text>: Shared
            TypeScript definitions to ensure end-to-end type safety.
          </ListItem>
        </View>

        <Heading2>DevTools & Quality</Heading2>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Vitest</Text>: High-performance
            testing framework for functional and unit tests.
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">ESLint & Prettier</Text>: Enforcing
            strict coding standards and consistent formatting.
          </ListItem>
        </View>

        <View className="h-12" />
      </ScrollView>
    </View>
  );
}
