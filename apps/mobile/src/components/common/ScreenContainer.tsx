import React, { memo, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  View,
  ViewStyle,
  Platform,
  KeyboardAvoidingViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ternary } from './Ternary';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  disableScroll?: boolean;
};

export const ScreenContainer = memo(
  ({ children, style, contentContainerStyle, disableScroll = false }: Props) => {
    const insets = useSafeAreaInsets();
    const defaultValue: KeyboardAvoidingViewProps['behavior'] =
      Platform.OS === 'ios' ? 'padding' : 'height';

    const [behaviour, setBehaviour] = useState<KeyboardAvoidingViewProps['behavior']>(defaultValue);

    useEffect(() => {
      const showListener = Keyboard.addListener('keyboardDidShow', () => {
        setBehaviour(defaultValue);
      });
      const hideListener = Keyboard.addListener('keyboardDidHide', () => {
        setBehaviour(undefined);
      });

      return () => {
        showListener.remove();
        hideListener.remove();
      };
    }, []);

    return (
      <KeyboardAvoidingView
        style={[{ flex: 1, backgroundColor: 'transparent' }, style]}
        behavior={behaviour}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {/* We wrap the inner content in a View that handles the safe area padding once */}
          <View style={{ flex: 1, backgroundColor: 'transparent', paddingBottom: insets.bottom }}>
            <Ternary
              condition={disableScroll}
              ifTrue={
                <View style={[{ flex: 1, backgroundColor: 'transparent' }, contentContainerStyle]}>
                  {children}
                </View>
              }
              ifFalse={
                <ScrollView
                  style={{ backgroundColor: 'transparent', flex: 1 }}
                  contentContainerStyle={[
                    { flexGrow: 1 }, // Removed flex: 1 from here, use flexGrow for ScrollView
                    contentContainerStyle,
                  ]}
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  {children}
                </ScrollView>
              }
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }
);
