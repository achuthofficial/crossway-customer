import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import { FEED, SCENARIOS } from '../data';
import { animateNext, useApp } from '../store';
import { C, T } from '../theme';
import { Btn, FadeIn, Icon, Pop, Pulse, Tap } from '../components/ui';
import { s } from './Home';

const Header = ({ title }) => {
  const a = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingHorizontal: 8 }}>
      <Tap style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }} onPress={() => a.setSub(null)} accessibilityLabel="Back">
        <Icon name="arrow_back" />
      </Tap>
      <Text style={{ fontSize: 20, color: C.text }}>{title}</Text>
    </View>
  );
};

/* ---------------- Shift day (check-in / check-out) ---------------- */
const STAGES = {
  pre: geoIn => (geoIn
    ? ['info', 'my_location', "You're at the site", "You're 40 m from the entrance. Check in now; your shift starts at 5:00 pm."]
    : ['warn', 'wrong_location', "You're 420 m away", "Move within 150 m of Tower B to check in. If you're already there, ask the supervisor to confirm you."]),
  selfie: () => ['info', 'photo_camera', 'Take your check-in selfie', 'Look at the camera and blink.'],
  in: () => ['ok', 'task_alt', 'Checked in at 4:52 pm', "Your shift runs to 9:00 pm. Check out before you leave so you're paid for every minute."],
  offline: () => ['warn', 'cloud_off', 'Checked in offline', 'No signal here. Your check-in is saved on the phone with time and location and will sync automatically.'],
  super: () => ['info', 'supervisor_account', 'Waiting for supervisor', "Mr. Prakash got a request to confirm you're on site. This usually takes 2–3 minutes."],
  done: () => ['ok', 'paid', 'Shift complete · ₹780', 'Checked out 9:02 pm. Paid tonight after the client approves your hours.'],
};

function MapCard({ geoIn }) {
  const pos = useRef(new Animated.ValueXY(geoIn ? { x: 0.52, y: 0.44 } : { x: 0.82, y: 0.14 })).current;
  const [w, setW] = useState(380);
  const h = 170;
  useEffect(() => {
    Animated.spring(pos, { toValue: geoIn ? { x: 0.52, y: 0.44 } : { x: 0.82, y: 0.14 }, useNativeDriver: false, speed: 6, bounciness: 6 }).start();
  }, [geoIn, pos]);
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ marginHorizontal: 16, height: h, borderRadius: 24, backgroundColor: C.surface3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderStyle: 'dashed', borderColor: C.primary, backgroundColor: 'rgba(11,87,208,.08)' }} />
      <Icon name="location_on" size={36} color="#EA4335" />
      <Animated.View
        style={{
          position: 'absolute',
          left: pos.x.interpolate({ inputRange: [0, 1], outputRange: [-8, w - 8] }),
          top: pos.y.interpolate({ inputRange: [0, 1], outputRange: [-8, h - 8] }),
          width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Pulse size={16} color="rgba(11,87,208,.5)" />
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.primary, borderWidth: 3, borderColor: '#fff' }} />
      </Animated.View>
      <Text style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 12, color: C.muted }}>Map · site geofence 150 m</Text>
    </View>
  );
}

