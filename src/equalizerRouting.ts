// Keep a single audio path. Once zero-gain ramps settle, disconnect idle filters.
export function createEqualizerRouting(source: AudioNode, filters: BiquadFilterNode[], destination: AudioNode, initiallyActive: boolean, now: () => number) {
 let active = initiallyActive;
 let pending: number | undefined;
 const connect = () => {
  if (!active) { source.connect(destination); return; }
  source.connect(filters[0]);
  for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
  filters[filters.length - 1].connect(destination);
 };
 const cancel = () => { if (pending !== undefined) window.clearTimeout(pending); pending = undefined; };
 const bypass = () => {
  pending = undefined;
  if (!active) return;
  // The caller already ramped to zero; pin identity gains before changing the graph.
  for (const filter of filters) { filter.gain.cancelScheduledValues(now()); filter.gain.setValueAtTime(0, now()); }
  source.disconnect(); filters.forEach(filter => filter.disconnect());
  active = false; connect();
 };
 connect();
 return {
  setActive(next: boolean, immediate = false) {
   cancel();
   if (next) {
    if (!active) { source.disconnect(); active = true; connect(); }
   } else if (active) {
    if (immediate) bypass();
    else pending = window.setTimeout(bypass, 250); // > 13 time constants of the existing 18 ms ramp.
   }
  },
  dispose() { cancel(); source.disconnect(); filters.forEach(filter => filter.disconnect()); }
 };
}
