import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { APPS, FEED, MINE, TR, TXNS } from './data';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Animate the next layout change (list items added/removed, sections toggled). */
export const animateNext = () => LayoutAnimation.configureNext(LayoutAnimation.create(240, 'easeInEaseOut', 'opacity'));

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const INITIAL_SC = { kyc: 'ok', selfie: 'ok', bank: 'ok', geo: 'inside', payout: 'ok', feed: 'ok' };

export function AppProvider({ children }) {
  // Navigation: onboarding screens, then the tabbed app with optional sub-page.
  const [screen, setScreen] = useState('lang'); // lang | phone | otp | mode | kyc | selfie | bank | app
  const [seenApp, setSeenApp] = useState(false);
  const [tab, setTab] = useState('home');
  const [sub, setSub] = useState(null); // day | refer | help | amb | data | rel | demo

  const [mode, setMode] = useState('work'); // work | career
  const [lang, setLang] = useState('en');
  const [lowData, setLowData] = useState(false);
  const [offline, setOffline] = useState(false);
  const [sc, setScState] = useState(INITIAL_SC);

  // Onboarding
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpTries, setOtpTries] = useState(0);
  const [otpMsg, setOtpMsg] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [consent, setConsent] = useState(false);
  const [kycStep, setKycStep] = useState('idle');
  const [selfieTries, setSelfieTries] = useState(0);
  const [selfieErr, setSelfieErr] = useState('');
  const [upi, setUpi] = useState('');
  const [bankStep, setBankStep] = useState('idle');

  // App
  const [avail, setAvail] = useState(true);
  const [radius, setRadius] = useState(5);
  const [filter, setFilter] = useState('all');
  const [feed, setFeed] = useState(FEED);
  const [mine, setMine] = useState(MINE);
  const [apps, setApps] = useState(APPS);
  const [dayStage, setDayStage] = useState('pre');
  const [bal, setBal] = useState(2340);
  const [ewaTaken, setEwaTaken] = useState(0);
  const [payAmt, setPayAmt] = useState('2340');
  const [ewaAmt, setEwaAmt] = useState('');
  const [txns, setTxns] = useState(TXNS);
  const [rating, setRating] = useState(0);
  const [relAppeal, setRelAppeal] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);

  // Live values for timeouts that must check state at fire time.
  const sheetRef = useRef(null);
  const dayRef = useRef('pre');
  sheetRef.current = sheet;
  dayRef.current = dayStage;

  const timers = useRef([]);
  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const toastTimer = useRef();
  const say = useCallback(msg => {
    clearTimeout(toastTimer.current);
    setToast({ msg, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const setSc = (k, v) => {
    setScState(s => ({ ...s, [k]: v }));
    if (k === 'geo') setDayStage('pre');
    if (k === 'feed') setRadius(5);
  };

  const goTab = id => { setTab(id); setSub(null); };

  /** Jump straight to a scenario; used by the demo controls' edge-case list. */
  const scenario = (p = {}, scPatch = {}) => {
    setSheet(null);
    setSub(null);
    setMode('work');
    setOffline(false);
    setScreen('app');
    setScState(s => ({ ...s, ...scPatch }));
    const setters = {
      screen: setScreen, sub: setSub, tab: setTab, mode: setMode, lang: setLang, lowData: setLowData, offline: setOffline,
      phone: setPhone, otp: setOtp, otpTries: setOtpTries, otpMsg: setOtpMsg, resendAt: setResendAt, consent: setConsent,
      kycStep: setKycStep, selfieTries: setSelfieTries, selfieErr: setSelfieErr, upi: setUpi, bankStep: setBankStep,
      radius: setRadius, filter: setFilter, feed: setFeed, dayStage: setDayStage, payAmt: setPayAmt, ewaAmt: setEwaAmt, sheet: setSheet,
    };
    Object.entries(p).forEach(([k, v]) => setters[k]?.(v));
  };

  const t = TR[lang] || TR.en;

  const value = {
    screen, setScreen, seenApp, setSeenApp, tab, goTab, setTab, sub, setSub,
    mode, setMode, lang, setLang, t, lowData, setLowData, offline, setOffline, sc, setSc,
    phone, setPhone, otp, setOtp, otpTries, setOtpTries, otpMsg, setOtpMsg, resendAt, setResendAt,
    consent, setConsent, kycStep, setKycStep, selfieTries, setSelfieTries, selfieErr, setSelfieErr,
    upi, setUpi, bankStep, setBankStep,
    avail, setAvail, radius, setRadius, filter, setFilter, feed, setFeed, mine, setMine, apps, setApps,
    dayStage, setDayStage, bal, setBal, ewaTaken, setEwaTaken, payAmt, setPayAmt, ewaAmt, setEwaAmt,
    txns, setTxns, rating, setRating, relAppeal, setRelAppeal, sheet, setSheet, sheetRef, dayRef, toast, say, later, scenario,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
