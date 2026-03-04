import { View, ScrollView } from 'react-native';
import Header from '../../Header';
import { useState } from 'react';
import AppAppearanceSection from './AppAppearanceSection';
import SecurityControlsSection from './SecurityControlsSection';
import PendingOtpsSection from './PendingOtpsSection';
import TrustedDevicesSection from './TrustedDevicesSection';
import DataManagementSection from './DataManagementSection';
import DangerZoneSection from './DangerZoneSection';
import SignOutButton from './SignOutButton';

export default function SettingsScreen() {
  const [isCurrentDeviceTrusted, setIsCurrentDeviceTrusted] = useState(false);

  return (
    <View className="flex-1 bg-white dark:bg-[#09090b]">
      <Header title="Settings" subtitle="Device Preferences" />

      <ScrollView
        className="flex-1 p-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <AppAppearanceSection />
        <SecurityControlsSection />
        <PendingOtpsSection isCurrentDeviceTrusted={isCurrentDeviceTrusted} />
        <TrustedDevicesSection
          onDevicesLoad={(devices, currentDeviceId) => {
            const current = devices.find((d) => d.id === currentDeviceId);
            setIsCurrentDeviceTrusted(!!current?.isTrusted);
          }}
        />
        <DataManagementSection />
        <DangerZoneSection />
        <SignOutButton />
      </ScrollView>
    </View>
  );
}
