import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, Text, TextInput, View } from 'react-native';
import { ini, inr, LANGS } from '../data';
import { animateNext, useApp } from '../store';
import { C, T } from '../theme';
import { Bar, Btn, CountUp, FadeIn, H1, Icon, ND, Pop, Tag, Tap } from '../components/ui';
import { s } from './Home';

/* ---------------- My shifts ---------------- */
export function Shifts() {
  const a = useApp();
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 14 }]}>
      <H1 style={{ fontSize: 24, marginTop: 4 }}>{a.t.shifts}</H1>
      {a.mine.map((m, i) => (
        <FadeIn key={m.id} delay={i * 70} style={[s.card, { borderWidth: 0, backgroundColor: m.day ? C.primarySoft : C.surface2, gap: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontSize: 13, color: C.muted }}>{m.when}</Text>
            <Tag sev={m.sev}>{m.status}</Tag>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '500', color: C.text }}>{m.role} · {m.client}</Text>
          <Text style={[s.meta, { lineHeight: 20 }]}>{m.note}</Text>
          {!!m.act && <Btn label={m.act} icon={m.icon} height={48} onPress={() => (m.day ? a.setSub('day') : a.say('Opening directions…'))} />}
        </FadeIn>
      ))}
    </ScrollView>
  );
}

/* ---------------- Applications (career) ---------------- */
export function Apps() {
  const a = useApp();
  const patch = (id, p, msg) => { animateNext(); a.setApps(l => l.map(x => (x.id === id ? { ...x, ...p } : x))); if (msg) a.say(msg); };
  const actions = x => {
    if (x.kind === 'ai') return [
      ['Consent and start', 'p', () => a.setSheet({ kind: 'aiConsent', id: x.id })],
      ['Ask for a human', 'o', () => patch(x.id, { kind: null, note: 'Human interview requested. A recruiter will call you within 2 days.', status: 'Human interview' }, 'No problem. A recruiter will schedule it.')],
    ];
    if (x.kind === 'int') return [
      ['Practice with AI mock', 't', () => a.say('Mock interview starting: 5 questions on ML system design.')],
      ['Reschedule', 'o', () => a.say('Request sent. You can reschedule once.')],
    ];
    if (x.kind === 'rej') return [['Request human review', 'o', () => patch(x.id, { kind: null, note: 'Review requested. A person will re-check the decision within 5 days.' }, 'Review requested.')]];
    if (x.kind === 'offer') return [
      ['Accept offer', 'p', () => patch(x.id, { kind: null, status: 'Accepted', note: 'Offer accepted with e-sign. Joining 17 Nov.', stage: 5 }, 'Congratulations! Offer accepted.')],
      ['Decline', 'o', () => patch(x.id, { kind: null, status: 'Declined', sev: 'mute', note: 'You declined. The employer has been told.' })],
    ];
    return [];
  };
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 14 }]}>
      <H1 style={{ fontSize: 24, marginTop: 4 }}>Applications</H1>
      {a.apps.map((x, i) => (
        <FadeIn key={x.id} delay={i * 70} style={[s.card, { gap: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: C.text, flex: 1 }}>{x.title}</Text>
            <Tag sev={x.sev}>{x.status}</Tag>
          </View>
          <Text style={s.meta}>{x.co}</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(n => <Bar key={n} pct={n <= x.stage ? 1 : 0} color={x.sev === 'bad' ? C.danger : C.primary} />)}
          </View>
          <Text style={{ fontSize: 14, lineHeight: 20, color: x.sev === 'bad' ? T.bad[1] : C.muted }}>{x.note}</Text>
          {actions(x).length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {actions(x).map(([l, k, on]) => <Btn key={l} label={l} kind={k} height={40} full={false} onPress={on} />)}
            </View>
          )}
        </FadeIn>
      ))}
    </ScrollView>
  );
}

