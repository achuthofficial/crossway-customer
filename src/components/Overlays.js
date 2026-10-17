import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { animateNext, useApp } from '../store';
import { C } from '../theme';
import { Btn, Icon, Pop, Pulse } from './ui';
import { MorphButton, MorphNavBar, SuccessBurst, useMotion } from '../motion';

/** Build the content of the current bottom sheet from app state. */
function useSheetContent() {
  const a = useApp();
  const sh = a.sheet;
  if (!sh) return null;
  const close = () => a.setSheet(null);
  switch (sh.kind) {
    case 'accept': {
      const x = a.feed.find(f => f.id === sh.id);
      if (!x) return null;
      return {
        title: x.role + ' · ' + x.client,
        body: x.when,
        rows: [['You get', x.pay + ' (paid next day)'], ['Fee', '₹0 · always free'], ['Cancel', 'Free until 12 h before']],
        // Confirm morphs pill → loading → check, bursts confetti, then the sheet closes.
        morph: ['Confirm shift', 'Shift confirmed', () => {
          animateNext();
          a.setFeed(f => f.map(y => (y.id === x.id ? { ...y, taken: true } : y)));
          a.setMine(m => [{ id: 'n' + x.id, role: x.role, client: x.client.split(' · ')[0], when: x.when, status: 'Confirmed', sev: 'ok', note: 'Reminder the evening before and 2 h before start.' }, ...m]);
          if (a.sub === 'job') a.setSub(null);
          close();
          a.say('Shift confirmed. Directions and reminders are in My shifts.');
        }],
        actions: [['Not now', 'o', close]],
      };
    }
    case 'race':
      return {
        icon: ['sentiment_dissatisfied', '#B06000'],
        title: 'Someone just took this shift',
        body: "The last spot at Third Wave Coffee was accepted seconds before you. You're first in line if it opens again.",
        actions: [['Show similar shifts', 'p', () => { close(); a.setFilter('all'); }], ['OK', 'o', close]],
      };
    case 'police':
      return {
        icon: ['local_police', C.primary],
        title: 'Get police verification',
        body: "CrossWay applies for you through the state portal. It's free and takes 3–5 working days. You'll get a Passport badge when it's done.",
        actions: [['Apply now', 'p', () => { close(); a.say("Application filed. We'll notify you when the police respond."); }], ['Later', 'o', close]],
      };
    case 'rate':
      return {
        title: 'How was Prestige Tech Park?',
        body: 'Your rating is anonymous to the client and helps other workers.',
        stars: true,
        actions: [['Submit', 'p', () => { close(); a.say(a.rating ? 'Thanks! Rated ' + a.rating + '★.' : 'Skipped rating.'); }]],
      };
    case 'voice':
      return { title: 'Speak now', body: 'Try "waiter job near me this evening"', listen: sh.text || 'Listening…', actions: [['Cancel', 'o', close]] };
    case 'sos':
      return {
        icon: ['emergency', C.danger],
        title: 'Do you need help now?',
        body: "SOS shares your live location with CrossWay's 24×7 safety desk and your emergency contact, and calls you back within 60 seconds.",
        actions: [
          ['Send SOS', 'd', () => { close(); a.say('SOS sent. Safety desk is calling you. Location shared with Lakshmi (sister).'); }],
          ['Call 112', 'o', () => { close(); a.say('Dialling 112…'); }],
          ['Cancel', 'o', close],
        ],
      };
    case 'aiConsent':
      return {
        icon: ['smart_toy', C.primary],
        title: 'Before your AI interview',
        body: 'The AI asks questions and scores your answers with reasons. A person makes every hiring decision. Your recording is used only for this application and deleted after 90 days.',
        actions: [
          ['I agree, start', 'p', () => {
            animateNext();
            a.setApps(l => l.map(x => (x.id === sh.id ? { ...x, kind: null, status: 'Under review', stage: 3, note: 'Interview done. Scorecard 4.4/5 sent to a recruiter for review.' } : x)));
            close();
            a.say('Interview complete. A recruiter reviews it next.');
          }],
          ['Not now', 'o', close],
        ],
      };
    default:
      return null;
  }
}

function Star({ n }) {
  const a = useApp();
  const mo = useMotion();
  const on = n <= a.rating;
  const sc = useRef(new Animated.Value(1)).current;
  const press = () => {
    a.setRating(n);
    sc.setValue(0.4);
    mo.to(sc, 1, { speed: 'fast' }).start();
  };
  return (
    <Pressable onPress={press} accessibilityLabel={n + ' star'} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: sc }] }}>
        <Icon name={on ? 'star' : 'star_border'} size={40} color={on ? '#FBBC04' : '#C4C7C5'} />
      </Animated.View>
    </Pressable>
  );
}

