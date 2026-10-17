import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TextInput, View } from 'react-native';
import { LANGS, TR } from '../data';
import { useApp } from '../store';
import { C, T } from '../theme';
import { Bar, Btn, FadeIn, H1, Icon, ND, Pop, Pulse, Spin, Tap } from '../components/ui';

const Page = ({ children, gap = 20, pad = 24 }) => <View style={{ flex: 1, padding: pad, gap }}>{children}</View>;

const Note = ({ sev, icon, children }) => (
  <View style={[s.note, { backgroundColor: T[sev][0] }]}>
    <Icon name={icon} color={T[sev][1]} />
    <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: T[sev][1] }}>{children}</Text>
  </View>
);

/** Three-step progress for KYC → selfie → bank. */
function Progress({ step }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[0, 1, 2].map(i => <Bar key={i} pct={i <= step ? 1 : 0} />)}
    </View>
  );
}

function Field({ value, onChangeText, err, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      placeholderTextColor="#8E918F"
      style={[s.input, focus && { borderColor: C.primary, borderWidth: 2 }, err && { borderColor: C.danger, borderWidth: 2 }, style]}
      {...rest}
    />
  );
}

export function Lang() {
  const a = useApp();
  return (
    <Page>
      <Pop><View style={s.logo}><Icon name="alt_route" color="#fff" size={26} /></View></Pop>
      <FadeIn delay={80}>
        <H1>Choose your language</H1>
        <Text style={[s.sub, { marginTop: 6 }]}>भाषा चुनें · ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ</Text>
      </FadeIn>
      <View style={s.grid}>
        {LANGS.map(([id, n], i) => {
          const on = a.lang === id;
          return (
            <FadeIn key={id} delay={120 + i * 35} style={{ width: '48%' }}>
              <Tap
                style={[s.lang, on && { borderColor: C.primary, borderWidth: 2, backgroundColor: C.primarySoft }]}
                onPress={() => {
                  a.setLang(TR[id] ? id : 'en');
                  a.setScreen(a.seenApp ? 'app' : 'phone');
                  if (!TR[id]) a.say(n + ' is coming soon in this prototype; showing English.');
                }}
              >
                <Icon name="volume_up" color={C.primary} />
                <Text style={{ fontSize: 18, color: C.text }}>{n}</Text>
              </Tap>
            </FadeIn>
          );
        })}
      </View>
    </Page>
  );
}

export function Phone() {
  const a = useApp();
  const digits = a.phone.replace(/\D/g, '');
  const invalid = !/^[6-9]\d{9}$/.test(digits);
  const err = (digits.length >= 10 && invalid) || digits.length > 10;
  return (
    <Page>
      <FadeIn><H1>Your mobile number</H1></FadeIn>
      <Text style={s.sub}>We'll send a 6-digit code by SMS.</Text>
      <View style={{ gap: 6 }}>
        <View style={[s.phoneBox, err && { borderColor: C.danger, borderWidth: 2 }]}>
          <Text style={{ fontSize: 18, color: C.muted }}>+91</Text>
          <TextInput
            value={a.phone}
            onChangeText={v => a.setPhone(v.replace(/[^\d ]/g, '').slice(0, 11))}
            keyboardType="number-pad"
            placeholder="98765 43210"
            placeholderTextColor="#8E918F"
            style={{ flex: 1, fontSize: 20, letterSpacing: 1, color: C.text, outlineStyle: 'none' }}
            accessibilityLabel="Mobile number"
          />
        </View>
        {err && <FadeIn from={-4}><Text style={s.err}>Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.</Text></FadeIn>}
      </View>
      <Note sev="ok" icon="verified">CrossWay is free for workers. Nobody can ask you for money to get a job. If they do, report it in Help.</Note>
      <View style={{ flex: 1 }} />
      <Btn
        label="Send code"
        align="center"
        disabled={invalid}
        onPress={() => {
          a.setOtp(''); a.setOtpTries(0); a.setOtpMsg(''); a.setResendAt(Date.now() + 30000);
          a.setScreen('otp');
        }}
      />
    </Page>
  );
}

