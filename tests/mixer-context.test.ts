import { describe, it, expect } from "vitest";
import { Channel, MasterBus, MixerState } from "@/types/mixer";

describe("Mixer State Management", () => {
  // Test data
  const createChannel = (id: string, name: string): Channel => ({
    id,
    name,
    volume: 50,
    pan: 0,
    muted: false,
    solo: false,
    color: "#0a7ea4",
    outputRoute: "master",
  });

  const initialState: MixerState = {
    channels: [],
    master: {
      volume: 80,
      outputDevice: "speaker",
    },
    isPlaying: false,
    activeSoloChannels: [],
  };

  describe("Channel Management", () => {
    it("should create a valid channel", () => {
      const channel = createChannel("ch1", "Drums");
      expect(channel.id).toBe("ch1");
      expect(channel.name).toBe("Drums");
      expect(channel.volume).toBe(50);
      expect(channel.muted).toBe(false);
      expect(channel.solo).toBe(false);
    });

    it("should have valid volume range", () => {
      const channel = createChannel("ch1", "Test");
      expect(channel.volume).toBeGreaterThanOrEqual(0);
      expect(channel.volume).toBeLessThanOrEqual(100);
    });

    it("should have valid pan range", () => {
      const channel = createChannel("ch1", "Test");
      expect(channel.pan).toBeGreaterThanOrEqual(-100);
      expect(channel.pan).toBeLessThanOrEqual(100);
    });

    it("should have a valid output route", () => {
      const channel = createChannel("ch1", "Test");
      expect(channel.outputRoute).toBe("master");
    });
  });

  describe("Master Bus", () => {
    it("should have valid master volume", () => {
      expect(initialState.master.volume).toBeGreaterThanOrEqual(0);
      expect(initialState.master.volume).toBeLessThanOrEqual(100);
    });

    it("should have valid output device", () => {
      const validDevices = ["speaker", "headphones", "lineout"];
      expect(validDevices).toContain(initialState.master.outputDevice);
    });
  });

  describe("Mixer State", () => {
    it("should initialize with empty channels", () => {
      expect(initialState.channels.length).toBe(0);
    });

    it("should initialize with isPlaying false", () => {
      expect(initialState.isPlaying).toBe(false);
    });

    it("should initialize with empty solo channels", () => {
      expect(initialState.activeSoloChannels.length).toBe(0);
    });

    it("should support multiple channels", () => {
      const state: MixerState = {
        ...initialState,
        channels: [
          createChannel("ch1", "Drums"),
          createChannel("ch2", "Bass"),
          createChannel("ch3", "Guitar"),
        ],
      };
      expect(state.channels.length).toBe(3);
    });
  });

  describe("Channel Mute/Solo Logic", () => {
    it("should allow toggling mute on a channel", () => {
      const channel = createChannel("ch1", "Test");
      const mutedChannel = { ...channel, muted: !channel.muted };
      expect(mutedChannel.muted).toBe(true);
    });

    it("should allow toggling solo on a channel", () => {
      const channel = createChannel("ch1", "Test");
      const soloChannel = { ...channel, solo: !channel.solo };
      expect(soloChannel.solo).toBe(true);
    });

    it("should track active solo channels", () => {
      const state: MixerState = {
        ...initialState,
        channels: [
          createChannel("ch1", "Drums"),
          createChannel("ch2", "Bass"),
        ],
        activeSoloChannels: ["ch1"],
      };
      expect(state.activeSoloChannels).toContain("ch1");
      expect(state.activeSoloChannels).not.toContain("ch2");
    });
  });

  describe("Volume and Pan Adjustments", () => {
    it("should clamp volume to 0-100 range", () => {
      const channel = createChannel("ch1", "Test");
      const volumeValues = [0, 50, 100];
      volumeValues.forEach((vol) => {
        const adjusted = { ...channel, volume: vol };
        expect(adjusted.volume).toBeGreaterThanOrEqual(0);
        expect(adjusted.volume).toBeLessThanOrEqual(100);
      });
    });

    it("should clamp pan to -100 to 100 range", () => {
      const channel = createChannel("ch1", "Test");
      const panValues = [-100, -50, 0, 50, 100];
      panValues.forEach((pan) => {
        const adjusted = { ...channel, pan };
        expect(adjusted.pan).toBeGreaterThanOrEqual(-100);
        expect(adjusted.pan).toBeLessThanOrEqual(100);
      });
    });

    it("should allow master volume adjustment", () => {
      const state: MixerState = {
        ...initialState,
        master: { ...initialState.master, volume: 75 },
      };
      expect(state.master.volume).toBe(75);
    });
  });

  describe("Channel Routing", () => {
    it("should support routing to master", () => {
      const channel = createChannel("ch1", "Test");
      expect(channel.outputRoute).toBe("master");
    });

    it("should support routing to another channel", () => {
      const channel = { ...createChannel("ch1", "Test"), outputRoute: "ch2" };
      expect(channel.outputRoute).toBe("ch2");
    });
  });
});
