# Wondertoad → Mini AUM beta contract

## Goal

Wondertoad owns sample search, metadata and protected file delivery. Mini AUM owns in-context audition and session keep.

## Implementation state

The Mini AUM client implementation lives on this beta branch. The matching Wondertoad handoff implementation is in the canonical Dropbox Worker source at `PWA/src/secure-worker.js`. It deliberately does not duplicate the Wondertoad Worker into this repository.

The Mini AUM beta branch is deployed separately from production for smoke testing at `https://mini-aum-beta-production.up.railway.app`. End-to-end testing is gated on the Wondertoad Cloudflare Worker bootstrap completing and `EXPO_PUBLIC_WONDERTOAD_URL` being set to that Worker origin.

This document is the frozen beta interface contract; implementation changes must preserve it until the smoke pass is complete.

## Deep link

Wondertoad opens:

```text
miniaum://wondertoad?token=<handoff-token>
```

The token is a short-lived handoff lease. The beta Worker encrypts its candidate IDs, context and expiry using an AES-GCM key derived from the existing Wondertoad admin secret; the token itself contains no readable Dropbox credentials, Dropbox URLs, Wondertoad passphrase or admin sync token. The lease lasts 10 minutes and may be reused during that window for resolve plus audio range/file requests, then expires. Each candidate file endpoint also checks that the requested sample ID is present in the encrypted lease.

## Create handoff

The authenticated Wondertoad UI creates a handoff for the selected sample:

```http
POST /api/samples/<sample-id>/handoff
Content-Type: application/json
```

Optional body:

```json
{
  "candidateIds": [123, 456, 789],
  "activeIndex": 0,
  "context": {
    "name": "Sketch 08",
    "bpm": 126,
    "key": "Am"
  }
}
```

When `candidateIds` is omitted, Wondertoad builds a candidate queue from instrument/category/type/genre and BPM proximity, then fills from the searchable Dropbox-backed catalogue when needed. The beta cap is 12 candidates.

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

`streamUrl` is a Wondertoad-controlled endpoint protected by the same short-lived handoff lease. It delegates to the existing Dropbox streaming layer and supports the underlying range requests without exposing Dropbox refresh tokens or long-lived Dropbox links to Mini AUM.

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

1. From authenticated Wondertoad, create a handoff and obtain its `miniaum://wondertoad?token=...` deep link.
2. Open that deep link on iOS.
3. Confirm the handoff resolves without exposing credentials in the URL or payload.
4. Confirm the active candidate starts playing.
5. Toggle LOOP and SYNC.
6. PREV/NEXT through at least three candidates.
7. Tap KEEP IN SESSION.
8. Confirm the app returns to the mixer and the kept sample is present as a channel.
9. Save and reload the session; confirm the Wondertoad sample reference remains attached.
10. Confirm an expired/tampered handoff token is rejected and a candidate not present in the lease cannot be streamed.
