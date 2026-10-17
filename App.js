import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store';
import { C } from './src/theme';
import { Icon, ND } from './src/components/ui';
import { Sheet, TabBar, Toast } from './src/components/Overlays';
import { Bank, Kyc, Lang, Mode, Otp, Phone, Selfie } from './src/screens/Onboarding';
import { HomeCareer, HomeWork } from './src/screens/Home';
import { Apps, More, Passport, Shifts, Wallet } from './src/screens/Tabs';
import { Day, Demo, InfoPage } from './src/screens/Sub';

const ONBOARDING = { lang: Lang, phone: Phone, otp: Otp, mode: Mode, kyc: Kyc, selfie: Selfie, bank: Bank };

/** Cross-fades and slides content whenever `id` changes. */
function Transition({ id, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, [id, v]);
  return (
    <Animated.View style={{ flex: 1, opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

function MainApp() {
  const a = useApp();
  const work = a.mode === 'work';
  let Body;
  if (a.sub === 'day') Body = Day;
  else if (a.sub === 'demo') Body = Demo;
  else if (a.sub) Body = InfoPage;
  else if (a.tab === 'home') Body = work ? HomeWork : HomeCareer;
  else if (a.tab === 'shifts' || a.tab === 'apps') Body = work ? Shifts : Apps;
  else Body = { wallet: Wallet, passport: Passport, more: More }[a.tab];

  return (
    <View style={{ flex: 1 }}>
      {a.offline && (
        <View style={styles.offline}>
          <Icon name="wifi_off" size={18} color="#F2F2F2" />
          <Text style={{ color: '#F2F2F2', fontSize: 13 }}>Offline. Showing shifts saved at 4:02 pm.</Text>
        </View>
      )}
      <Transition id={a.mode + a.tab + (a.sub || '')}>
        <Body />
      </Transition>
      <TabBar />
    </View>
  );
}

function Root() {
  const a = useApp();
  const Screen = a.screen === 'app' ? MainApp : ONBOARDING[a.screen];
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.frame}>
        <Transition id={a.screen}>
          <Screen />
        </Transition>
        <Toast />
        <Sheet />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Platform.OS === 'web' ? C.surface2 : '#fff' },
  // On web, keep a phone-width column centred so the static export reads like the app.
  frame: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 440 : undefined, alignSelf: 'center', backgroundColor: '#fff', overflow: 'hidden' },
  offline: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#303030' },
});
