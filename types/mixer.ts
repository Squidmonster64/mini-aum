/**
 * Mixer types and interfaces
 */

export interface Channel {
  id: string;
  name: string;
  volume: number; // 0-100
  pan: number; // -100 to 100
  muted: boolean;
  solo: boolean;
  color: string; // hex color
  outputRoute: string; // "master" or channel id
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
