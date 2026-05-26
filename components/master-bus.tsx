import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { MasterBus as MasterBusType } from "@/types/mixer";
import * as Haptics from "expo-haptics";

interface MasterBusProps {
  master: MasterBusType;
  isPlaying: boolean;
  onVolumeChange: (volume: number) => void;
  onPlayToggle: () => void;
}

export function MasterBus({
  master,
  isPlaying,
  onVolumeChange,
  onPlayToggle,
}: MasterBusProps) {
  const colors = useColors();

  const volumeHeight = (master.volume / 100) * 120;

  const handleVolumePress = (event: any) => {
    const { locationY } = event.nativeEvent;
    const newVolume = Math.max(0, Math.min(100, 100 - (locationY / 120) * 100));
    onVolumeChange(newVolume);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePlayToggle = () => {
    onPlayToggle();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View
      className="bg-surface rounded-lg p-4 border border-border"
      style={{ borderColor: colors.border }}
    >
      {/* Master Label */}
      <Text className="text-sm font-bold text-foreground mb-3">Master</Text>

      {/* Master Volume Fader */}
      <View className="flex-row items-end gap-3">
        <Pressable
          onPress={handleVolumePress}
          style={[
            styles.faderContainer,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.faderTrack,
              {
                height: volumeHeight,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </Pressable>

        {/* Volume Label */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            {Math.round(master.volume)}%
          </Text>
          <Text className="text-xs text-muted">Volume</Text>
        </View>
      </View>

      {/* Transport Controls */}
      <View className="flex-row gap-2 mt-4">
        <Pressable
          onPress={handlePlayToggle}
          style={({ pressed }) => [
            styles.transportButton,
            {
              backgroundColor: isPlaying ? colors.success : colors.primary,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text className="text-sm font-bold text-background">
            {isPlaying ? "⏸" : "▶"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.transportButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text className="text-sm font-bold text-foreground">⏹</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  faderContainer: {
    width: 40,
    height: 120,
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  faderTrack: {
    width: "100%",
    borderRadius: 6,
  },
  transportButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
