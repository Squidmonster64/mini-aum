import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import { Channel, MasterBus, MixerState } from "@/types/mixer";

type MixerAction =
  | { type: "ADD_CHANNEL"; payload: Channel }
  | { type: "UPDATE_CHANNEL"; payload: Channel }
  | { type: "DELETE_CHANNEL"; payload: string }
  | { type: "SET_CHANNEL_VOLUME"; payload: { id: string; volume: number } }
  | { type: "SET_CHANNEL_PAN"; payload: { id: string; pan: number } }
  | { type: "TOGGLE_CHANNEL_MUTE"; payload: string }
  | { type: "TOGGLE_CHANNEL_SOLO"; payload: string }
  | { type: "SET_MASTER_VOLUME"; payload: number }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "LOAD_STATE"; payload: MixerState };

const initialState: MixerState = {
  channels: [],
  master: {
    volume: 80,
    outputDevice: "speaker",
  },
  isPlaying: false,
  activeSoloChannels: [],
};

function mixerReducer(state: MixerState, action: MixerAction): MixerState {
  switch (action.type) {
    case "ADD_CHANNEL":
      return {
        ...state,
        channels: [...state.channels, action.payload],
      };

    case "UPDATE_CHANNEL":
      return {
        ...state,
        channels: state.channels.map((ch) =>
          ch.id === action.payload.id ? action.payload : ch
        ),
      };

    case "DELETE_CHANNEL":
      return {
        ...state,
        channels: state.channels.filter((ch) => ch.id !== action.payload),
      };

    case "SET_CHANNEL_VOLUME":
      return {
        ...state,
        channels: state.channels.map((ch) =>
          ch.id === action.payload.id
            ? { ...ch, volume: action.payload.volume }
            : ch
        ),
      };

    case "SET_CHANNEL_PAN":
      return {
        ...state,
        channels: state.channels.map((ch) =>
          ch.id === action.payload.id
            ? { ...ch, pan: action.payload.pan }
            : ch
        ),
      };

    case "TOGGLE_CHANNEL_MUTE":
      return {
        ...state,
        channels: state.channels.map((ch) =>
          ch.id === action.payload ? { ...ch, muted: !ch.muted } : ch
        ),
      };

    case "TOGGLE_CHANNEL_SOLO": {
      const channelId = action.payload;
      const channel = state.channels.find((ch) => ch.id === channelId);
      if (!channel) return state;

      const newSoloState = !channel.solo;
      const newActiveSolo = newSoloState
        ? [...state.activeSoloChannels, channelId]
        : state.activeSoloChannels.filter((id) => id !== channelId);

      return {
        ...state,
        channels: state.channels.map((ch) =>
          ch.id === channelId ? { ...ch, solo: newSoloState } : ch
        ),
        activeSoloChannels: newActiveSolo,
      };
    }

    case "SET_MASTER_VOLUME":
      return {
        ...state,
        master: { ...state.master, volume: action.payload },
      };

    case "SET_PLAYING":
      return {
        ...state,
        isPlaying: action.payload,
      };

    case "LOAD_STATE":
      return action.payload;

    default:
      return state;
  }
}

interface MixerContextType {
  state: MixerState;
  addChannel: (channel: Channel) => void;
  updateChannel: (channel: Channel) => void;
  deleteChannel: (id: string) => void;
  setChannelVolume: (id: string, volume: number) => void;
  setChannelPan: (id: string, pan: number) => void;
  toggleChannelMute: (id: string) => void;
  toggleChannelSolo: (id: string) => void;
  setMasterVolume: (volume: number) => void;
  setPlaying: (playing: boolean) => void;
  loadState: (state: MixerState) => void;
}

const MixerContext = createContext<MixerContextType | undefined>(undefined);

export function MixerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mixerReducer, initialState);

  const addChannel = useCallback((channel: Channel) => {
    dispatch({ type: "ADD_CHANNEL", payload: channel });
  }, []);

  const updateChannel = useCallback((channel: Channel) => {
    dispatch({ type: "UPDATE_CHANNEL", payload: channel });
  }, []);

  const deleteChannel = useCallback((id: string) => {
    dispatch({ type: "DELETE_CHANNEL", payload: id });
  }, []);

  const setChannelVolume = useCallback((id: string, volume: number) => {
    dispatch({ type: "SET_CHANNEL_VOLUME", payload: { id, volume } });
  }, []);

  const setChannelPan = useCallback((id: string, pan: number) => {
    dispatch({ type: "SET_CHANNEL_PAN", payload: { id, pan } });
  }, []);

  const toggleChannelMute = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_CHANNEL_MUTE", payload: id });
  }, []);

  const toggleChannelSolo = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_CHANNEL_SOLO", payload: id });
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    dispatch({ type: "SET_MASTER_VOLUME", payload: volume });
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    dispatch({ type: "SET_PLAYING", payload: playing });
  }, []);

  const loadState = useCallback((newState: MixerState) => {
    dispatch({ type: "LOAD_STATE", payload: newState });
  }, []);

  const value: MixerContextType = {
    state,
    addChannel,
    updateChannel,
    deleteChannel,
    setChannelVolume,
    setChannelPan,
    toggleChannelMute,
    toggleChannelSolo,
    setMasterVolume,
    setPlaying,
    loadState,
  };

  return (
    <MixerContext.Provider value={value}>{children}</MixerContext.Provider>
  );
}

export function useMixer() {
  const context = useContext(MixerContext);
  if (context === undefined) {
    throw new Error("useMixer must be used within a MixerProvider");
  }
  return context;
}
