import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEqualizerRouting } from '../src/equalizerRouting.ts';
import { createHeartbeatScheduler } from '../src/heartbeatScheduler.ts';

function clock() {
 let now = 0, sequence = 0;
 const jobs = new Map();
 const original = { window: globalThis.window, performance: globalThis.performance };
 globalThis.window = { setTimeout(fn, delay) { jobs.set(++sequence, {fn, at: now+delay}); return sequence; }, clearTimeout(id) { jobs.delete(id); } };
 globalThis.performance = { now: () => now };
 return {
  jobs,
  now: () => now,
  advance(ms) { const end=now+ms; for (;;) { const entry=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0]; if (!entry || entry[1].at>end) break; jobs.delete(entry[0]); now=entry[1].at; entry[1].fn(); } now=end; },
  restore() { Object.assign(globalThis,original); }
 };
}
function node() {
 return { targets: new Set(), gain: { cancelScheduledValues() {}, setValueAtTime() {} }, connect(target) { this.targets.add(target); }, disconnect() { this.targets.clear(); } };
}
test('flat equalizer has exactly one direct route; reactivation cancels pending bypass', () => {
 const time=clock(), source=node(), destination=node(), filters=[node(),node()];
 try {
  const routing=createEqualizerRouting(source,filters,destination,false,time.now);
  assert.deepEqual([...source.targets],[destination]);
  assert.equal(filters[0].targets.size,0);
  routing.setActive(true);
  assert.deepEqual([...source.targets],[filters[0]]);
  assert.deepEqual([...filters[0].targets],[filters[1]]);
  assert.deepEqual([...filters[1].targets],[destination]);
  routing.setActive(false); time.advance(249);
  assert.deepEqual([...source.targets],[filters[0]]);
  routing.setActive(true); time.advance(1000);
  assert.deepEqual([...source.targets],[filters[0]]);
  routing.setActive(false); time.advance(250);
  assert.deepEqual([...source.targets],[destination]);
  assert.ok(filters.every(filter=>filter.targets.size===0));
  routing.setActive(true); routing.setActive(false); routing.dispose(); time.advance(1000);
  assert.equal(source.targets.size,0); assert.equal(time.jobs.size,0);
 } finally { time.restore(); }
});
test('playback and presence share wake-ups without extending renewal periods', () => {
 const time=clock();
 try {
  const scheduler=createHeartbeatScheduler(), playback=[], presence=[];
  const stopPlayback=scheduler.subscribe(()=>playback.push(time.now()),5000);
  const stopPresence=scheduler.subscribe(()=>presence.push(time.now()),25000);
  assert.equal(time.jobs.size,1);
  time.advance(50000);
  assert.equal(playback.length,10); assert.deepEqual(presence,[25000,50000]);
  stopPlayback(); time.advance(25000);
  assert.equal(playback.length,10); assert.equal(presence.length,3);
  stopPresence(); assert.equal(time.jobs.size,0);
 } finally { time.restore(); }
});
