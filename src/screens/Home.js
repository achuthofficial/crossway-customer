import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXTRA_SHIFT, JOBS } from '../data';
import { animateNext, useApp } from '../store';
import { C, T } from '../theme';
import { Btn, FadeIn, Icon, Pulse, Switch, Tag, Tap } from '../components/ui';

const CHIPS = [['all', 'All'], ['near', 'Under 5 km'], ['evening', 'Evenings'], ['pay', 'Highest pay']];
const payNum = x => parseInt(x.pay.replace(/\D/g, ''), 10);

function visibleFeed(a) {
  if (a.sc.feed === 'empty') return a.radius >= 15 ? [EXTRA_SHIFT] : [];
  let list = a.feed.filter(x => !x.taken);
  if (a.filter === 'near') list = list.filter(x => parseFloat(x.dist) <= 5);
  if (a.filter === 'evening') list = list.filter(x => x.cat === 'evening');
  if (a.filter === 'pay') list = [...list].sort((p, q) => payNum(q) - payNum(p));
  return list;
}

function ShiftCard({ x, i }) {
  const a = useApp();
  let warn = '', wfg = C.muted, cta = a.t.accept, bicon = 'check', dis = a.offline, bg = C.primary, fg = '#fff', op = 1;
  if (x.kind === 'conflict') { warn = 'Overlaps your 5–9 pm shift at Prestige Tech Park.'; wfg = C.danger; cta = 'Clashes with your shift'; bicon = 'event_busy'; dis = true; bg = C.surface3; fg = C.muted; op = 0.7; }
  else if (x.kind === 'far') { warn = "About 55 min by bus each way. Travel isn't paid."; wfg = '#7A5900'; }
  else if (x.kind === 'police') { warn = 'This site needs police verification. It takes 3–5 days; start now to make 31 Oct.'; wfg = C.danger; cta = 'Get police verification'; bicon = 'local_police'; bg = C.primarySoft; fg = C.primaryDark; }
  if (a.offline) { cta = 'Go online to accept'; bicon = 'wifi_off'; bg = C.surface3; fg = C.muted; }

  const press = () => {
    if (x.kind === 'police') return a.setSheet({ kind: 'police' });
    if (x.kind === 'race') {
      animateNext();
      a.setFeed(f => f.map(y => (y.id === x.id ? { ...y, taken: true } : y)));
      return a.setSheet({ kind: 'race' });
    }
    a.setSheet({ kind: 'accept', id: x.id });
  };

  return (
    <FadeIn delay={i * 70} style={[s.card, { opacity: op }]}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
        {!a.lowData && (
          <View style={s.shiftIcon}><Icon name={x.icon} size={32} color={C.primaryDark} /></View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 17, fontWeight: '500', color: C.text }}>{x.role}</Text>
          <Text style={s.meta}>{x.client}</Text>
          <Text style={s.meta}>{x.when}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 22, color: C.green }}>{x.pay}</Text>
          <Text style={{ fontSize: 12, color: C.muted }}>{x.dist}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {x.tags.map(([ic, l, sv]) => <Tag key={l} sev={sv} icon={ic}>{l}</Tag>)}
      </View>
      {!!warn && <Text style={{ fontSize: 13, color: wfg, lineHeight: 18 }}>{warn}</Text>}
      <Btn label={cta} icon={bicon} height={52} bg={bg} fg={fg} disabled={dis && x.kind !== 'conflict'} onPress={dis ? undefined : press} />
    </FadeIn>
  );
}

