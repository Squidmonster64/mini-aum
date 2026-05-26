import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SessionManager } from "../lib/session-manager";
import { MixerState } from "../types/mixer";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("SessionManager", () => {
  const mockState: MixerState = {
    channels: [
      {
        id: "ch1",
        name: "Drums",
        volume: 75,
        pan: 0,
        muted: false,
        solo: false,
        color: "#FF6B6B",
        outputRoute: "master",
      },
    ],
    master: {
      volume: 80,
      outputDevice: "speaker",
    },
    isPlaying: false,
    activeSoloChannels: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveSession", () => {
    it("should save a session with name and state", async () => {
      const mockSetItem = vi.spyOn(AsyncStorage, "setItem");
      mockSetItem.mockResolvedValue(undefined);
      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue("[]");

      const session = await SessionManager.saveSession("My Mix", mockState);

      expect(session.name).toBe("My Mix");
      expect(session.state).toEqual(mockState);
      expect(session.id).toBeDefined();
      expect(session.timestamp).toBeDefined();
      expect(mockSetItem).toHaveBeenCalled();
    });

    it("should generate unique session IDs", async () => {
      const mockSetItem = vi.spyOn(AsyncStorage, "setItem");
      mockSetItem.mockResolvedValue(undefined);
      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue("[]");

      const session1 = await SessionManager.saveSession("Mix 1", mockState);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session2 = await SessionManager.saveSession("Mix 2", mockState);

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe("getAllSessions", () => {
    it("should return empty array if no sessions exist", async () => {
      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue(null);

      const sessions = await SessionManager.getAllSessions();

      expect(sessions).toEqual([]);
    });

    it("should parse and return stored sessions", async () => {
      const mockSessions = [
        {
          id: "session-1",
          name: "Mix 1",
          timestamp: Date.now(),
          state: mockState,
        },
      ];

      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue(
        JSON.stringify(mockSessions)
      );

      const sessions = await SessionManager.getAllSessions();

      expect(sessions).toEqual(mockSessions);
      expect(sessions.length).toBe(1);
    });
  });

  describe("loadSession", () => {
    it("should load a session by ID", async () => {
      const mockSessions = [
        {
          id: "session-1",
          name: "Mix 1",
          timestamp: Date.now(),
          state: mockState,
        },
      ];

      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue(
        JSON.stringify(mockSessions)
      );
      const mockSetItem = vi.spyOn(AsyncStorage, "setItem");
      mockSetItem.mockResolvedValue(undefined);

      const session = await SessionManager.loadSession("session-1");

      expect(session).toBeDefined();
      expect(session?.id).toBe("session-1");
      expect(session?.state).toEqual(mockState);
    });

    it("should return null if session not found", async () => {
      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue("[]");

      const session = await SessionManager.loadSession("nonexistent");

      expect(session).toBeNull();
    });
  });

  describe("deleteSession", () => {
    it("should delete a session by ID", async () => {
      const mockSessions = [
        {
          id: "session-1",
          name: "Mix 1",
          timestamp: Date.now(),
          state: mockState,
        },
        {
          id: "session-2",
          name: "Mix 2",
          timestamp: Date.now(),
          state: mockState,
        },
      ];

      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue(
        JSON.stringify(mockSessions)
      );
      const mockSetItem = vi.spyOn(AsyncStorage, "setItem");
      mockSetItem.mockResolvedValue(undefined);

      const result = await SessionManager.deleteSession("session-1");

      expect(result).toBe(true);
      expect(mockSetItem).toHaveBeenCalled();
    });
  });

  describe("updateSession", () => {
    it("should update an existing session", async () => {
      const mockSessions = [
        {
          id: "session-1",
          name: "Mix 1",
          timestamp: 1000,
          state: mockState,
        },
      ];

      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue(
        JSON.stringify(mockSessions)
      );
      const mockSetItem = vi.spyOn(AsyncStorage, "setItem");
      mockSetItem.mockResolvedValue(undefined);

      const updatedState = { ...mockState, isPlaying: true };
      const session = await SessionManager.updateSession(
        "session-1",
        updatedState
      );

      expect(session).toBeDefined();
      expect(session?.state.isPlaying).toBe(true);
      expect(session?.timestamp).toBeGreaterThan(1000);
    });

    it("should return null if session not found", async () => {
      vi.spyOn(AsyncStorage, "getItem").mockResolvedValue("[]");

      const session = await SessionManager.updateSession(
        "nonexistent",
        mockState
      );

      expect(session).toBeNull();
    });
  });

  describe("clearAllSessions", () => {
    it("should clear all sessions", async () => {
      const mockRemoveItem = vi.spyOn(AsyncStorage, "removeItem");
      mockRemoveItem.mockResolvedValue(undefined);

      const result = await SessionManager.clearAllSessions();

      expect(result).toBe(true);
      expect(mockRemoveItem).toHaveBeenCalledWith("mini-aum-sessions");
      expect(mockRemoveItem).toHaveBeenCalledWith("mini-aum-current-session");
    });
  });
});
