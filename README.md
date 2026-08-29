# Mini AUM

Mini AUM is a compact audio/MIDI context player and mixer. The active beta work is on `beta/wondertoad-context-audition`.

## Beta 2 — real studio

The deployed web beta no longer uses the original decorative demo mixer. `public/mixer.html` is a responsive studio shell and `public/studio.js` provides the functional audio/MIDI runtime.

### Audio

- Explicit source shown on every channel; empty means empty.
- Local audio files can be loaded or replaced per channel.
- Mixer graph and transport use Tone.js 15.1.22 (MIT).
- Per-channel gain, pan, mute, solo and loop controls affect real audio nodes.
- Master gain and transport are functional.

### MIDI

- `.mid` / `.midi` import uses `@tonejs/midi` 2.0.28 (MIT).
- Imported note tracks become playable channels using Tone.js `PolySynth` + `Part`.
- The built-in piano-roll view exposes actual imported notes.
- Note selection, transpose, velocity, add and delete are available in the beta editor.

### Wondertoad

Mini AUM accepts a short-lived Wondertoad handoff token as `?token=...` and resolves it through same-origin server routes:

- `GET /api/wondertoad/handoff/:token`
- `GET /api/wondertoad/handoff/:token/file/:sampleKey`

The server proxies the already-secured Wondertoad Worker lease and forwards audio byte ranges. Dropbox credentials are never exposed to Mini AUM or the browser.

### Design

The Beta 2 desktop/mobile studio design is in the project Figma file on page `Beta 2 — Real Studio`.

### Verification

`tests/web-studio.contract.test.ts` prevents regression to the decorative mixer and checks browser asset syntax, source loading controls, Tone/MIDI foundations, MIDI-editor wiring, Wondertoad proxy range support, and service-worker cache behaviour.

Production `main` remains unchanged until the beta smoke test passes.
