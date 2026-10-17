import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store';
import { C } from './src/theme';
import { Icon } from './src/components/ui';
import { Sheet, TabBar, Toast } from './src/components/Overlays';
import { ContainerTransformHost, MotionProvider, PredictiveBack, Splash, useContainerTransform, useMotion } from './src/motion';
import { Bank, Kyc, Lang, Mode, Otp, Phone, Selfie } from './src/screens/Onboarding';
import { HomeCareer, HomeWork } from './src/screens/Home';
import { Apps, More, Passport, Shifts, Wallet } from './src/screens/Tabs';
import { Day, Demo, InfoPage, JobDetail, Refer, Saved } from './src/screens/Sub';

const ONBOARDING = ['lang', 'phone', 'otp', 'mode', 'kyc', 'selfie', 'bank'];
const ONBOARDING_SCREENS = { lang: Lang, phone: Phone, otp: Otp, mode: Mode, kyc: Kyc, selfie: Selfie, bank: Bank };
const SUBS = { day: Day, demo: Demo, job: JobDetail, saved: Saved, refer: Refer };

/**
 * Enter transition keyed on `id`.
 * axis "x": M3 shared axis X (onboarding steps: slide 30 px in the direction of travel + fade).
 * axis "fade": M3 fade through (top-level tabs: fade + scale 0.96 → 1, nothing slides).
 */
function Transition({ id, axis = 'fade', dir = 1, children }) {
  const m = useMotion();
  const v = useRef(new Animated.Value(1)).current;
  const o = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    v.setValue(0);
    o.setValue(0);
    m.to(v, 1).start();
    m.to(o, 1, { kind: 'effects' }).start();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const transform = m.reduced
    ? []
    : axis === 'x'
      ? [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [30 * dir, 0] }) }]
      : [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }];
  return <Animated.View style={{ flex: 1, opacity: o, transform }}>{children}</Animated.View>;
}

function TabBody() {
  const a = useApp();
  const work = a.mode === 'work';
  let Body;
  if (a.tab === 'home') Body = work ? HomeWork : HomeCareer;
  else if (a.tab === 'shifts' || a.tab === 'apps') Body = work ? Shifts : Apps;
  else Body = { wallet: Wallet, passport: Passport, more: More }[a.tab];
  return <Body />;
}

function MainApp() {
  const a = useApp();
  const ct = useContainerTransform();
  const pb = useRef(null);
  const Sub = a.sub ? SUBS[a.sub] || InfoPage : null;

  // One "back" for the header arrow, the Android back button and the edge swipe:
  // job detail shrinks back into its card (container transform), other pages slide away.
  useEffect(() => {
    a.backRef.current = () => {
      if (a.sub === 'job') ct.close('job-' + a.jobId, () => a.setSub(null));
      else if (pb.current) pb.current.back();
      else a.setSub(null);
    };
  });

  return (
    <View style={{ flex: 1 }}>
      {a.offline && (
        <View style={styles.offline}>
          <Icon name="wifi_off" size={18} color="#F2F2F2" />
          <Text style={{ color: '#F2F2F2', fontSize: 13 }}>Offline. Showing shifts saved at 4:02 pm.</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        {Sub ? (
          <PredictiveBack key={a.sub} ref={pb} onBack={() => a.setSub(null)} under={<TabBody />}>
            <Sub />
          </PredictiveBack>
        ) : (
          <Transition id={a.mode + a.tab}>
            <TabBody />
          </Transition>
        )}
      </View>
      <TabBar />
    </View>
  );
}

function Root() {
  const a = useApp();
  const [splash, setSplash] = useState(true);
  const prev = useRef(a.screen);
  const dir = ONBOARDING.indexOf(a.screen) >= ONBOARDING.indexOf(prev.current) ? 1 : -1;
  useEffect(() => {
    prev.current = a.screen;
  }, [a.screen]);

  // Android back: close the sheet, then the sub-page, then return to Home; otherwise let the
  // system handle it (with predictiveBackGestureEnabled the OS shows its back-to-home preview).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (a.sheet) return a.setSheet(null), true;
      if (a.screen === 'app' && a.sub) return a.back(), true;
      if (a.screen === 'app' && a.tab !== 'home') return a.goTab('home'), true;
      const i = ONBOARDING.indexOf(a.screen);
      if (i > 0) return a.setScreen(ONBOARDING[i - 1]), true;
      return false;
    });
    return () => sub.remove();
  }, [a.sheet, a.sub, a.tab, a.screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const Screen = a.screen === 'app' ? MainApp : ONBOARDING_SCREENS[a.screen];
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.frame}>
        <ContainerTransformHost>
          <Transition id={a.screen} axis={a.screen === 'app' ? 'fade' : 'x'} dir={dir}>
            <Screen />
          </Transition>
          <Toast />
          <Sheet />
        </ContainerTransformHost>
        {splash && <Splash color={C.primary} onDone={() => setSplash(false)} />}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MotionProvider scheme="expressive">
        <AppProvider>
          <Root />
        </AppProvider>
      </MotionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Platform.OS === 'web' ? C.surface2 : '#fff' },
  // On web, keep a phone-width column centred so the static export reads like the app.
  frame: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 440 : undefined, alignSelf: 'center', backgroundColor: '#fff', overflow: 'hidden' },
  offline: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#303030' },
});
