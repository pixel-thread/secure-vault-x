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
      <Header title="README" subtitle="SecureVault X App Documentation" />
      <ScrollView className="flex-1 px-6 pb-6 pt-2">
        {/* Intro */}
        <Heading1>🔐 SecureVault X App Documentation</Heading1>
        <Paragraph>
          Zero-Knowledge, End-to-End Encrypted Password Manager{'\n'}
          Monorepo • TypeScript • Hono • Expo • WebAuthn
        </Paragraph>

        <Divider />

        {/* Why SecureVault X */}
        <Heading2>🚀 Why SecureVault X?</Heading2>
        <Paragraph>
          SecureVault X is a production-grade, zero-knowledge password manager built to ensure
          maximum privacy and offline availability.
        </Paragraph>
        <Paragraph>
          The core philosophy is{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">
            Security through Architecture, not patching
          </Text>
          . The system is designed so that even a full backend database compromise does not expose
          your vault contents.
        </Paragraph>
        <View className="mb-4">
          <ListItem>No plaintext storage</ListItem>
          <ListItem>No encryption keys stored server-side</ListItem>
          <ListItem>Short-lived, heavily rotated tokens</ListItem>
          <ListItem>Strict key lifecycle control</ListItem>
        </View>

        <Divider />

        {/* Architecture & Stack */}
        <Heading1>🏗 Architecture & Stack</Heading1>
        <Paragraph>
          SecureVault X uses a monorepo structure with shared packages across mobile and web
          environments.
        </Paragraph>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Frontend</Text>: React Native,
            Expo, NativeWind (Tailwind CSS for Native)
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Backend API</Text>: Hono,
            TypeScript, PostgreSQL (via Prisma)
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Authentication</Text>:
            Passwordless WebAuthn (Passkeys)
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Shared Packages</Text>:
            Monorepo standardizing Types, Configs, and Cryptography across the stack.
          </ListItem>
        </View>

        <Divider />

        {/* Zero-Knowledge Model */}
        <Heading1>🧠 Zero-Knowledge Model</Heading1>
        <Paragraph>SecureVault X is designed so that:</Paragraph>
        <View className="mb-4">
          <ListItem>
            All encryption happens strictly{' '}
            <Text className="font-bold text-zinc-900 dark:text-white">client-side</Text>.
          </ListItem>
          <ListItem>The Master Encryption Key (MEK) is generated locally on your device.</ListItem>
          <ListItem>The server only ever receives and stores encrypted blobs.</ListItem>
          <ListItem>Encryption keys never leave the client unencrypted.</ListItem>
        </View>

        <Divider />

        {/* Cryptographic Design */}
        <Heading1>🔐 Cryptographic Design</Heading1>
        <Heading2>Key Hierarchy</Heading2>
        <View className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Text className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
            Master Encryption Key (MEK)
          </Text>
          <Text className="my-1 font-mono text-sm text-zinc-400 dark:text-zinc-500">↓</Text>
          <Text className="font-mono text-sm text-zinc-600 dark:text-zinc-300">
            AES-256-GCM vault encryption
          </Text>
        </View>
        <Paragraph>
          The MEK is heavily guarded and encrypted via native Device hardware before being stored:
        </Paragraph>
        <View className="mb-4">
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">iOS</Text>: Secure Enclave
          </ListItem>
          <ListItem>
            <Text className="font-bold text-zinc-900 dark:text-white">Android</Text>: Hardware
            Keystore
          </ListItem>
        </View>

        <Heading2>Encryption Standards</Heading2>
        <Paragraph>
          All Vault encryption runs on{' '}
          <Text className="font-bold text-zinc-900 dark:text-white">AES-256-GCM</Text> using unique
          12-byte random IVs (No IV Reuse) to ensure Authenticated Encryption. Every piece of
          randomness utilizes cryptographically secure RNG native APIs.
        </Paragraph>

        <Divider />

        {/* Authentication */}
        <Heading1>🔑 Authentication (WebAuthn)</Heading1>
        <Paragraph>
          SecureVault uses modern passwordless authentication natively via biometric Passkeys
          (WebAuthn).
        </Paragraph>
        <Paragraph>
          No passwords are ever stored or transmitted. During login, the client signs a
          hardware-bound cryptographic challenge locally which the server independently verifies.
        </Paragraph>

        <Divider />

        {/* Sync */}
        <Heading1>🔄 Multi-Device Encrypted Sync</Heading1>
        <Paragraph>When adding a new device to your account:</Paragraph>
        <View className="mb-4">
          <NumberedListItem number={1}>
            The new device generates a local asymmetric key pair.
          </NumberedListItem>
          <NumberedListItem number={2}>
            An existing, already-trusted device encrypts the MEK with the new device&apos;s public
            key.
          </NumberedListItem>
          <NumberedListItem number={3}>The server ferries the encrypted MEK.</NumberedListItem>
          <NumberedListItem number={4}>The new device decrypts the MEK locally.</NumberedListItem>
        </View>
        <Paragraph>At no point does the Server ever see the plaintext encryption keys.</Paragraph>

        <Divider />

        {/* Offline First */}
        <Heading1>📱 Offline-First Mobile Design</Heading1>
        <Paragraph>The mobile application is designed to function entirely offline:</Paragraph>
        <View className="mb-4">
          <ListItem>
            Stores your encrypted vault locally via fast embedded storage (SQLite/MMKV).
          </ListItem>
          <ListItem>
            Allows full CRUD (Create, Read, Update, Delete) vault changes while offline.
          </ListItem>
          <ListItem>Queues sync operations locally.</ListItem>
          <ListItem>Resolves cloud conflicts using smart versioning.</ListItem>
          <ListItem>Keeps the local vault strictly encrypted at rest at all times.</ListItem>
        </View>

        <View className="h-12" />
      </ScrollView>
    </View>
  );
}