export function Day() {
  const a = useApp();
  const geoIn = a.sc.geo === 'inside';
  const st = a.dayStage;
  const [sv, icon, title, text] = STAGES[st](geoIn);
  const go = next => { animateNext(); a.setDayStage(next); };

  const actions = [];
  if (st === 'pre') {
    if (geoIn) actions.push(['Check in', 'login', 'p', () => go('selfie')]);
    else {
      actions.push(["I'm here: ask supervisor", 'supervisor_account', 'p', () => {
        go('super');
        a.later(() => {
          if (a.dayRef.current !== 'super') return;
          animateNext();
          a.setDayStage('in');
          a.say("Supervisor confirmed. You're checked in.");
        }, 2500);
      }]);
      actions.push(['Refresh my location', 'my_location', 'o', () => a.say('Still 420 m away. GPS accuracy ±12 m.')]);
    }
    actions.push(['Running late', 'schedule', 'o', () => a.say("Site told you're 15 min late. Shift is held for you.")]);
  }
  if (st === 'selfie') actions.push(['Take selfie', 'photo_camera', 'p', () => go(a.offline ? 'offline' : 'in')]);
  if (st === 'in' || st === 'offline') actions.push(['Check out', 'logout', 'p', () => { go('done'); a.setSheet({ kind: 'rate' }); }]);
  if (st === 'done')
    actions.push(['Back to my shifts', 'arrow_back', 'p', () => {
      a.setMine(l => l.map(m => (m.id === 'm1' ? { ...m, status: 'Done · awaiting approval', sev: 'warn', note: '4.0 h · ₹780 · paid tonight', act: null, day: false } : m)));
      a.goTab('shifts');
    }]);

  return (
    <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
      <Header title="Today's shift" />
      {!a.lowData && <MapCard geoIn={geoIn} />}
      <View style={{ paddingHorizontal: 16, gap: 4 }}>
        <Text style={{ fontSize: 20, color: C.text }}>Housekeeping · Prestige Tech Park</Text>
        <Text style={s.meta}>Tower B, Whitefield · 5:00–9:00 pm · ₹780</Text>
        <Text style={s.meta}>Supervisor: Mr. Prakash · masked call</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
        <Btn label="Directions" icon="directions" kind="o" height={48} full={false} style={{ flex: 1, paddingHorizontal: 14 }} onPress={() => a.say('Opening Google Maps: 11 min by bike.')} />
        <Btn label="Call site" icon="call" kind="o" height={48} full={false} style={{ flex: 1, paddingHorizontal: 14 }} onPress={() => a.say('Calling the site through a masked number…')} />
        <Btn label="SOS" kind="d" height={48} full={false} style={{ paddingHorizontal: 18 }} onPress={() => a.setSheet({ kind: 'sos' })} />
      </View>
      <FadeIn key={st + geoIn} style={{ marginHorizontal: 16, padding: 16, borderRadius: 20, backgroundColor: T[sv][0], flexDirection: 'row', gap: 12 }}>
        <Pop key={icon}><Icon name={icon} color={T[sv][1]} /></Pop>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: T[sv][1] }}>{title}</Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: T[sv][1] }}>{text}</Text>
        </View>
      </FadeIn>
      {st === 'offline' && (
        <FadeIn style={{ marginHorizontal: 16, padding: 16, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: C.outline, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Icon name="qr_code_2" size={72} />
          <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: C.muted }}>Offline ticket · SH-4075 · 4:52 pm. Show this to the supervisor. It syncs when you're online.</Text>
        </FadeIn>
      )}
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        {actions.map(([l, i, k, on]) => <Btn key={l} label={l} icon={i} kind={k} onPress={on} />)}
      </View>
    </ScrollView>
  );
}

/* ---------------- Generic info pages ---------------- */
function pages(a) {
  const tone = rows => rows.map(([i, l, sub, sv]) => ({ i, l, s: sub, bg: T[sv][0], ic: T[sv][1] }));
  const act = rows => rows.map(([i, l, sub, label, danger]) => ({ i, l, s: sub, bg: C.surface2, ic: danger ? C.danger : C.primary, act: label }));
  return {
    refer: {
      title: 'Refer and earn',
      hero: [T.ok, 'Your code', 'RAVI2210', 'Friends who sign up with your code and finish their first shift earn you ₹300. Pro referrals pay ₹5,000 after 30 days in the job.'],
      rows: tone([
        ['person', 'Suresh M.', 'Signed up 12 Oct · first shift done · +₹300 paid', 'ok'],
        ['person', 'Manoj K.', 'Signed up 15 Oct · no shift yet · Pending', 'warn'],
        ['person', 'Lakshmi D.', 'Already on CrossWay before your invite · Not eligible', 'mute'],
        ['local_fire_department', 'Streak bonus', 'Refer 3 reliable workers this month: +₹500 · 1 of 3', 'info'],
      ]),
      cta: ['Share on WhatsApp', () => a.say('WhatsApp opened with your invite link.')],
    },
    help: {
      title: 'Help and complaints',
      rows: act([
        ['chat', 'Chat with us', 'Replies in about 5 minutes, in your language', 'Chat'],
        ['call', 'Request a call-back', 'We call within 30 minutes', 'Call me'],
        ['shield_person', 'Report safety or harassment', 'Anonymous. Only the Grievance Officer sees it.', 'Report'],
        ['money_off', 'Unpaid or short-paid wages', 'We check the timesheet and reply in 24 h', 'Report'],
        ['report', 'Someone asked me for money', 'CrossWay is always free. We remove the partner.', 'Report'],
      ]),
      onAct: x => a.say(x === 'Report' ? 'Report sent anonymously. Reference GR-0092.' : x === 'Call me' ? "Call-back booked. We'll call +91 98xxxx2210." : 'Chat opened.'),
    },
    amb: {
      title: 'Student Ambassador',
      hero: [T.warn, 'Eligibility', 'Students only', "You need a valid college ID and a short video to apply. Your profile shows no college, so this program isn't available yet. Refer and earn is open to everyone."],
      rows: [],
      cta: ['Add college details', () => a.say('Add your college ID in Passport to apply.')],
    },
    data: {
      title: 'My data',
      rows: act([
        ['download', 'Download my data', 'A copy of everything we hold, in 48 h', 'Request'],
        ['edit', 'Correct my details', 'Name, address, bank', 'Edit'],
        ['delete', 'Delete my account', 'Payslips are kept 8 years as the law requires; the rest is erased in 30 days', 'Delete', true],
      ]),
      onAct: x => a.say(x + ' request received.'),
    },
    rel: {
      title: 'Reliability Score',
      hero: [T.ok, 'Your score', a.relAppeal ? '94 · appeal open' : '94', "Higher scores get shifts first and better pay. Here's what counts:"],
      rows: tone([
        ['how_to_reg', 'Show-up rate', '139 of 140 shifts (99%)', 'ok'],
        ['schedule', 'On time', '96% on time · late twice in Oct', 'warn'],
        ['star', 'Ratings', '4.8 average from 82 clients', 'ok'],
        ['event_busy', 'Late cancellations', '1 in last 90 days (−2 points)', 'warn'],
      ]),
      cta: a.relAppeal ? null : ['Appeal a deduction', () => { a.setRelAppeal(true); a.say('Appeal sent. A person reviews it in 3 days.'); }],
    },
  };
}

