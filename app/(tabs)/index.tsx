import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ChannelStripEnhanced } from "@/components/channel-strip-enhanced";
import { MasterBus } from "@/components/master-bus";
import { useMixer } from "@/lib/mixer-context";
import { Channel } from "@/types/mixer";
import { useColors } from "@/hooks/use-colors";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { SessionManager } from "@/lib/session-manager";
import { audioEngine } from "@/lib/audio-engine";
import * as Haptics from "expo-haptics";

const generateId = () => Math.random().toString(36).substr(2, 9);

const CHANNEL_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
];

export default function HomeScreen() {
  const colors = useColors();
  const {
    state,
    meters,
    addChannel,
    setChannelVolume,
    setChannelPan,
    toggleChannelMute,
    toggleChannelSolo,
    setMasterVolume,
    setPlaying,
    loadState,
    updateMeters,
  } = useMixer();

  const [selectedChannelIndex, setSelectedChannelIndex] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);

  // Initialize audio engine
  useEffect(() => {
    audioEngine.initialize();
    audioEngine.startMetering();

    // Listen for meter updates
    const handleMetering = (meterData: any[]) => {
      updateMeters(meterData);
    };

    audioEngine.on("metering", handleMetering);

    return () => {
      audioEngine.off("metering", handleMetering);
      audioEngine.stopMetering();
    };
  }, []);

  // Create demo channels on first load
  useEffect(() => {
    if (state.channels.length === 0) {
      const demoChannels: Channel[] = [
        {
          id: generateId(),
          name: "Drums",
          volume: 75,
          pan: 0,
          muted: false,
          solo: false,
          color: CHANNEL_COLORS[0],
          outputRoute: "master",
        },
        {
          id: generateId(),
          name: "Bass",
          volume: 70,
          pan: 0,
          muted: false,
          solo: false,
          color: CHANNEL_COLORS[1],
          outputRoute: "master",
        },
        {
          id: generateId(),
          name: "Guitar",
          volume: 60,
          pan: 0,
          muted: false,
          solo: false,
          color: CHANNEL_COLORS[2],
          outputRoute: "master",
        },
        {
          id: generateId(),
          name: "Vocals",
          volume: 80,
          pan: 0,
          muted: false,
          solo: false,
          color: CHANNEL_COLORS[3],
          outputRoute: "master",
        },
        {
          id: generateId(),
          name: "Keys",
          volume: 65,
          pan: 0,
          muted: false,
          solo: false,
          color: CHANNEL_COLORS[4],
          outputRoute: "master",
        },
        {
          id: generateId(),
          name: "Strings",
          volume: 55,
          pan: 0,
          muted: false,
          solo: false,
          color: CHANNEL_COLORS[5],
          outputRoute: "master",
        },
      ];

      demoChannels.forEach((ch) => addChannel(ch));
    }

    // Load sessions
    loadSessions();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSpacePress: () => {
      setPlaying(!state.isPlaying);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onPlayPress: () => {
      setPlaying(true);
    },
    onStopPress: () => {
      setPlaying(false);
    },
    onChannelSelect: (index) => {
      if (index < state.channels.length) {
        setSelectedChannelIndex(index);
      }
    },
    onVolumeUp: () => {
      if (selectedChannelIndex < state.channels.length) {
        const ch = state.channels[selectedChannelIndex];
        setChannelVolume(ch.id, Math.min(100, ch.volume + 5));
      }
    },
    onVolumeDown: () => {
      if (selectedChannelIndex < state.channels.length) {
        const ch = state.channels[selectedChannelIndex];
        setChannelVolume(ch.id, Math.max(0, ch.volume - 5));
      }
    },
  });

  const loadSessions = async () => {
    const allSessions = await SessionManager.getAllSessions();
    setSessions(allSessions);
  };

  const handleSaveSession = async () => {
    if (!sessionName.trim()) return;

    await SessionManager.saveSession(sessionName, state);
    setSessionName("");
    setShowSaveDialog(false);
    loadSessions();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLoadSession = async (sessionId: string) => {
    const session = await SessionManager.loadSession(sessionId);
    if (session) {
      loadState(session.state);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAddChannel = () => {
    const newChannel: Channel = {
      id: generateId(),
      name: `Channel ${state.channels.length + 1}`,
      volume: 50,
      pan: 0,
      muted: false,
      solo: false,
      color: CHANNEL_COLORS[state.channels.length % CHANNEL_COLORS.length],
      outputRoute: "master",
    };
    addChannel(newChannel);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectedChannel =
    selectedChannelIndex < state.channels.length
      ? state.channels[selectedChannelIndex]
      : null;

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Mini AUM</Text>
          <Text className="text-sm text-muted">Simplified Audio Mixer</Text>
        </View>

        {/* Channels Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Channels
          </Text>
          <FlatList
            data={state.channels}
            renderItem={({ item, index }) => {
              const meter = meters.get(item.id);
              return (
                <Pressable
                  onPress={() => setSelectedChannelIndex(index)}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View className="mr-2 mb-2">
                    <ChannelStripEnhanced
                      channel={item}
                      level={meter?.level || 0}
                      peak={meter?.peak || 0}
                      onVolumeChange={(vol) =>
                        setChannelVolume(item.id, vol)
                      }
                      onPanChange={(pan) => setChannelPan(item.id, pan)}
                      onMuteToggle={() => toggleChannelMute(item.id)}
                      onSoloToggle={() => toggleChannelSolo(item.id)}
                    />
                  </View>
                </Pressable>
              );
            }}
            keyExtractor={(item) => item.id}
            horizontal
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            ListFooterComponent={
              <Pressable
                onPress={handleAddChannel}
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-2xl font-bold text-background">+</Text>
              </Pressable>
            }
          />
        </View>

        {/* Master Bus */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Master
          </Text>
          <MasterBus
            master={state.master}
            isPlaying={state.isPlaying}
            onVolumeChange={(vol) => setMasterVolume(vol)}
            onPlayToggle={() => setPlaying(!state.isPlaying)}
          />
        </View>

        {/* Session Controls */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Sessions
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShowSaveDialog(true)}
              style={({ pressed }) => [
                styles.sessionButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-sm font-semibold text-background">
                Save
              </Text>
            </Pressable>

            {sessions.length > 0 && (
              <Pressable
                onPress={() => handleLoadSession(sessions[0].id)}
                style={({ pressed }) => [
                  styles.sessionButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-sm font-semibold text-foreground">
                  Load
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tips */}
        <View
          className="p-4 rounded-lg"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold text-foreground mb-2">
            Tips
          </Text>
          <Text className="text-xs text-muted leading-relaxed">
            • Tap channels to select and adjust with keyboard (↑/↓ for volume)
            {"\n"}• Use M/S buttons for mute/solo control{"\n"}• Space bar to
            play/pause{"\n"}• Save/load sessions to persist your mix
          </Text>
        </View>
      </ScrollView>

      {/* Save Session Modal */}
      <Modal
        visible={showSaveDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Text className="text-lg font-bold text-foreground mb-4">
              Save Session
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Session name"
              placeholderTextColor={colors.muted}
              value={sessionName}
              onChangeText={setSessionName}
            />
            <View className="flex-row gap-2 mt-4">
              <Pressable
                onPress={() => setShowSaveDialog(false)}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-sm font-semibold text-foreground">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveSession}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-sm font-semibold text-background">
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 70,
    height: 180,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sessionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 300,
    borderRadius: 12,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
