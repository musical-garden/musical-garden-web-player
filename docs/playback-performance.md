# Playback rendering performance

- Karaoke keeps its 33 ms frame-aligned clock in FullLyricsPage. The parent App uses its existing 250 ms playback-time update path, rather than rerendering the whole application for every karaoke tick.
- Spectrum sampling keeps the existing 320 ms cadence and tolerance, using a timer instead of waking on every display frame.
- Both visual loops cancel their scheduled work when the document is hidden, resume immediately when visible, and clean up on unmount. Background playback and the audio signal chain are unchanged.
- Hidden-page timeupdate events update the time ref without scheduling React renders. Returning to the page synchronizes from the audio element.
- Decorative animation is paused only while the document is hidden. Foreground visuals, mobile layout, EQ and audio formats are unchanged.

Validation: `npm run build` and `node --experimental-strip-types --test tests/playbackScheduler.test.mjs` (Node 24). Tests cover cadence, hidden startup, background cancellation, foreground resynchronization and teardown.

Actual device energy savings are not measured by these tests. Compare the same track and screen brightness on iPhone, including foreground lyrics, seeking, pause/resume, track changes, and lock-screen playback; use Safari Web Inspector to compare CPU and rendering time.