export function Otp() {
  const a = useApp();
  const [, tick] = useState(0);
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = setInterval(() => tick(x => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, Math.ceil((a.resendAt - Date.now()) / 1000));
  const locked = a.otpTries >= 3;
  const msg = locked ? 'Too many wrong codes. Try again in 10 minutes, or request a call with the code.' : a.otpMsg;

  const verify = () => {
    if (a.otp === '123456') return a.setScreen('mode');
    const n = a.otpTries + 1;
    a.setOtpTries(n);
    a.setOtp('');
    a.setOtpMsg(n >= 3 ? '' : 'Wrong code. ' + (3 - n) + ' tr' + (3 - n === 1 ? 'y' : 'ies') + ' left.');
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 400, easing: Easing.linear, useNativeDriver: ND }).start();
  };

  return (
    <Page>
      <FadeIn><H1>Enter the code</H1></FadeIn>
      <Text style={s.sub}>
        Sent to +91 {a.phone}.{' '}
        <Text style={{ color: C.primary }} onPress={() => a.setScreen('phone')}>Change</Text> · prototype code 123456
      </Text>
      <Animated.View style={{ transform: [{ translateX: shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -10, 10, -6, 6, 0] }) }] }}>
        <Field
          value={a.otp}
          onChangeText={v => { a.setOtp(v.replace(/\D/g, '').slice(0, 6)); a.setOtpMsg(''); }}
          editable={!locked}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="••••••"
          err={!!msg}
          style={{ height: 64, fontSize: 30, letterSpacing: 14, borderRadius: 12 }}
          accessibilityLabel="One-time code"
        />
      </Animated.View>
      {!!msg && <FadeIn from={-4}><Text style={[s.err, { fontSize: 14 }]}>{msg}</Text></FadeIn>}
      <Tap
        disabled={left > 0}
        style={{ alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 12 }}
        onPress={() => { a.setResendAt(Date.now() + 30000); a.setOtpTries(0); a.setOtpMsg(''); a.say('New code sent. The old one no longer works.'); }}
      >
        <Text style={{ color: C.primary, fontSize: 15, fontWeight: '500' }}>
          {left > 0 ? 'Resend code in 0:' + String(left).padStart(2, '0') : 'Resend code · or get a call'}
        </Text>
      </Tap>
      <View style={{ flex: 1 }} />
      <Btn label="Verify" align="center" disabled={a.otp.length < 6 || locked} onPress={verify} />
    </Page>
  );
}

export function Mode() {
  const a = useApp();
  const pick = m => { a.setMode(m); a.setKycStep('idle'); a.setScreen('kyc'); };
  return (
    <Page gap={16}>
      <FadeIn><H1>What are you looking for?</H1></FadeIn>
      <FadeIn delay={80}>
        <Tap style={[s.modeCard, { backgroundColor: C.primarySoft }]} onPress={() => pick('work')}>
          <Icon name="front_hand" size={40} color={C.primaryDark} />
          <Text style={{ fontSize: 22, color: C.primaryDark }}>Work Now</Text>
          <Text style={{ fontSize: 15, lineHeight: 21, color: C.primaryDark }}>Shifts near you, daily pay, speak instead of typing.</Text>
        </Tap>
      </FadeIn>
      <FadeIn delay={160}>
        <Tap style={[s.modeCard, { backgroundColor: T.ok[0] }]} onPress={() => pick('career')}>
          <Icon name="work" size={40} color={T.ok[1]} />
          <Text style={{ fontSize: 22, color: T.ok[1] }}>Career</Text>
          <Text style={{ fontSize: 15, lineHeight: 21, color: T.ok[1] }}>Permanent and specialist jobs, interviews, salary insight.</Text>
        </Tap>
      </FadeIn>
      <Text style={{ fontSize: 13, color: C.muted }}>You can switch any time in More.</Text>
    </Page>
  );
}

const Option = ({ icon, label, onPress }) => (
  <Tap style={s.option} onPress={onPress}>
    <Icon name={icon} color={C.primary} />
    <Text style={{ fontSize: 15, color: C.text }}>{label}</Text>
  </Tap>
);

