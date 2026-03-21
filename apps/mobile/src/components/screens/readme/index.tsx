import { View, Text, ScrollView } from 'react-native';
import Header from '@components/common/Header';
import { Container } from '@securevault/ui-native';
import { ScreenContainer } from '@src/components/common/ScreenContainer';

const Divider = () => <View className="my-6 h-px w-full bg-zinc-200 dark:bg-zinc-800" />;

const Heading1 = ({ children }: { children: React.ReactNode }) => (
  <Text className="mb-3 mt-8 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{children}</Text>
);

const Heading2 = ({ children }: { children: React.ReactNode }) => (
  <Text className="mb-2 mt-6 text-xl font-bold text-zinc-800 dark:text-zinc-100">
    {children}
  </Text>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text className="mb-4 text-base font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
    {children}
  </Text>
);

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <View className="mb-2 flex-row pl-2">
    <Text className="mr-2 text-base text-emerald-500">•</Text>
    <Text className="flex-1 text-base font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
      {children}
    </Text>
  </View>
);

/**
 * Technical documentation screen for users.
 */
export default function ReadmeScreen() {
  return (
    <Container>
      <ScreenContainer>
        <Header title="The Manual" subtitle="How we stay unbreakable" />
        <ScrollView className="flex-1 px-6 pb-6 pt-2">
          {/* Intro */}
          <Heading1>🔐 Security, but make it simple</Heading1>
          <Paragraph>
            SecureVault X is built on one vibe:{' '}
            <Text className="font-bold text-zinc-900 dark:text-white">
              Your secrets are for your eyes only.
            </Text>
          </Paragraph>
          <Paragraph>
            We use "Zero-Knowledge" architecture. It means our servers are literally blind to your data. Even if hackers tried to gatecrash our database, your passwords would stay locked in unbreakable safes only you can crack.
          </Paragraph>

          <Divider />

          {/* The Post Office Analogy */}
          <Heading2>✉️ The Post Office Vibe Check</Heading2>
          <Paragraph>
            Think of our server as a Post Office. Most apps send your passwords in regular envelopes that someone could peek into.
          </Paragraph>
          <Paragraph>
            SecureVault X is different. You put your secrets in a{' '}
            <Text className="font-bold text-zinc-900 dark:text-white">solid titanium safe</Text> before you even show up. You keep the only key in existence. We store the safe for you, but we can't see the loot.
          </Paragraph>

          <Divider />

          {/* Data Journey */}
          <Heading1>🔄 The Data Journey</Heading1>
          <Paragraph>
            Let's trace how your data moves from login to the cloud without losing its cool.
          </Paragraph>

          <Heading2>Step 1: The Entrance</Heading2>
          <Paragraph>
            When you drop your handle and the key, two things happen:
          </Paragraph>
          <View className="mb-4">
            <ListItem>
              <Text className="font-bold text-zinc-900 dark:text-white">The Server Nods</Text>: We verify who you are and give you a temporary pass.
            </ListItem>
            <ListItem>
              <Text className="font-bold text-zinc-900 dark:text-white">Salt Retrieval</Text>: We send back your <Text className="italic">Unique Encryption Salt</Text>—the secret ingredient for the next step.
            </ListItem>
          </View>

          <Heading2>Step 2: The Key Forge</Heading2>
          <Paragraph>
            Your phone uses the <Text className="font-bold text-zinc-900 dark:text-white">Argon2id</Text>{' '}
            algorithm to mix your <Text className="font-bold">raw password</Text> with the <Text className="font-bold">server salt</Text> to forge your Master Encryption Key (MEK).
          </Paragraph>
          <View className="mb-4 rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <Text className="text-sm font-medium italic text-zinc-600 dark:text-zinc-400">
              "Password is the spark, salt is the fuel, and Argon2id is the forge. The resulting MEK is the only key that fits your vault."
            </Text>
          </View>
          <Paragraph>
            Wrong password? The forge makes a fake key. Because it's all math, a fake key just generates gibberish. Your data stays safe and unreadable.
          </Paragraph>

          <Heading2>Step 3: The Big Sync</Heading2>
          <Paragraph>
            Syncing keeps your stash available everywhere without exposing it:
          </Paragraph>
          <View className="mb-4">
            <ListItem>
              <Text className="font-bold text-zinc-900 dark:text-white">Pushing Blobs</Text>: Your phone encrypts data locally and sends the <Text className="italic">Encrypted Blob</Text> to us. We store the safe, no questions asked.
            </ListItem>
            <ListItem>
              <Text className="font-bold text-zinc-900 dark:text-white">Pulling Blobs</Text>: Your other devices "Pull" the safe and use YOUR local password to forge the key and unlock it.
            </ListItem>
          </View>

          <Heading2>The Zero-Knowledge Receipt</Heading2>
          <View className="mb-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 dark:bg-emerald-500/10">
            <Text className="mb-1 font-bold text-emerald-800 dark:text-emerald-400 text-lg">✅ What we have:</Text>
            <Text className="text-base font-medium text-zinc-600 dark:text-zinc-400">
              • Random User ID{'\n'}
              • Encryption Salt{'\n'}
              • Timestamps{'\n'}
              • Encrypted Blobs
            </Text>
            <Text className="mb-1 mt-6 font-bold text-rose-800 dark:text-rose-400 text-lg">❌ What we NEVER see:</Text>
            <Text className="text-base font-medium text-zinc-600 dark:text-zinc-400">
              • Your actual Password{'\n'}
              • Your forged Master Key{'\n'}
              • Your Vault secrets (Names, URLs, keys)
            </Text>
          </View>

          <Divider />

          <Heading1>🚀 Technical Specs</Heading1>
          <Paragraph>
            For the techies and security pros, here's the heavy lifting under the hood.
          </Paragraph>

          <Heading2>1. Key Derivation (KDF)</Heading2>
          <Paragraph>
            <Text className="font-bold text-zinc-900 dark:text-white">Argon2id</Text> is our main forge. It's the industry gold standard for brick-walling brute force attacks.
          </Paragraph>
          <View className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <Text className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Argon2id v1.3 • 19.5 MB Memory • 3 Iterations
            </Text>
          </View>

          <Heading2>2. Vault Encryption (AES-GCM)</Heading2>
          <Paragraph>
            We use <Text className="font-bold text-zinc-900 dark:text-white">AES-256-GCM</Text> for everything in the vault. Authenticated encryption at its finest.
          </Paragraph>
          
          <Heading2>3. Token Rotation</Heading2>
          <Paragraph>
            Short-lived JWTs and enforced rotation. If someone tries to reuse a token, we instantly kill ALL sessions. Zero tolerance.
          </Paragraph>

          <View className="h-12" />
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}

