import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startVisiblePlaybackLoop } from '../src/playbackScheduler.ts';

function setup() {
 let now = 0, id = 0;
 const jobs = new Map();
 const doc = new EventTarget(); doc.visibilityState = 'visible';
 const originals = { document: globalThis.document, window: globalThis.window, performance: globalThis.performance };
 const schedule = (fn, delay) => { jobs.set(++id, { at: now + delay, fn }); return id; };
 globalThis.document = doc;
 globalThis.performance = { now: () => now };
 globalThis.window = {
  setTimeout: schedule, clearTimeout: id => jobs.delete(id),
  requestAnimationFrame: fn => schedule(fn, 1000 / 60), cancelAnimationFrame: id => jobs.delete(id)
 };
 return {
  jobs,
  advance(ms) { const end = now + ms; for (;;) { const next = [...jobs.entries()].sort((a,b) => a[1].at-b[1].at)[0]; if (!next || next[1].at > end) break; now = next[1].at; jobs.delete(next[0]); next[1].fn(); } now = end; },
  visibility(state) { doc.visibilityState = state; doc.dispatchEvent(new Event('visibilitychange')); },
  restore() { Object.assign(globalThis, originals); }
 };
}

test('spectrum only wakes at its sampling interval and stops while hidden', () => {
 const env = setup(); let ticks = 0;
 try {
  const stop = startVisiblePlaybackLoop(() => ticks++, 320);
  env.advance(1000); assert.equal(ticks, 4);
  env.visibility('hidden'); assert.equal(env.jobs.size, 0);
  env.advance(10000); assert.equal(ticks, 4);
  env.visibility('visible'); assert.equal(ticks, 5);
  env.advance(320); assert.equal(ticks, 6);
  stop(); assert.equal(env.jobs.size, 0);
  env.visibility('visible'); env.advance(1000); assert.equal(ticks, 6);
 } finally { env.restore(); }
});

test('lyrics keep their frame-aligned cadence, resume immediately and clean up', () => {
 const env = setup(); let ticks = 0;
 try {
  env.visibility('hidden');
  const stop = startVisiblePlaybackLoop(() => ticks++, 33, true);
  assert.equal(ticks, 0); assert.equal(env.jobs.size, 0);
  env.visibility('visible'); assert.equal(ticks, 1);
  env.advance(1000); assert.ok(ticks >= 25 && ticks <= 32);
  env.visibility('hidden'); const previous = ticks;
  env.advance(5000); assert.equal(ticks, previous); assert.equal(env.jobs.size, 0);
  env.visibility('visible'); assert.equal(ticks, previous + 1);
  stop(); env.advance(1000); assert.equal(ticks, previous + 1);
 } finally { env.restore(); }
});