/* ---------------- Wallet ---------------- */
export function Wallet() {
  const a = useApp();
  const pa = parseInt(a.payAmt, 10);
  const wdMsg = a.offline ? "You're offline. Withdrawals need internet." : isNaN(pa) ? 'Enter an amount.' : pa < 100 ? 'Minimum withdrawal is ₹100.' : pa > a.bal ? "That's more than your balance of " + inr(a.bal) + '.' : '';
  const ewaMax = Math.max(0, 1550 - a.ewaTaken);
  const ea = parseInt(a.ewaAmt, 10);
  const ewaMsg = a.ewaAmt === '' ? '' : isNaN(ea) || ea <= 0 ? 'Enter an amount.' : ea > ewaMax ? 'You can take up to ' + inr(ewaMax) + " (half of what you've earned and not yet been paid)." : '';

  const withdraw = () => {
    animateNext();
    if (a.sc.payout === 'fail') {
      a.setTxns(t => [['money_off', 'Withdrawal ' + inr(pa), "Failed: your bank's server is down. Money is safe in your wallet.", '₹0', 'bad'], ...t]);
      return a.say('Payout failed. Your money is still in your wallet. Try again in 30 min.');
    }
    a.setBal(b => b - pa);
    a.setPayAmt(String(a.bal - pa));
    a.setTxns(t => [['north_east', 'Sent to UPI ravi@ybl', 'Just now · UTR 4520 9981 2210', '−' + inr(pa), 'ok'], ...t]);
    a.say(inr(pa) + ' sent to UPI. Arrives in under a minute.');
  };
  const takeEwa = () => {
    animateNext();
    a.setEwaTaken(x => x + ea);
    a.setBal(b => b + ea);
    a.setEwaAmt('');
    a.setTxns(t => [['bolt', 'Wage advance', inr(ea) + " · deducted from Friday's pay", '+' + inr(ea), 'info'], ...t]);
    a.say(inr(ea) + ' advance added to your wallet.');
  };

  return (
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      <FadeIn style={{ borderRadius: 28, backgroundColor: C.primary, padding: 22, gap: 6 }}>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,.9)' }}>{a.t.wallet} · ready to withdraw</Text>
        <CountUp value={a.bal} format={inr} style={{ fontSize: 40, lineHeight: 48, color: '#fff' }} />
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,.9)' }}>₹780 waiting for client approval · paid tonight</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.14)', borderRadius: 28, padding: 4, paddingLeft: 16 }}>
          <Text style={{ fontSize: 18, color: '#fff' }}>₹</Text>
          <TextInput
            value={a.payAmt}
            onChangeText={v => a.setPayAmt(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: 20, outlineStyle: 'none' }}
            accessibilityLabel="Withdraw amount"
          />
          <Btn label="Send to UPI" kind="o" bg="#fff" height={44} full={false} style={{ borderWidth: 0, paddingHorizontal: 18 }} disabled={!!wdMsg} onPress={withdraw} />
        </View>
        {!!wdMsg && <Text style={{ fontSize: 13, color: '#FFDAD6' }}>{wdMsg}</Text>}
      </FadeIn>

      <FadeIn delay={80} style={{ borderRadius: 20, backgroundColor: C.surface2, padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="bolt" color={C.primary} />
          <Text style={{ flex: 1, fontSize: 16, color: C.text }}>Advance from earned wages</Text>
        </View>
        <Text style={[s.meta, { lineHeight: 20 }]}>
          You've earned ₹3,100 this week. Take up to half ({inr(ewaMax)}) before payday. Free, through a licensed partner.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={a.ewaAmt}
            onChangeText={v => a.setEwaAmt(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="Amount"
            placeholderTextColor="#8E918F"
            style={{ flex: 1, minWidth: 0, height: 48, borderRadius: 8, borderWidth: ewaMsg ? 2 : 1, borderColor: ewaMsg ? C.danger : C.outline, paddingHorizontal: 12, fontSize: 17, backgroundColor: '#fff', color: C.text, outlineStyle: 'none' }}
            accessibilityLabel="Advance amount"
          />
          <Btn label="Get advance" height={48} full={false} disabled={!!ewaMsg || !a.ewaAmt || a.offline} onPress={takeEwa} />
        </View>
        {!!ewaMsg && <Text style={{ fontSize: 13, color: C.danger }}>{ewaMsg}</Text>}
      </FadeIn>

      <Text style={[s.h2, { marginTop: 4 }]}>History</Text>
      {a.txns.map(([icon, title, sub, amt, sv], i) => (
        <FadeIn key={title + sub + amt} delay={Math.min(i, 6) * 50} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 6 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T[sv][0], alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={20} color={T[sv][1]} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ fontSize: 15, color: C.text }}>{title}</Text>
            <Text style={{ fontSize: 13, lineHeight: 18, color: sv === 'bad' ? C.danger : C.muted }}>{sub}</Text>
          </View>
          <Text style={{ fontSize: 16, color: amt.startsWith('+') ? C.green : C.text }}>{amt}</Text>
        </FadeIn>
      ))}
    </ScrollView>
  );
}

/* ---------------- Passport ---------------- */
function ScoreRing({ score }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.5)), useNativeDriver: ND }).start();
  }, [v]);
  return (
    <Animated.View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 5, borderColor: '#34A853', alignItems: 'center', justifyContent: 'center', transform: [{ scale: v }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }] }}>
      <Text style={{ fontSize: 18, color: C.text }}>{score}</Text>
    </Animated.View>
  );
}