export function InfoPage() {
  const a = useApp();
  const p = pages(a)[a.sub];
  if (!p) return null;
  return (
    <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
      <Header title={p.title} />
      {p.hero && (
        <FadeIn style={{ marginHorizontal: 16, padding: 18, borderRadius: 24, backgroundColor: p.hero[0][0], gap: 6 }}>
          <Text style={{ fontSize: 13, color: p.hero[0][1] }}>{p.hero[1]}</Text>
          <Text style={{ fontSize: 30, lineHeight: 38, color: p.hero[0][1] }}>{p.hero[2]}</Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: p.hero[0][1] }}>{p.hero[3]}</Text>
        </FadeIn>
      )}
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        {p.rows.map((r, i) => (
          <FadeIn key={r.l} delay={80 + i * 60} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: r.bg }}>
            <Icon name={r.i} color={r.ic} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 15, color: C.text }}>{r.l}</Text>
              <Text style={{ fontSize: 13, lineHeight: 18, color: C.muted }}>{r.s}</Text>
            </View>
            {r.act && <Btn label={r.act} kind="t" height={36} full={false} style={{ paddingHorizontal: 14 }} onPress={() => p.onAct(r.act)} />}
          </FadeIn>
        ))}
      </View>
      {p.cta && <View style={{ paddingHorizontal: 16 }}><Btn label={p.cta[0]} onPress={p.cta[1]} /></View>}
    </ScrollView>
  );
}

