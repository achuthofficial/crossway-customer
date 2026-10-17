import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { C } from '../theme';
import { haptics, ND, useMotion } from '../motion';
import { makePayload, SITES, verifyCode, verifyPayload, windowAt } from '../lib/checkinQr';
import { Btn, Icon } from './ui';

const REASONS = {
  format: "That isn't a CrossWay site code. Scan the QR shown at the entrance.",
  tampered: "This code doesn't check out. Ask the supervisor to show the live code.",
  mismatch: "That code doesn't match this site. Check the 6 digits under the QR, or scan it instead.",
  expired: 'That code has expired. Codes change every 30 seconds; scan the live one on the screen.',
  'wrong-site': site => `This QR is for ${SITES[site] || site}, not your shift. Find the CrossWay QR for this site.`,
};
const reasonText = r => (typeof REASONS[r.reason] === 'function' ? REASONS[r.reason](r.site) : REASONS[r.reason]);

/**
 * Scans the site's rotating check-in QR (expo-camera) and verifies it for `site`.
 * Fallbacks: a 6-digit code typed in (camera denied or unavailable), and a demo "simulate" button
 * that runs a generated payload through the same verification, since this prototype has no site.
 */
export function QrScanner({ site, title, onVerified, onCancel, demo = 'ok' }) {
  const m = useMotion();
  const [perm, requestPerm] = useCameraPermissions();
  const [err, setErr] = useState('');
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const locked = useRef(false);
  const line = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (m.reduced) return;
    // Three sweeps of the scan line, then it rests (no auto-play past 5 s).
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(line, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
        Animated.timing(line, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
      ]),
      { iterations: 3 },
    );
    loop.start();
    return () => loop.stop();
  }, [m.reduced, err]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = result => {
    if (result.ok) {
      locked.current = true;
      haptics.success();
      onVerified(result);
    } else {
      haptics.error();
      setErr(reasonText(result));
      // Let the camera try again after a moment, so one bad frame doesn't spam errors.
      setTimeout(() => (locked.current = false), 1500);
    }
  };
  const onScan = ({ data }) => {
    if (locked.current) return;
    locked.current = true;
    check(verifyPayload(data, site));
  };
  const simulate = () => {
    const payload = demo === 'wrong' ? makePayload('STR-IND') : demo === 'expired' ? makePayload(site, windowAt() - 6) : makePayload(site);
    check(verifyPayload(payload, site));
  };

  const camOk = perm?.granted && Platform.OS !== 'web';
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 18, color: C.text }}>{title}</Text>
      <View style={{ height: 260, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1F1F1F', alignItems: 'center', justifyContent: 'center' }}>
        {camOk && !manual && (
          <CameraView style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={onScan} />
        )}
        {!camOk && !manual && (
          <View style={{ alignItems: 'center', gap: 10, padding: 20 }}>
            <Icon name="photo_camera" size={36} color="#E3E3E3" />
            <Text style={{ color: '#E3E3E3', textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
              {Platform.OS === 'web' ? 'Scanning works in the app. Here, simulate a scan or type the code.' : perm && !perm.canAskAgain ? 'Camera access is off. Turn it on in Settings, or type the code.' : 'Allow the camera to scan the site QR.'}
            </Text>
            {Platform.OS !== 'web' && perm?.canAskAgain !== false && <Btn label="Allow camera" height={40} full={false} onPress={requestPerm} />}
          </View>
        )}
        {manual && (
          <View style={{ alignItems: 'center', gap: 10, padding: 20, alignSelf: 'stretch' }}>
            <Text style={{ color: '#E3E3E3', fontSize: 14 }}>Type the 6-digit code under the QR</Text>
            <TextInput
              value={code}
              onChangeText={v => { setErr(''); setCode(v.replace(/\D/g, '').slice(0, 6)); }}
              keyboardType="number-pad"
              autoFocus
              maxLength={6}
              accessibilityLabel="Site code"
              style={{ width: 200, height: 56, borderRadius: 12, backgroundColor: '#fff', fontSize: 26, letterSpacing: 8, textAlign: 'center', color: C.text, outlineStyle: 'none' }}
            />
            <Btn label="Check code" height={44} full={false} style={{ alignSelf: 'center' }} disabled={code.length !== 6} onPress={() => check(verifyCode(code, site))} />
          </View>
        )}
        {camOk && !manual && (
          // Viewfinder: corner frame plus a sweeping line (transform only).
          <View pointerEvents="none" style={{ position: 'absolute', width: 180, height: 180, borderRadius: 24, borderWidth: 3, borderColor: err ? '#F2B8B5' : '#A8C7FA', overflow: 'hidden' }}>
            <Animated.View style={{ height: 3, backgroundColor: err ? '#F2B8B5' : '#A8C7FA', transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [8, 168] }) }] }} />
          </View>
        )}
      </View>
      {!!err && (
        <View accessibilityLiveRegion="assertive" style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: '#F9DEDC' }}>
          <Icon name="error" color="#410E0B" size={20} />
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: '#410E0B' }}>{err}</Text>
        </View>
      )}
      <Btn label="Simulate scan (demo)" icon="qr_code_scanner" height={48} onPress={simulate} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Btn label={manual ? 'Use camera' : 'Type code instead'} kind="o" height={44} full={false} style={{ flex: 1 }} onPress={() => { setErr(''); setManual(!manual); }} />
        <Btn label="Cancel" kind="o" height={44} full={false} onPress={onCancel} />
      </View>
    </View>
  );
}
