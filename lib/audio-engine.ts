import * as Audio from "expo-audio";

export interface AudioTrack {
  id: string;
  uri: string;
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  volume: number;
}

export interface MeterData {
  channelId: string;
  level: number; // 0-100
  peak: number; // 0-100
}

type EventListener = (...args: any[]) => void;

class AudioEngine {
  private listeners: Map<string, EventListener[]> = new Map();
  private tracks: Map<string, AudioTrack> = new Map();
  private masterVolume: number = 0.8;
  private isInitialized: boolean = false;
  private meterInterval: ReturnType<typeof setInterval> | null = null;

  async initialize() {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentMode: true,
      });
      this.isInitialized = true;
      console.log("✓ Audio engine initialized");
    } catch (error) {
      console.error("Failed to initialize audio engine:", error);
    }
  }

  createTrack(channelId: string, uri: string): AudioTrack {
    const track: AudioTrack = {
      id: channelId,
      uri,
      isPlaying: false,
      currentPosition: 0,
      duration: 0,
      volume: 0.8,
    };

    this.tracks.set(channelId, track);
    return track;
  }

  playTrack(channelId: string) {
    const track = this.tracks.get(channelId);
    if (!track) return;

    track.isPlaying = true;
    this.emit("trackPlaying", channelId);
  }

  pauseTrack(channelId: string) {
    const track = this.tracks.get(channelId);
    if (!track) return;

    track.isPlaying = false;
    this.emit("trackPaused", channelId);
  }

  stopTrack(channelId: string) {
    const track = this.tracks.get(channelId);
    if (!track) return;

    track.isPlaying = false;
    track.currentPosition = 0;
    this.emit("trackStopped", channelId);
  }

  setChannelVolume(channelId: string, volume: number) {
    const track = this.tracks.get(channelId);
    if (!track) return;

    // Clamp volume to 0-1 range
    track.volume = Math.max(0, Math.min(1, volume / 100));
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume / 100));
  }

  getChannelLevel(channelId: string): MeterData {
    const track = this.tracks.get(channelId);

    if (!track) {
      return { channelId, level: 0, peak: 0 };
    }

    // Simulate level meter based on playback state and volume
    const level = track.isPlaying ? track.volume * 100 * Math.random() : 0;
    const peak = level > 80 ? level : 0;

    return { channelId, level, peak };
  }

  startMetering() {
    if (this.meterInterval) return;

    this.meterInterval = setInterval(() => {
      const meters: MeterData[] = [];
      this.tracks.forEach((_, channelId) => {
        meters.push(this.getChannelLevel(channelId));
      });
      if (meters.length > 0) {
        this.emit("metering", meters);
      }
    }, 50); // Update every 50ms for smooth animation
  }

  stopMetering() {
    if (this.meterInterval) {
      clearInterval(this.meterInterval);
      this.meterInterval = null;
    }
  }

  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) return;
    const listeners = this.listeners.get(event)!;
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(event: string, ...args: any[]) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach((listener) => {
      listener(...args);
    });
  }

  async cleanup() {
    this.stopMetering();
    this.tracks.clear();
    this.listeners.clear();
  }
}

export const audioEngine = new AudioEngine();
