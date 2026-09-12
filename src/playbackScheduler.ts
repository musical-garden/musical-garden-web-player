// Visible-page work only. Audio playback is deliberately not paused here.
export function startVisiblePlaybackLoop(tick: () => void, intervalMs: number, frameAligned = false) {
 let stopped = false;
 let pending: number | undefined;
 let lastTick = -Infinity;
 const cancel = () => {
  if (pending !== undefined) {
   if (frameAligned) window.cancelAnimationFrame(pending);
   else window.clearTimeout(pending);
   pending = undefined;
  }
 };
 const run = () => {
  pending = undefined;
  if (stopped || document.visibilityState !== "visible") return;
  const now = performance.now();
  if (now - lastTick >= intervalMs) { lastTick = now; tick(); }
  if (stopped || document.visibilityState !== "visible") return;
  pending = frameAligned ? window.requestAnimationFrame(run) : window.setTimeout(run, intervalMs);
 };
 const visibilityChanged = () => {
  cancel();
  lastTick = -Infinity;
  run();
 };
 document.addEventListener("visibilitychange", visibilityChanged);
 run();
 return () => { stopped = true; cancel(); document.removeEventListener("visibilitychange", visibilityChanged); };
}