/* ---------------- Demo controls (prototype only) ---------------- */
function edges(a) {
  const go = a.scenario;
  return [
    ['M1', 'Invalid mobile number', () => go({ screen: 'phone', phone: '5123' })],
    ['M1', 'Wrong OTP, 3 tries then lock; resend cooldown', () => go({ screen: 'otp', phone: '9876543210', otp: '', otpTries: 0, otpMsg: '', resendAt: Date.now() + 30000 })],
    ['M1', 'DigiLocker down → offline XML fallback', () => go({ screen: 'kyc', kycStep: 'idle', consent: true }, { kyc: 'down' })],
    ['M1', 'Under 18 → blocked until birthday', () => go({ screen: 'kyc', kycStep: 'idle', consent: true }, { kyc: 'minor' })],
    ['M1', 'Selfie liveness fails → video check after 3', () => go({ screen: 'selfie', selfieTries: 0, selfieErr: '' }, { selfie: 'fail' })],
    ['M1', 'Bank name mismatch', () => go({ screen: 'bank', upi: 'ravi@okaxis', bankStep: 'idle' }, { bank: 'mismatch' })],
    ['M4', 'No shifts nearby → widen radius / alerts', () => go({ tab: 'home', radius: 5, filter: 'all' }, { feed: 'empty' })],
    ['M4', 'Offline: cached feed, accept disabled', () => go({ tab: 'home', offline: true }, { feed: 'ok' })],
    ['M5', 'Shift clashes with an accepted shift', () => go({ tab: 'home', filter: 'all' }, { feed: 'ok' })],
    ['M5', 'Shift taken seconds before you', () => go({ tab: 'home', filter: 'all', feed: FEED }, { feed: 'ok' })],
    ['M5', 'Police verification required', () => go({ tab: 'home', filter: 'evening' }, { feed: 'ok' })],
    ['M6', 'Check-in outside geofence → supervisor confirm', () => go({ sub: 'day', dayStage: 'pre' }, { geo: 'outside' })],
    ['M6', 'Offline check-in → offline ticket', () => go({ sub: 'day', dayStage: 'selfie', offline: true }, { geo: 'inside' })],
    ['M6', 'SOS', () => go({ sub: 'day', sheet: { kind: 'sos' } })],
    ['M6', 'Client cancelled shift → compensation', () => go({ tab: 'shifts' })],
    ['M7', 'Withdraw below ₹100 / above balance', () => go({ tab: 'wallet', payAmt: '50' })],
    ['M7', 'Earned-wage advance above 50% cap', () => go({ tab: 'wallet', ewaAmt: '2000' })],
    ['M7', 'UPI payout fails (bank down)', () => go({ tab: 'wallet', payAmt: '500' }, { payout: 'fail' })],
    ['M12', 'Reliability Score breakdown + appeal', () => go({ sub: 'rel' })],
    ['M10', 'Referral not eligible / pending', () => go({ sub: 'refer' })],
    ['M11', 'Ambassador: not a student', () => go({ sub: 'amb' })],
    ['M14', 'Anonymous complaint, fee demand report', () => go({ sub: 'help' })],
    ['M8', 'AI interview consent / ask for human', () => go({ mode: 'career', tab: 'apps' })],
    ['M8', 'Rejected → request human review', () => go({ mode: 'career', tab: 'apps' })],
    ['M16', 'Low-data mode (no images)', () => go({ lowData: true, tab: 'home' })],
    ['M2', 'Language switch (Hindi / Kannada)', () => go({ lang: 'hi', tab: 'home' })],
  ];
}

const Seg = ({ options, value, onChange }) => (
  <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: C.outline, borderRadius: 20, overflow: 'hidden' }}>
    {options.map(([v, l]) => (
      <Tap key={v} scaleTo={0.98} style={{ flex: 1, height: 36, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: value === v ? C.primarySoft : '#fff' }} onPress={() => onChange(v)}>
        <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '500', color: value === v ? C.primaryDark : C.muted }}>{l}</Text>
      </Tap>
    ))}
  </View>
);

export function Demo() {
  const a = useApp();
  const list = edges(a);
  return (
    <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
      <Header title="Demo controls" />
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <Text style={s.meta}>This prototype has no backend. Use these to try each scenario the design covers.</Text>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, color: C.muted }}>Mode</Text>
          <Seg options={[['work', 'Work Now'], ['career', 'Career']]} value={a.mode} onChange={m => { a.setMode(m); a.goTab('home'); }} />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, color: C.muted }}>Network</Text>
          <Seg options={[['on', 'Online'], ['off', 'Offline']]} value={a.offline ? 'off' : 'on'} onChange={v => a.setOffline(v === 'off')} />
        </View>
        {SCENARIOS.map(([k, l, opts]) => (
          <View key={k} style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, color: C.muted }}>{l}</Text>
            <Seg options={opts} value={a.sc[k]} onChange={v => a.setSc(k, v)} />
          </View>
        ))}
        <Btn label="Restart onboarding" icon="restart_alt" kind="o" height={44} onPress={() => { a.setSub(null); a.setScreen('lang'); }} />
        <Text style={[s.h2, { marginTop: 8 }]}>Edge cases · {list.length}</Text>
      </View>
      <View style={{ paddingHorizontal: 8 }}>
        {list.map(([mod, l, on], i) => (
          <FadeIn key={l} delay={Math.min(i, 12) * 25}>
            <Tap scaleTo={0.98} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12 }} onPress={on}>
              <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: C.primarySoft, marginTop: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: C.primaryDark }}>{mod}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 19, color: C.text }}>{l}</Text>
            </Tap>
          </FadeIn>
        ))}
      </View>
    </ScrollView>
  );
}
