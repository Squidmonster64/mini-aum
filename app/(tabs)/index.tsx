import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ChannelStripV2 } from "@/components/channel-strip-v2";
import { MasterBus } from "@/components/master-bus";
import { useMixer } from "@/lib/mixer-context";
import { Channel } from "@/types/mixer";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
// Simple ID generator to avoid uuid dependency
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
    addChannel,
    setChannelVolume,
    setChannelPan,
    toggleChannelMute,
    toggleChannelSolo,
    setMasterVolume,
    setPlaying,
  } = useMixer();

  // Create demo channels on first load
  useEffect(() => {
    if (state.channels.length === 0) {
      // Add 4 demo channels
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
          pan: -10,
          muted: false,
          solo: false,
          color: CHANNEL_COLORS[1],
          outputRoute: "master",
        },
        {
          id: generateId(),
          name: "Guitar",
          volume: 60,
          pan: 20,
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
      ];

      demoChannels.forEach((ch) => addChannel(ch));
    }
  }, []);

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

  const handlePlayToggle = () => {
    setPlaying(!state.isPlaying);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground">Mini AUM</Text>
            <Text className="text-sm text-muted mt-1">
              Simplified Audio Mixer
            </Text>
          </View>

          {/* Mixer Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Channels
            </Text>

            {/* Channel Strips Container */}
            <View className="flex-row gap-2 pb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {state.channels.map((channel) => (
                  <ChannelStripV2
                    key={channel.id}
                    channel={channel}
                    onVolumeChange={(volume) =>
                      setChannelVolume(channel.id, volume)
                    }
                    onPanChange={(pan) => setChannelPan(channel.id, pan)}
                    onMuteToggle={() => toggleChannelMute(channel.id)}
                    onSoloToggle={() => toggleChannelSolo(channel.id)}
                  />
                ))}

                {/* Add Channel Button */}
                <Pressable
                  onPress={handleAddChannel}
                  style={[
                    styles.addChannelButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Text className="text-2xl text-foreground">+</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>

          {/* Master Bus Section */}
          <View className="mb-6">
            <MasterBus
              master={state.master}
              isPlaying={state.isPlaying}
              onVolumeChange={setMasterVolume}
              onPlayToggle={handlePlayToggle}
            />
          </View>

          {/* Info Section */}
          <View
            className="bg-surface rounded-lg p-4 border border-border"
            style={{ borderColor: colors.border }}
          >
            <Text className="text-xs font-semibold text-foreground mb-2">
              Tips
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              • Tap channel strips to adjust volume and pan{"\n"}
              • Use M (Mute) and S (Solo) buttons for channel control{"\n"}
              • Adjust master volume with the fader on the right{"\n"}
              • Tap + to add new channels
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addChannelButton: {
    width: 60,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
