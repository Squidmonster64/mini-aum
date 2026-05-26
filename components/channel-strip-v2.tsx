import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { Channel } from "@/types/mixer";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

interface ChannelStripV2Props {
  channel: Channel;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onPress?: () => void;
}

export function ChannelStripV2({
  channel,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onPress,
}: ChannelStripV2Props) {
  const colors = useColors();
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isDraggingPan, setIsDraggingPan] = useState(false);

  // Volume fader height calculation (0-100 maps to 0-120px)
  const volumeHeight = (channel.volume / 100) * 120;

  // Pan position calculation (-100 to 100 maps to 0-40px)
  const panPosition = ((channel.pan + 100) / 200) * 40;

  const handleVolumePress = (event: GestureResponderEvent) => {
    const { locationY } = event.nativeEvent;
    // Calculate volume from touch position (inverted: top = 100, bottom = 0)
    const newVolume = Math.max(0, Math.min(100, 100 - (locationY / 120) * 100));
    onVolumeChange(newVolume);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePanPress = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    // Calculate pan from touch position (-100 to 100)
    const newPan = Math.max(-100, Math.min(100, (locationX / 40) * 200 - 100));
    onPanChange(newPan);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMutePress = () => {
    onMuteToggle();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSoloPress = () => {
    onSoloToggle();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const isActive = !channel.muted && channel.volume > 0;
  const isSolo = channel.solo;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          borderColor: channel.color,
          backgroundColor: channel.muted
            ? colors.surface
            : isActive
              ? colors.background
              : colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Channel Header */}
      <View className="items-center justify-center mb-2">
        <Text
          className="text-xs font-semibold text-foreground text-center"
          numberOfLines={1}
        >
          {channel.name}
        </Text>
      </View>

      {/* Volume Fader */}
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
              backgroundColor: isSolo
                ? "#FFD700"
                : isActive
                  ? colors.primary
                  : colors.muted,
            },
          ]}
        />
      </Pressable>

      {/* Volume Label */}
      <Text className="text-xs text-muted text-center mt-1">
        {Math.round(channel.volume)}%
      </Text>

      {/* Pan Control */}
      <Pressable
        onPress={handlePanPress}
        style={[
          styles.panContainer,
          { backgroundColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.panKnob,
            {
              left: panPosition,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </Pressable>

      {/* Pan Label */}
      <Text className="text-xs text-muted text-center mt-1">
        {channel.pan > 5 ? "R" : channel.pan < -5 ? "L" : "C"}
      </Text>

      {/* Control Buttons */}
      <View className="flex-row gap-2 mt-3">
        <Pressable
          onPress={handleMutePress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: channel.muted ? colors.error : colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            className={cn(
              "text-xs font-semibold",
              channel.muted ? "text-background" : "text-foreground"
            )}
          >
            M
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSoloPress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: isSolo ? "#FFD700" : colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            className={cn(
              "text-xs font-semibold",
              isSolo ? "text-background" : "text-foreground"
            )}
          >
            S
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  faderContainer: {
    width: 32,
    height: 120,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  faderTrack: {
    width: "100%",
    borderRadius: 4,
  },
  panContainer: {
    width: 40,
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
    position: "relative",
  },
  panKnob: {
    width: 8,
    height: 16,
    borderRadius: 4,
    position: "absolute",
    top: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
