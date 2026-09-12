// Share timer wake-ups without weakening any task's renewal interval.
export function createHeartbeatScheduler() {
 const tasks = new Set<{ callback: () => void; interval: number; due: number }>();
 let timer: number | undefined;
 const schedule = () => {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
  if (!tasks.size) return;
  const due = Math.min(...[...tasks].map(task => task.due));
  timer = window.setTimeout(run, Math.max(0, due - performance.now()));
 };
 const run = () => {
  timer = undefined;
  const now = performance.now();
  for (const task of [...tasks]) {
   if (task.due <= now) {
    task.due = now + task.interval;
    task.callback();
   }
  }
  schedule();
 };
 return {
  subscribe(callback: () => void, interval: number) {
   // All current intervals are multiples of five seconds. Align first deadlines earlier,
   // never later, so online presence can share a playback renewal wake-up.
   const now = performance.now();
   const task = { callback, interval, due: Math.max(now + 1, Math.floor((now + interval) / 5000) * 5000) };
   tasks.add(task); schedule();
   return () => { tasks.delete(task); schedule(); };
  }
 };
}
