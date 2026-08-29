/**
 * Mixer types and interfaces
 */

export interface SampleReference {
  wondertoadId: string;
  uri: string;
  filename: string;
  bpm?: number | null;
  key?: string | null;
  sampleType?: string | null;
  instrument?: string | null;
  genre?: string | null;
}

export interface Channel {
  id: string;
  name: string;
  volume: number; // 0-100
  pan: number; // -100 to 100
  muted: boolean;
  solo: boolean;
  color: string; // hex color
  outputRoute: string; // "master" or channel id
  sourceType?: "sample" | "file" | "input" | "aux";
  sampleRef?: SampleReference;
  loop?: boolean;
  sync?: boolean;
  playbackRate?: number;
}

export interface MasterBus {
  volume: number; // 0-100
  outputDevice: string; // "speaker" | "headphones" | "lineout"
}

export interface MixerState {
  channels: Channel[];
  master: MasterBus;
  isPlaying: boolean;
  activeSoloChannels: string[];
}

export interface ChannelMeter {
  channelId: string;
  level: number; // 0-100
  peak: number; // 0-100
}

export interface Session {
  id: string;
  name: string;
  timestamp: number;
  state: MixerState;
}
