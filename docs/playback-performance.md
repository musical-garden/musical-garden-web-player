# Playback performance

## Rendering

The 33 ms frame-aligned lyric clock lives inside FullLyricsPage, while App uses its existing 250 ms playback-time updates. Individual lyric rows are memoized: only the active karaoke row receives the current display time. Static rows still update when their active/distance/seek state changes. Seek handlers use stable forwarding functions so cached rows always invoke current logic. The decorative scene is separately memoized, retaining all existing visual effects.

Spectrum sampling keeps its 320 ms cadence and tolerance without waking on every display frame. Visible-page loops stop in the background and resume immediately. Audio playback continues. Hidden-page playback-time events update refs without scheduling normal UI renders; decorative animation pauses while hidden.

## Audio

With all EQ gains exactly zero, the source goes directly to the existing analyser, skipping the ten disconnected filters. Enabling an EQ band reconnects the filter chain before applying the existing 18 ms gain ramp. Resetting to flat waits 250 ms for the ramp to settle before pinning zero gain and switching to the direct path. Pending bypass is cancelled if settings change again; cleanup cancels the timer and disconnects routing. AudioContext and analyser lifetime are unchanged, avoiding media-source recreation on iOS.

## Network

Presence and playback renewals share a timer scheduler. Their existing 25 s and 5 s renewal intervals are retained, including background playback. Duplicate pending renewals are suppressed; responses for an old track/token cannot update the new session. Visibility-triggered presence updates are deduplicated. No server timeout or playback-right policy changes.

Next-song preloading still uses one audio element. Pausing does not erase its source and downloaded buffer. New preloads start only while playing; changing the target, session URL, or logging out still clears the obsolete source.

## Verification

Run `npm run build` and `node --experimental-strip-types --test tests/*.test.mjs` with Node 24. Tests cover visible/hidden clock behavior, cleanup, EQ identity routing, rapid EQ changes, and shared heartbeat deadlines.

These checks do not measure iPhone power consumption or replace device audio/visual testing. Compare the same track, network and brightness, including karaoke seeking, EQ changes, next-song playback, pause/resume, and lock-screen playback. No quantified battery or temperature improvement is claimed.

## Foreground mobile heat follow-up

Small screens and coarse-pointer devices use an unfiltered radial-gradient background with a slow opacity-only glow. Full-screen blurred moving cover, light-thread SVG, blended texture and depth layers are not drawn there; desktop effects remain available. Mobile skips spectrum reads used only by these effects. Normal line lyrics do not repaint on each clock sample; active word-timed karaoke keeps its original cadence. The clock continues checking line boundaries and seeking at the existing 33 ms interval. Foreground appearance is intentionally softer on mobile; audio, controls and lyric layout are unchanged. True device heat reduction still requires A/B testing.