export function Kyc() {
  const a = useApp();
  const start = () => {
    a.setKycStep('loading');
    const r = a.sc.kyc;
    a.later(() => {
      if (r === 'down') a.setKycStep('down');
      else if (r === 'minor') a.setKycStep('minor');
      else { a.setKycStep('idle'); a.setScreen('selfie'); a.say('Aadhaar verified · XXXX XXXX 4821'); }
    }, 1100);
  };
  return (
    <Page gap={18}>
      <Progress step={0} />
      <H1 style={{ fontSize: 26, lineHeight: 34 }}>Verify your identity</H1>
      {a.kycStep === 'idle' && (
        <FadeIn style={{ flex: 1, gap: 18 }}>
          <Text style={s.sub}>We use DigiLocker to read your Aadhaar. CrossWay keeps only the last 4 digits.</Text>
          <View style={s.checks}>
            {[['check', C.green, 'Name, date of birth, photo'], ['check', C.green, 'Address (for nearby shifts)'], ['close', C.danger, 'Never your full Aadhaar number']].map(([i, c, l], k) => (
              <FadeIn key={l} delay={k * 40} style={{ flexDirection: 'row', gap: 10 }}>
                <Icon name={i} color={c} /><Text style={{ fontSize: 14, color: C.text }}>{l}</Text>
              </FadeIn>
            ))}
          </View>
          <Tap style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }} scaleTo={0.99} onPress={() => a.setConsent(!a.consent)} accessibilityLabel="Consent">
            <Icon name={a.consent ? 'check_box' : 'check_box_outline_blank'} color={a.consent ? C.primary : C.outline} />
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: C.text }}>
              I agree to share these details for verification (DPDP Act 2023). I can ask to delete them any time.
            </Text>
          </Tap>
          <View style={{ flex: 1 }} />
          <Btn label="Continue with DigiLocker" align="center" disabled={!a.consent} onPress={start} />
        </FadeIn>
      )}
      {a.kycStep === 'loading' && (
        <FadeIn style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
          <Spin name="hourglass_top" />
          <Text style={{ fontSize: 18, color: C.text }}>Connecting to DigiLocker…</Text>
        </FadeIn>
      )}
      {a.kycStep === 'down' && (
        <FadeIn style={{ gap: 12 }}>
          <Note sev="warn" icon="cloud_off">DigiLocker isn't responding right now. Your details are safe; nothing was shared.</Note>
          <Option icon="upload_file" label="Upload offline Aadhaar (XML from UIDAI)" onPress={() => { a.setKycStep('idle'); a.setScreen('selfie'); a.say('Offline Aadhaar XML verified. Signature valid.'); }} />
          <Option icon="refresh" label="Try DigiLocker again" onPress={() => { a.setKycStep('loading'); a.later(() => a.setKycStep('down'), 900); }} />
          <Option icon="notifications" label="Remind me in 1 hour" onPress={() => a.say("We'll remind you at 5:20 pm. Your progress is saved.")} />
        </FadeIn>
      )}
      {a.kycStep === 'minor' && (
        <FadeIn style={{ gap: 12 }}>
          <View style={[s.note, { backgroundColor: T.bad[0], flexDirection: 'column', padding: 18, borderRadius: 20 }]}>
            <Pop><Icon name="cake" size={32} color={T.bad[1]} /></Pop>
            <Text style={{ fontSize: 18, color: T.bad[1] }}>You can start working from 2 November 2026</Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: T.bad[1] }}>Work on CrossWay starts at 18. Your profile is saved and we'll message you on your birthday.</Text>
          </View>
          <Btn kind="t" height={52} align="center" label="Meanwhile, try free CrossWay Skills courses" onPress={() => a.say('Opening CrossWay Skills: 12 free courses.')} />
        </FadeIn>
      )}
    </Page>
  );
}

export function Selfie() {
  const a = useApp();
  const scan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // One down-and-up pass (2.8 s), then the line rests: auto-play stays under 5 s.
    const pass = Animated.sequence([
      Animated.timing(scan, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
      Animated.timing(scan, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
    ]);
    pass.start();
    return () => pass.stop();
  }, [scan, a.selfieTries]);
  const human = a.selfieTries >= 3;
  const take = () => {
    if (a.sc.selfie === 'fail') {
      const n = a.selfieTries + 1;
      a.setSelfieTries(n);
      a.setSelfieErr(n >= 3
        ? "We couldn't confirm it's you after 3 tries. A 2-minute video call with our team will finish verification."
        : 'Too dark to see your face. Face a window or light and hold the phone at eye level. (' + (3 - n) + ' left)');
    } else {
      a.setSelfieErr('');
      a.setScreen('bank');
      a.say('Liveness passed · face matches Aadhaar.');
    }
  };
  const ring = a.selfieErr ? C.danger : C.primary;
  return (
    <Page gap={18}>
      <Progress step={1} />
      <H1 style={{ fontSize: 26, lineHeight: 34 }}>Take a selfie</H1>
      <Text style={s.sub}>Blink once when asked. This proves it's really you.</Text>
      <View style={{ alignSelf: 'center', width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
        <Pulse size={240} color={ring} />
        <View style={[s.cam, { borderColor: ring }]}>
          <Icon name="face" size={96} color="#C4C7C5" />
          <Animated.View
            style={[s.scanLine, { backgroundColor: ring, transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [-90, 90] }) }] }]}
          />
        </View>
      </View>
      {!!a.selfieErr && <FadeIn key={a.selfieErr}><Note sev="bad" icon={human ? 'videocam' : 'light_mode'}>{a.selfieErr}</Note></FadeIn>}
      <View style={{ flex: 1 }} />
      {human ? (
        <Btn label="Book a 2-minute video check" align="center" onPress={() => { a.setSelfieTries(0); a.setSelfieErr(''); a.setScreen('bank'); a.say('Video check booked for 5:00 pm. You can continue setup now.'); }} />
      ) : (
        <Btn label={a.selfieTries ? 'Try again' : 'Take selfie'} icon="photo_camera" align="center" onPress={take} />
      )}
    </Page>
  );
}

