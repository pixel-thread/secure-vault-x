import { Container } from '@securevault/ui-native';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import Header from '@components/common/Header';
import { ScreenContainer } from '@src/components/common/ScreenContainer';
import AppAppearanceSection from './AppAppearanceSection';
import SecurityControlsSection from './SecurityControlsSection';
import PendingOtpsSection from './PendingOtpsSection';
import TrustedDevicesSection from './TrustedDevicesSection';
import DataManagementSection from './DataManagementSection';
import DangerZoneSection from './DangerZoneSection';
import SignOutButton from './SignOutButton';

/**
 * Renders the settings screen for managing device and account preferences.
 */
export default function SettingsScreen() {
  const [isCurrentDeviceTrusted, setIsCurrentDeviceTrusted] = useState(false);

  return (
    <Container>
      <Header title="The Control Center" subtitle="Your vibe, your rules" />

      <ScreenContainer>
        <ScrollView
          className="flex-1 p-6"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}>
          <AppAppearanceSection />
          <SecurityControlsSection />
          <PendingOtpsSection isCurrentDeviceTrusted={isCurrentDeviceTrusted} />
          <TrustedDevicesSection
            onDevicesLoad={(devices, currentDeviceId) => {
              const current = devices.find((d) => d.deviceIdentifier === currentDeviceId);
              setIsCurrentDeviceTrusted(!!current?.isTrusted);
            }}
          />
          <DataManagementSection />
          <DangerZoneSection />
          <SignOutButton />
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}
