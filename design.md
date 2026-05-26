# Mini AUM - Design Document

## Overview
A simplified audio mixer and routing app for iOS, inspired by AUM. Provides an intuitive interface for managing multiple audio channels with volume, pan, and routing controls.

## Screen List

1. **Mixer Home** — Main mixing interface with channel strips
2. **Channel Detail** — Individual channel settings and routing
3. **Master Bus** — Master volume, output routing, and session controls
4. **Settings** — App preferences and audio configuration

## Primary Content and Functionality

### Mixer Home Screen
- **Vertical Channel Strips** (portrait orientation, one-handed usage)
  - Each strip displays: Channel name, volume fader, pan knob, mute/solo buttons
  - Tap to expand channel detail view
  - Long-press to reorder or delete channels
- **Master Bus Section** at the bottom
  - Master volume fader
  - Output meter (visual VU meter)
  - Transport controls (play/pause, stop)
- **Add Channel Button** (floating action button or bottom sheet)
  - Quick channel creation with preset types (instrument, effect, aux)

### Channel Detail Screen
- Channel name editor
- Volume fader (0-100 dB range)
- Pan control (-100 to +100)
- Mute / Solo / Record buttons
- Input/Output routing selector
- Channel color picker (for visual organization)
- Delete channel option

### Master Bus Screen
- Master volume control
- Output routing (speaker, headphones, line out)
- Master metering (stereo VU meters)
- Session save/load controls
- Audio input/output device selector

### Settings Screen
- Audio device selection (input/output)
- Theme preference (light/dark)
- Audio buffer size and sample rate
- Haptic feedback toggle
- About and version info

## Key User Flows

### Flow 1: Create and Mix Multiple Channels
1. User taps "Add Channel" button
2. Selects channel type (instrument, effect, aux)
3. Channel appears in the mixer with default settings
4. User adjusts volume fader for each channel
5. User adjusts pan for stereo positioning
6. User taps mute/solo as needed
7. Master volume controls overall output

### Flow 2: Route Audio Between Channels
1. User taps on a channel to open detail view
2. Taps "Output Routing" section
3. Selects destination (master bus, another channel, or aux)
4. Routing is applied and visible in the mixer view

### Flow 3: Save and Load Session
1. User creates a mixing session with multiple channels
2. Taps "Save Session" in master bus view
3. Enters session name
4. Later, user taps "Load Session" and selects from saved list
5. All channel settings and routing are restored

## Color Choices

- **Primary Brand Color**: `#0a7ea4` (teal/cyan) — Modern, audio-focused
- **Background**: `#ffffff` (light) / `#151718` (dark)
- **Surface**: `#f5f5f5` (light) / `#1e2022` (dark)
- **Accent (Channel Active)**: `#22C55E` (green) — Visual feedback for active channels
- **Warning (Clipping)**: `#EF4444` (red) — Indicates audio clipping
- **Muted Channel**: `#687076` (muted gray) — Indicates muted state

## Interaction Patterns

- **Faders**: Vertical drag for volume/pan adjustments
- **Buttons**: Tap for toggle (mute/solo)
- **Knobs**: Circular drag or tap-to-edit for precise values
- **Haptic Feedback**: Light haptic on fader release, medium on button toggle
- **Animations**: Smooth fader movements, subtle meter animations

## Technical Considerations

- Use React Native Reanimated for smooth fader animations
- Implement audio engine with Expo Audio for playback and metering
- Store session data in AsyncStorage (local persistence)
- Use Context API for global mixer state management
- Responsive layout for both portrait and landscape (if supported)