/** Confirm button for a sheet: idle → loading (900 ms) → success + confetti → commit. */
function MorphAction({ label, done, onCommit }) {
  const a = useApp();
  const [state, setState] = useState('idle');
  const [burst, setBurst] = useState(0);
  const press = () => {
    setState('loading');
    a.later(() => {
      setState('success');
      setBurst(Date.now());
      a.later(onCommit, 900);
    }, 900);
  };
  return (
    <View style={{ alignItems: 'center', paddingBottom: state === 'success' ? 22 : 0 }}>
      <MorphButton state={state} label={label} successLabel={done} onPress={press} color={C.primary} height={56} />
      <SuccessBurst trigger={burst} style={{ left: '50%', top: 28 }} />
    </View>
  );
}

/** Bottom sheet that slides up over a dimmed backdrop and slides away on close. */
export function Sheet() {
  const a = useApp();
  const mo = useMotion();
  const live = useSheetContent();
  const [content, setContent] = useState(null);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (live) {
      setContent(live);
      mo.to(v, 1).start();
    } else if (content) {
      mo.to(v, 0, { speed: 'fast' }).start(() => setContent(null));
    }
  }, [a.sheet, a.rating]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = live || content;
  if (!c) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={live ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,.32)', opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
        <Pressable style={{ flex: 1 }} onPress={() => a.setSheet(null)} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[st.sheet, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
        <View style={st.grabber} />
        {c.icon && <Pop><Icon name={c.icon[0]} size={36} color={c.icon[1]} /></Pop>}
        <Text style={{ fontSize: 22, lineHeight: 30, color: C.text }}>{c.title}</Text>
        {!!c.body && <Text style={{ fontSize: 15, lineHeight: 22, color: C.muted }}>{c.body}</Text>}
        {(c.rows || []).map(([k, val]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ fontSize: 15, color: C.muted }}>{k}</Text>
            <Text style={{ fontSize: 15, color: C.text }}>{val}</Text>
          </View>
        ))}
        {c.stars && <View style={{ flexDirection: 'row', gap: 6 }}>{[1, 2, 3, 4, 5].map(n => <Star key={n} n={n} />)}</View>}
        {c.listen && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }}>
            <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
              <Pulse size={72} color="rgba(234,67,53,.35)" />
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#EA4335', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mic" size={36} color="#fff" />
              </View>
            </View>
            <Text style={{ flex: 1, fontSize: 18, color: C.text }}>{c.listen}</Text>
          </View>
        )}
        {c.morph && <MorphAction key={a.sheet?.id} label={c.morph[0]} done={c.morph[1]} onCommit={c.morph[2]} />}
        {c.actions.map(([l, k, on]) => <Btn key={l} label={l} kind={k} onPress={on} />)}
      </Animated.View>
    </View>
  );
}

/** Snackbar that slides up above the tab bar. */
export function Toast() {
  const { toast } = useApp();
  const mo = useMotion();
  const [msg, setMsg] = useState(null);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (toast) {
      setMsg(toast.msg);
      v.setValue(0);
      mo.to(v, 1, { speed: 'fast' }).start();
    } else {
      mo.to(v, 0, { kind: 'effects', speed: 'fast' }).start(() => setMsg(null));
    }
  }, [toast, v]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!msg) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[st.toast, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}
    >
      <Icon name="check_circle" size={20} color="#A8C7FA" />
      <Text style={{ flex: 1, color: '#F2F2F2', fontSize: 14, lineHeight: 20 }}>{msg}</Text>
    </Animated.View>
  );
}

/** Material 3 navigation bar: stretching indicator pill, outlined → filled icons with a bounce. */
export function TabBar() {
  const a = useApp();
  const work = a.mode === 'work';
  const items = work
    ? [{ id: 'home', icon: 'home', label: a.t.home }, { id: 'shifts', icon: 'briefcase-clock', label: a.t.shifts }, { id: 'wallet', icon: 'wallet', label: a.t.wallet }, { id: 'passport', icon: 'card-account-details', label: a.t.passport }, { id: 'more', icon: 'dots-horizontal-circle', label: a.t.more }]
    : [{ id: 'home', icon: 'briefcase-search', label: 'Jobs' }, { id: 'apps', icon: 'clipboard-text', label: 'Applied' }, { id: 'wallet', icon: 'wallet', label: 'Wallet' }, { id: 'passport', icon: 'card-account-details', label: 'Passport' }, { id: 'more', icon: 'dots-horizontal-circle', label: 'More' }];
  const active = work && a.tab === 'apps' ? 'shifts' : !work && a.tab === 'shifts' ? 'apps' : a.tab;
  return (
    <MorphNavBar
      items={items}
      active={active}
      showIndicator={!a.sub}
      onChange={a.goTab}
      colors={{ bg: C.surface2, pill: C.primarySoft, icon: C.muted, iconActive: C.primaryDark, text: C.text }}
    />
  );
}

export const st = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28, gap: 14, maxHeight: '86%' },
  grabber: { alignSelf: 'center', width: 32, height: 4, borderRadius: 2, backgroundColor: '#C4C7C5' },
  toast: { position: 'absolute', left: 12, right: 12, bottom: 92, backgroundColor: '#303030', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
});