const UPI_RE = /^[\w.-]{2,}@[a-z]{2,}$/i;

export function Bank() {
  const a = useApp();
  const invalid = !UPI_RE.test(a.upi);
  const err = a.upi.length > 3 && invalid;
  const finish = msg => { a.setSeenApp(true); a.setBankStep('idle'); a.goTab('home'); a.setScreen('app'); a.say(msg); };
  return (
    <Page gap={18}>
      <Progress step={2} />
      <H1 style={{ fontSize: 26, lineHeight: 34 }}>Where should we pay you?</H1>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, color: C.muted }}>UPI ID</Text>
        <Field
          value={a.upi}
          onChangeText={v => { a.setUpi(v.trim()); a.setBankStep('idle'); }}
          placeholder="name@bank"
          autoCapitalize="none"
          autoCorrect={false}
          err={err}
          style={{ height: 56, fontSize: 18 }}
          accessibilityLabel="UPI ID"
        />
        {err && <Text style={s.err}>That doesn't look like a UPI ID. It should be like ravi@okaxis.</Text>}
      </View>
      {a.bankStep === 'mismatch' ? (
        <FadeIn style={{ gap: 12 }}>
          <View style={[s.note, { backgroundColor: T.warn[0], flexDirection: 'column' }]}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Icon name="person_alert" color={T.warn[1]} />
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: T.warn[1] }}>
                The bank says this account belongs to <Text style={{ fontWeight: '700' }}>R KUMAR</Text>. Your Aadhaar says <Text style={{ fontWeight: '700' }}>Ravi Kumar</Text>.
              </Text>
            </View>
            <Text style={{ fontSize: 14, lineHeight: 20, color: T.warn[1] }}>If it's your account, confirm. Paying into someone else's account isn't allowed.</Text>
          </View>
          <Btn height={52} align="center" label="Yes, it's my account" onPress={() => finish('Account confirmed. Flagged for a quick human check.')} />
          <Btn height={52} kind="o" align="center" label="Use a different account" onPress={() => { a.setUpi(''); a.setBankStep('idle'); }} />
        </FadeIn>
      ) : (
        <>
          <View style={{ flex: 1 }} />
          <Btn
            label="Verify with ₹1"
            align="center"
            disabled={invalid}
            onPress={() => (a.sc.bank === 'mismatch' ? a.setBankStep('mismatch') : finish("You're verified. Your CrossWay Passport is ready."))}
          />
        </>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  sub: { fontSize: 15, color: C.muted, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  lang: { height: 64, borderRadius: 16, borderWidth: 1, borderColor: '#C4C7C5', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  phoneBox: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 8, borderWidth: 1, borderColor: C.outline, paddingHorizontal: 14, gap: 10 },
  input: { borderWidth: 1, borderColor: C.outline, borderRadius: 8, paddingHorizontal: 16, color: C.text, outlineStyle: 'none' },
  err: { fontSize: 13, color: C.danger },
  note: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16 },
  modeCard: { borderRadius: 24, padding: 20, gap: 10 },
  checks: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: C.surface2 },
  option: { height: 64, borderRadius: 16, borderWidth: 1, borderColor: '#C4C7C5', backgroundColor: '#fff', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cam: { width: 240, height: 240, borderRadius: 120, backgroundColor: C.text, borderWidth: 4, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scanLine: { position: 'absolute', left: 30, right: 30, height: 2, opacity: 0.8 },
});