export function HomeWork() {
  const a = useApp();
  const feed = visibleFeed(a);
  const langShort = { en: 'EN', hi: 'हि', kn: 'ಕ' }[a.lang];

  const openVoice = () => {
    if (a.offline) return a.say('Voice search needs internet.');
    a.setSheet({ kind: 'voice', text: 'Listening…' });
    a.later(() => a.setSheet(sh => (sh && sh.kind === 'voice' ? { ...sh, text: '"waiter job near me this evening"' } : sh)), 900);
    a.later(() => {
      if (a.sheetRef.current?.kind !== 'voice') return;
      a.setSheet(null);
      animateNext();
      a.setFilter('evening');
      a.say('Showing evening shifts within 5 km.');
    }, 2000);
  };

  return (
    <ScrollView contentContainerStyle={s.page}>
      <FadeIn style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[s.avatar, { backgroundColor: '#FBBC04' }]}><Text style={{ fontWeight: '600', color: '#3B2A00' }}>RK</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, color: C.text }}>{a.t.hello}</Text>
          <Text style={{ fontSize: 13, color: C.muted }}>Indiranagar, Bengaluru</Text>
        </View>
        <Tap style={s.langBtn} onPress={() => a.setLang({ en: 'hi', hi: 'kn', kn: 'en' }[a.lang])} accessibilityLabel="Change language">
          <Text style={{ fontSize: 14, color: C.text }}>{langShort}</Text>
        </Tap>
      </FadeIn>

      <FadeIn delay={60} style={[s.avail, { backgroundColor: a.avail ? T.ok[0] : C.surface2 }]}>
        <Icon name={a.avail ? 'check_circle' : 'do_not_disturb_on'} color={a.avail ? C.green : C.muted} />
        <Text style={{ flex: 1, fontSize: 16, color: C.text }}>{a.t.avail}</Text>
        <Switch
          value={a.avail}
          label={a.t.avail}
          onChange={() => { a.setAvail(!a.avail); a.say(a.avail ? "You won't get shift alerts today." : "You're visible to employers today."); }}
        />
      </FadeIn>

      <FadeIn delay={120}>
        <Tap style={s.voice} onPress={openVoice} accessibilityLabel={a.t.speak}>
          <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Pulse size={28} color="rgba(255,255,255,.5)" />
            <Icon name="mic" size={28} color="#fff" />
          </View>
          <Text style={{ fontSize: 17, color: '#fff' }}>{a.t.speak}</Text>
        </Tap>
      </FadeIn>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {CHIPS.map(([id, l]) => {
          const on = a.filter === id;
          return (
            <Tap key={id} style={[s.chip, on && { backgroundColor: C.primarySoft, borderWidth: 0 }]} onPress={() => { animateNext(); a.setFilter(id); }}>
              {on && <Icon name="check" size={18} color={C.primaryDark} />}
              <Text style={{ fontSize: 14, color: on ? C.primaryDark : C.muted }}>{l}</Text>
            </Tap>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={s.h2}>{a.t.near}</Text>
        <Text style={{ fontSize: 13, color: C.muted }}>{feed.length ? feed.length + ' shifts · ' + a.radius + ' km' : ''}</Text>
      </View>

      {!feed.length && (
        <FadeIn style={[s.card, { backgroundColor: C.surface2, borderWidth: 0, gap: 10 }]}>
          <Icon name="travel_explore" size={40} color={C.muted} />
          <Text style={{ fontSize: 17, color: C.text }}>No shifts near you right now</Text>
          <Text style={[s.meta, { lineHeight: 20 }]}>Weekends and evenings have the most work. Turn on alerts and we'll ping you the moment one opens.</Text>
          <Btn label="Search up to 15 km" height={44} full={false} onPress={() => { animateNext(); a.setRadius(15); a.say('Searching up to 15 km.'); }} />
          <Btn label="Alert me" kind="o" height={44} full={false} onPress={() => a.say("Alerts on. We'll ping you by WhatsApp and SMS.")} />
        </FadeIn>
      )}
      {feed.map((x, i) => <ShiftCard key={x.id + a.filter} x={x} i={i} />)}
    </ScrollView>
  );
}

export function HomeCareer() {
  const a = useApp();
  return (
    <ScrollView contentContainerStyle={s.page}>
      <FadeIn style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[s.avatar, { backgroundColor: '#34A853' }]}><Text style={{ fontWeight: '600', color: '#fff' }}>AM</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, color: C.text }}>Hi, Arjun</Text>
          <Text style={{ fontSize: 13, color: C.muted }}>Data scientist · 5 yrs · Bengaluru</Text>
        </View>
      </FadeIn>
      <FadeIn delay={60} style={s.search}>
        <Icon name="search" color={C.muted} />
        <Text style={{ fontSize: 15, color: C.muted }}>Search roles, companies</Text>
      </FadeIn>
      <FadeIn delay={120} style={[s.card, { backgroundColor: C.primarySoft, borderWidth: 0, gap: 6 }]}>
        <Text style={{ fontSize: 13, color: C.primaryDark }}>Salary insight · Senior data scientist, Bengaluru</Text>
        <Text style={{ fontSize: 24, color: C.primaryDark }}>₹32–48 LPA</Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.6)', marginVertical: 4 }}>
          <View style={{ position: 'absolute', left: '62%', top: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: C.primary, borderWidth: 2, borderColor: '#fff' }} />
        </View>
        <Text style={{ fontSize: 13, color: C.primaryDark }}>Your expected ₹42 LPA sits at the 62nd percentile.</Text>
      </FadeIn>
      <Text style={s.h2}>Matched for you</Text>
      {JOBS.map((j, i) => {
        const applied = j.id === 'j1' || a.apps.some(x => x.jid === j.id);
        return (
          <FadeIn key={j.id} delay={160 + i * 80} style={[s.card, { gap: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: C.text, flex: 1 }}>{j.title}</Text>
              <Text style={{ fontSize: 14, color: C.primary }}>{j.match}</Text>
            </View>
            <Text style={s.meta}>{j.co} · {j.loc}</Text>
            <Text style={{ fontSize: 14, color: C.text }}>{j.pay}</Text>
            <Text style={{ fontSize: 13, color: C.muted }}>{j.why}</Text>
            <Btn
              label={applied ? 'Applied' : 'Apply in one tap'}
              icon={applied ? 'check' : undefined}
              kind={applied ? 'g' : 'p'}
              height={40}
              full={false}
              disabled={applied}
              onPress={() => {
                a.setApps(list => [{ id: 'a' + Date.now(), jid: j.id, title: j.title, co: j.co, status: 'Applied', sev: 'info', stage: 1, note: 'Sent with your Passport. Recruiters usually reply in 3 days.' }, ...list]);
                a.say('Applied with your Passport.');
              }}
            />
          </FadeIn>
        );
      })}
    </ScrollView>
  );
}

export const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 24, gap: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  langBtn: { height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: C.outline, backgroundColor: '#fff', justifyContent: 'center' },
  avail: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20 },
  voice: { height: 60, borderRadius: 30, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: C.outline, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 6 },
  h2: { fontSize: 18, fontWeight: '500', color: C.text },
  card: { borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 16, gap: 12, backgroundColor: '#fff' },
  shiftIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  meta: { fontSize: 14, color: C.muted },
  search: { height: 52, borderRadius: 26, backgroundColor: C.surface3, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18 },
});
