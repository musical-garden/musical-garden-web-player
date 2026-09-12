import { memo, useEffect, useState } from "react";
import { getTrackReflections, type TrackReflection } from "./api";

export const SongReflection = memo(function SongReflection({ trackID }: { trackID?: number }) {
 const [result, setResult] = useState<{ trackID: number; items: TrackReflection[] } | null>(null);
 const [index, setIndex] = useState(0);
 const [failed, setFailed] = useState<number | null>(null);
 const [retry, setRetry] = useState(0);
 useEffect(() => {
  if (!trackID) return;
  const controller = new AbortController();
  setIndex(0);
  setFailed(null);
  getTrackReflections(trackID, controller.signal).then(data => {
   if (!controller.signal.aborted) setResult({ trackID, items: data.reflections.filter(item => item.text.trim()) });
  }).catch(() => {
   if (!controller.signal.aborted) setFailed(trackID);
  });
  return () => controller.abort();
 }, [trackID, retry]);
 const items = result && result.trackID === trackID ? result.items : [];
 const current = items[index % items.length];
 if (!current && failed !== trackID) return null;
 if (!trackID) return null;
 return <button className="lyrics-life-reflection" type="button"
   aria-label={current ? `歌曲感悟，第${index + 1}句，共${items.length}句，点击切换` : "重新加载歌曲感悟"}
   title={current ? "点击切换下一句" : "点击重试"}
   onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}
   onDoubleClick={event => { event.preventDefault(); event.stopPropagation(); }}
   onClick={event => { event.stopPropagation(); if (current) setIndex(value => (value + 1) % items.length); else setRetry(value => value + 1); }}>
   <span className="lyrics-life-reflection-text">{current?.text ?? "歌曲感悟加载失败，点击重试"}</span>
 </button>;
});