export function Passport() {
  const a = useApp();
  const work = a.mode === 'work';
  const name = work ? 'Ravi Kumar' : 'Arjun Mehta';
  const stats = work ? [['140', 'Shifts'], ['4.8★', 'Rating'], ['2 yrs', 'On CrossWay']] : [['5 yrs', 'Experience'], ['92', 'Python test'], ['4.4', 'AI interview']];
  const badges = work
    ? [['verified_user', 'KYC verified', 'ok'], ['local_police', 'Police verified · exp. Mar 27', 'ok'], ['restaurant', 'Hospitality · Level 2', 'info'], ['star', 'CrossWay Star · Sep', 'warn'], ['school', 'Food safety course', 'info']]
    : [['verified_user', 'KYC + BGV', 'ok'], ['code', 'Python 92', 'info'], ['storage', 'SQL 88', 'info'], ['psychology', 'ML assessment', 'info']];
  return (
    <ScrollView contentContainerStyle={s.page}>
      <FadeIn style={{ borderRadius: 28, padding: 20, backgroundColor: C.surface2, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Pop><View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: work ? '#FBBC04' : '#34A853', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: '#fff' }}>{ini(name)}</Text>
          </View></Pop>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 20, color: C.text }}>{name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="verified" size={16} color={C.green} />
              <Text style={{ fontSize: 13, color: C.green }}>KYC verified · CW-10231</Text>
            </View>
          </View>
          <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#C4C7C5', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="qr_code_2" size={44} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {stats.map(([v, l], i) => (
            <FadeIn key={l} delay={100 + i * 70} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 20, color: C.text }}>{v}</Text>
              <Text style={{ fontSize: 12, color: C.muted }}>{l}</Text>
            </FadeIn>
          ))}
        </View>
        <Btn label="Share Passport link" icon="share" height={44} onPress={() => a.say('Link copied: crossway.in/p/ravi-2210 · valid 7 days')} />
      </FadeIn>
      <Tap style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 14 }]} onPress={() => a.setSub('rel')}>
        <ScoreRing score={94} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: C.text }}>Reliability Score</Text>
          <Text style={{ fontSize: 13, color: C.muted }}>{a.relAppeal ? 'Appeal under review' : 'Top 10% in Bengaluru · tap to see why'}</Text>
        </View>
        <Icon name="chevron_right" color={C.muted} />
      </Tap>
      <Text style={s.h2}>Badges</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {badges.map(([i, l, sv], k) => (
          <Pop key={l} delay={150 + k * 70}>
            <View style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: T[sv][0], flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={i} size={18} color={T[sv][1]} />
              <Text style={{ fontSize: 14, color: T[sv][1] }}>{l}</Text>
            </View>
          </Pop>
        ))}
      </View>
    </ScrollView>
  );
}

/* ---------------- More ---------------- */
export function More() {
  const a = useApp();
  const work = a.mode === 'work';
  const items = [
    ['card_giftcard', 'Refer and earn', 'Earn ₹300 when a friend finishes a shift', 'refer'],
    ['support', 'Help and complaints', 'Chat, call-back or report anonymously', 'help'],
    ['school', 'Student Ambassador', 'For college students', 'amb'],
    ['swap_horiz', 'Switch to ' + (work ? 'Career' : 'Work Now'), 'Same account, different view', 'mode'],
    ['translate', 'Language', (LANGS.find(l => l[0] === a.lang) || [])[1], 'lang'],
    ['data_saver_on', 'Low-data mode', a.lowData ? 'On · images off' : 'Off', 'low'],
    ['privacy_tip', 'My data', 'Download or delete your data', 'data'],
    ['tune', 'Demo controls', 'Scenarios and edge cases for this prototype', 'demo'],
  ];
  const press = k => {
    if (k === 'mode') { a.setMode(work ? 'career' : 'work'); a.goTab('home'); }
    else if (k === 'lang') a.setScreen('lang');
    else if (k === 'low') a.setLowData(!a.lowData);
    else a.setSub(k);
  };
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 6 }]}>
      <H1 style={{ fontSize: 24, marginTop: 4, marginBottom: 12 }}>{a.t.more}</H1>
      {items.map(([i, l, sub, k], n) => (
        <FadeIn key={k} delay={n * 40}>
          <Tap style={{ flexDirection: 'row', gap: 16, alignItems: 'center', minHeight: 64, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 }} scaleTo={0.98} onPress={() => press(k)}>
            <Icon name={i} color={C.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: C.text }}>{l}</Text>
              <Text style={{ fontSize: 13, color: C.muted }}>{sub}</Text>
            </View>
            <Icon name={k === 'low' ? (a.lowData ? 'toggle_on' : 'toggle_off') : 'chevron_right'} size={k === 'low' ? 32 : 22} color={k === 'low' && a.lowData ? C.primary : C.muted} />
          </Tap>
        </FadeIn>
      ))}
    </ScrollView>
  );
}
