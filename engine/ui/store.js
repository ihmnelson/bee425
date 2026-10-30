/* Progress, kept in this browser only (localStorage, with an in-memory fallback). Versioned so a later format can migrate it.
   Key: quest.v2.<course id>.  Export/import moves it between devices. */
import { useEffect, useState } from 'preact/hooks';
import { blank } from '../lib/mastery.js';

const VERSION = 2;
let key = 'quest.v2.course', state = null;
const subs = new Set();
const fresh = () => ({ v: VERSION, prefs: { track: null }, records: {} });

export function init(courseId) {
  key = `quest.v2.${courseId}`;
  try { const raw = JSON.parse(localStorage.getItem(key)); if (raw && raw.v === VERSION) state = raw; } catch (e) { /* private window or blocked storage */ }
  if (!state) state = fresh();
}

const persist = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* in-memory only */ } };
const notify = () => subs.forEach((f) => f());

export const get = () => state;
export const record = (id) => state.records[id] || blank();
export function setRecords(map) { state = { ...state, records: { ...state.records, ...map } }; persist(); notify(); }
export function setTrack(track) { state = { ...state, prefs: { ...state.prefs, track } }; persist(); notify(); }
export function reset() { state = fresh(); persist(); notify(); }
export const exportJSON = () => JSON.stringify(state, null, 2);
export function importJSON(text) {
  const raw = JSON.parse(text);
  if (!raw || raw.v !== VERSION || typeof raw.records !== 'object') throw new Error('This is not a progress file for this version of the site.');
  state = { ...fresh(), ...raw }; persist(); notify();
}

export function useStore() {
  const [, set] = useState(0);
  useEffect(() => { const f = () => set((n) => n + 1); subs.add(f); return () => subs.delete(f); }, []);
  return state;
}
