import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { animateNext, useApp } from '../store';
import { C } from '../theme';
import { Btn, Icon, ND, Pop, Pulse, Tap } from './ui';

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
        actions: [
          ['Confirm shift', 'p', () => {
            animateNext();
            a.setFeed(f => f.map(y => (y.id === x.id ? { ...y, taken: true } : y)));
            a.setMine(m => [{ id: 'n' + x.id, role: x.role, client: x.client.split(' · ')[0], when: x.when, status: 'Confirmed', sev: 'ok', note: 'Reminder the evening before and 2 h before start.' }, ...m]);
            close();
            a.say('Shift confirmed. Directions and reminders are in My shifts.');
          }],
          ['Not now', 'o', close],
        ],
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
  const on = n <= a.rating;
  const sc = useRef(new Animated.Value(1)).current;
  const press = () => {
    a.setRating(n);
    sc.setValue(0.4);
    Animated.spring(sc, { toValue: 1, useNativeDriver: ND, speed: 14, bounciness: 18 }).start();
  };
  return (
    <Pressable onPress={press} accessibilityLabel={n + ' star'} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: sc }] }}>
        <Icon name={on ? 'star' : 'star_border'} size={40} color={on ? '#FBBC04' : '#C4C7C5'} />
      </Animated.View>
    </Pressable>
  );
}

/** Bottom sheet that slides up over a dimmed backdrop and slides away on close. */
export function Sheet() {
  const a = useApp();
  const live = useSheetContent();
  const [content, setContent] = useState(null);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (live) {
      setContent(live);
      Animated.spring(v, { toValue: 1, useNativeDriver: ND, speed: 16, bounciness: 4 }).start();
    } else if (content) {
      Animated.timing(v, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: ND }).start(() => setContent(null));
    }
  }, [a.sheet, a.rating]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = live || content;
  if (!c) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={live ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,.32)', opacity: v }]}>
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
        {c.actions.map(([l, k, on]) => <Btn key={l} label={l} kind={k} onPress={on} />)}
      </Animated.View>
    </View>
  );
}

/** Snackbar that slides up above the tab bar. */
export function Toast() {
  const { toast } = useApp();
  const [msg, setMsg] = useState(null);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (toast) {
      setMsg(toast.msg);
      v.setValue(0);
      Animated.spring(v, { toValue: 1, useNativeDriver: ND, speed: 16, bounciness: 6 }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: 180, useNativeDriver: ND }).start(() => setMsg(null));
    }
  }, [toast, v]);
  if (!msg) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[st.toast, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}
    >
      <Icon name="check_circle" size={20} color="#A8C7FA" />
      <Text style={{ flex: 1, color: '#F2F2F2', fontSize: 14, lineHeight: 20 }}>{msg}</Text>
    </Animated.View>
  );
}

/** Material 3 navigation bar with a sliding active indicator. */
export function TabBar() {
  const a = useApp();
  const work = a.mode === 'work';
  const tabs = work
    ? [['home', 'home', a.t.home], ['shifts', 'work_history', a.t.shifts], ['wallet', 'account_balance_wallet', a.t.wallet], ['passport', 'badge', a.t.passport], ['more', 'menu', a.t.more]]
    : [['home', 'search', 'Jobs'], ['apps', 'assignment', 'Applied'], ['wallet', 'account_balance_wallet', 'Wallet'], ['passport', 'badge', 'Passport'], ['more', 'menu', 'More']];
  const activeTab = work && a.tab === 'apps' ? 'shifts' : !work && a.tab === 'shifts' ? 'apps' : a.tab;
  const idx = Math.max(0, tabs.findIndex(t => t[0] === activeTab));
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(idx)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: idx, useNativeDriver: ND, speed: 18, bounciness: 6 }).start();
  }, [idx, x]);
  const cell = w / tabs.length;
  return (
    <View style={st.nav} onLayout={e => setW(e.nativeEvent.layout.width - 8)}>
      {w > 0 && !a.sub && (
        <Animated.View style={[st.pill, { left: 4 + (cell - 64) / 2, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, cell] }) }] }]} />
      )}
      {tabs.map(([id, icon, label]) => {
        const on = activeTab === id && !a.sub;
        return (
          <Tap key={id} scaleTo={0.9} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, height: 80 }} onPress={() => a.goTab(id)} accessibilityLabel={label}>
            <View style={{ width: 64, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} color={on ? C.primaryDark : C.muted} />
            </View>
            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: on ? '600' : '500', color: C.text }}>{label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

export const st = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28, gap: 14, maxHeight: '86%' },
  grabber: { alignSelf: 'center', width: 32, height: 4, borderRadius: 2, backgroundColor: '#C4C7C5' },
  toast: { position: 'absolute', left: 12, right: 12, bottom: 92, backgroundColor: '#303030', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  nav: { height: 80, backgroundColor: C.surface2, flexDirection: 'row', paddingHorizontal: 4 },
  pill: { position: 'absolute', top: 12, width: 64, height: 32, borderRadius: 16, backgroundColor: C.primarySoft },
});
