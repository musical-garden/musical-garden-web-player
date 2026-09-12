// A line-based lyric only needs repainting when its active line changes.
export function createLyricPaintGate() {
 let previousLine = -2;
 return (lineIndex: number, hasKaraokeWords: boolean) => {
  const changed = lineIndex !== previousLine;
  previousLine = lineIndex;
  return changed || hasKaraokeWords;
 };
}
