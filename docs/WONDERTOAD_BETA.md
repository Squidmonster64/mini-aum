# Wondertoad → Mini AUM beta contract

## Goal

Wondertoad owns sample search, metadata and protected file delivery. Mini AUM owns in-context audition and session keep.

## Deep link

Wondertoad opens:

```text
miniaum://wondertoad?token=<one-time-handoff-token>
```

The token must be short-lived and must not contain Dropbox credentials, Dropbox URLs, the Wondertoad app passphrase, or the admin sync token.

## Resolve handoff

Mini AUM calls:

```http
GET {EXPO_PUBLIC_WONDERTOAD_URL}/api/handoff/<token>
Accept: application/json
```

Expected response:

```json
{
  "token": "opaque-token",
  "expiresAt": "2026-08-29T00:10:00Z",
  "activeIndex": 0,
  "context": {
    "name": "Sketch 08",
    "bpm": 126,
    "key": "Am"
  },
  "candidates": [
    {
      "id": "sample-123",
      "name": "WT_Kick_482.wav",
      "streamUrl": "https://<wondertoad>/api/handoff/<token>/file/sample-123",
      "bpm": 124,
      "key": "C",
      "sampleType": "one-shot",
      "instrument": "kick",
      "genre": "house"
    }
  ]
}
```

`streamUrl` must be a Wondertoad-controlled short-lived endpoint. Do not expose Dropbox refresh tokens or long-lived Dropbox links to Mini AUM.

## Mini AUM behaviour

- Automatically loads and plays the active candidate.
- LOOP is on by default.
- SYNC is on by default when both sample BPM and context BPM exist.
- Sync rate is `contextBpm / sampleBpm`, clamped to 0.5–2.0.
- PREV/NEXT changes candidates while preserving loop/sync state.
- KEEP IN SESSION creates a normal mixer channel containing Wondertoad provenance and playback settings.

## Configuration

Set the public Wondertoad origin at build time:

```text
EXPO_PUBLIC_WONDERTOAD_URL=https://<wondertoad-host>
```

This value is an origin, not a secret.

## Smoke test

1. Open a valid `miniaum://wondertoad?token=...` link on iOS.
2. Confirm the handoff resolves without exposing credentials in the URL.
3. Confirm the candidate starts playing.
4. Toggle LOOP and SYNC.
5. PREV/NEXT through at least three candidates.
6. Tap KEEP IN SESSION.
7. Confirm the app returns to the mixer and the kept sample is present as a channel.
8. Save and reload the session; confirm the Wondertoad sample reference remains attached.
