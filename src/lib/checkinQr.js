// Site check-in QR, shared by the client portal (shows the code) and the worker app (scans it).
// Keep this file identical in crossway-client and crossway-customer.
//
// Payload: https://crossway.in/c/<SITE>?w=<window>&s=<signature>
//  - SITE: outlet / site id, e.g. STR-IND
//  - window: 30-second time window the code was made in, so a photo of the code goes stale fast
//  - signature: ties site and window together so a code can't be hand-edited
// Each code also has a 6-digit fallback for when the camera can't be used.
//
// This prototype has no backend, so the signature is a demo hash with a fixed key. In production
// the server issues the codes and signs them (HMAC-SHA256) with a per-site secret, and verifies scans.

export const WINDOW_S = 30;
export const GRACE_WINDOWS = 2; // a code is accepted for up to ~90 s
const DEMO_KEY = 'crossway-demo-site-key';
const PREFIX = 'https://crossway.in/c/';

const fnv = str => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

export const windowAt = (ms = Date.now()) => Math.floor(ms / 1000 / WINDOW_S);
/** Milliseconds until the current code is replaced. */
export const msLeft = (ms = Date.now()) => WINDOW_S * 1000 - (ms % (WINDOW_S * 1000));

const sign = (site, w) => fnv(`${site}|${w}|${DEMO_KEY}`).toString(36);

/** QR payload for a site in a given window. */
export const makePayload = (site, w = windowAt()) => `${PREFIX}${encodeURIComponent(site)}?w=${w}&s=${sign(site, w)}`;

/** Six-digit code printed under the QR. */
export const manualCode = (site, w = windowAt()) => String(fnv(`${site}|${w}|code|${DEMO_KEY}`) % 1000000).padStart(6, '0');

/**
 * Check a scanned payload against the site the worker is booked at.
 * Returns { ok: true, site } or { ok: false, reason: 'format' | 'tampered' | 'expired' | 'wrong-site', site? }.
 * (verifyCode can also return 'mismatch'.)
 */
export function verifyPayload(text, expectedSite, now = Date.now()) {
  const m = /^https:\/\/crossway\.in\/c\/([^?]+)\?w=(\d+)&s=([0-9a-z]+)$/.exec(String(text || '').trim());
  if (!m) return { ok: false, reason: 'format' };
  const site = decodeURIComponent(m[1]);
  const w = Number(m[2]);
  if (sign(site, w) !== m[3]) return { ok: false, reason: 'tampered', site };
  if (Math.abs(windowAt(now) - w) > GRACE_WINDOWS) return { ok: false, reason: 'expired', site };
  if (expectedSite && site !== expectedSite) return { ok: false, reason: 'wrong-site', site };
  return { ok: true, site };
}

/** Check a typed 6-digit code for the expected site. */
export function verifyCode(code, site, now = Date.now()) {
  const c = String(code || '').replace(/\D/g, '');
  if (c.length !== 6) return { ok: false, reason: 'format' };
  const w0 = windowAt(now);
  for (let d = -GRACE_WINDOWS; d <= 0; d++) if (manualCode(site, w0 + d) === c) return { ok: true, site };
  // Codes from a few minutes ago read as expired; anything else is a typo or another site.
  for (let d = -20; d < -GRACE_WINDOWS; d++) if (manualCode(site, w0 + d) === c) return { ok: false, reason: 'expired' };
  return { ok: false, reason: 'mismatch' };
}

/** Known sites, so a wrong-site scan can say where the code is from. */
export const SITES = {
  'STR-IND': 'Saffron Table · Indiranagar',
  'STR-KOR': 'Saffron Table · Koramangala',
  'STR-HSR': 'Saffron Table · HSR Layout',
  'PTP-TB': 'Prestige Tech Park · Tower B',
  'TOIT-IND': 'Toit Brewpub · Indiranagar',
};

/** Rest-break rules: shifts over 5 h get a break. Clients may lengthen it, never shorten it. */
export const BREAK = { defaultMin: 30, min: 30, max: 90, step: 15, afterHours: 5 };
