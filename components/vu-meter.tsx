import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface VUMeterProps {
  level: number; // 0-100
  peak: number; // 0-100
  label?: string;
  vertical?: boolean;
}

export function VUMeter({
  level,
  peak,
  label,
  vertical = true,
}: VUMeterProps) {
  const colors = useColors();
  const [displayLevel, setDisplayLevel] = useState(level);

  // Smooth animation of level
  useEffect(() => {
    const diff = level - displayLevel;
    if (Math.abs(diff) > 0.5) {
      const newLevel = displayLevel + diff * 0.1;
      setDisplayLevel(newLevel);
    } else {
      setDisplayLevel(level);
    }
  }, [level]);

  // Determine color based on level
  const getColor = (value: number) => {
    if (value > 90) return "#EF4444"; // Red - clipping
    if (value > 70) return "#F59E0B"; // Orange - warning
    return colors.primary; // Green - normal
  };

  if (vertical) {
    return (
      <View className="items-center gap-1">
        {label && (
          <Text className="text-xs font-semibold text-foreground">{label}</Text>
        )}
        <View
          style={[
            styles.meterContainerVertical,
            { backgroundColor: colors.border },
          ]}
        >
          {/* Level bar */}
          <View
            style={[
              styles.levelBarVertical,
              {
                height: `${displayLevel}%`,
                backgroundColor: getColor(displayLevel),
              },
            ]}
          />

          {/* Peak indicator */}
          {peak > 0 && (
            <View
              style={[
                styles.peakIndicatorVertical,
                {
                  bottom: `${peak}%`,
                  backgroundColor: "#EF4444",
                },
              ]}
            />
          )}
        </View>
        <Text className="text-xs text-muted">{Math.round(displayLevel)}%</Text>
      </View>
    );
  }

  // Horizontal meter
  return (
    <View className="gap-1">
      {label && (
        <Text className="text-xs font-semibold text-foreground">{label}</Text>
      )}
      <View
        style={[
          styles.meterContainerHorizontal,
          { backgroundColor: colors.border },
        ]}
      >
        {/* Level bar */}
        <View
          style={[
            styles.levelBarHorizontal,
            {
              width: `${displayLevel}%`,
              backgroundColor: getColor(displayLevel),
            },
          ]}
        />

        {/* Peak indicator */}
        {peak > 0 && (
          <View
            style={[
              styles.peakIndicatorHorizontal,
              {
                left: `${peak}%`,
                backgroundColor: "#EF4444",
              },
            ]}
          />
        )}
      </View>
      <Text className="text-xs text-muted">{Math.round(displayLevel)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  meterContainerVertical: {
    width: 24,
    height: 100,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
  },
  levelBarVertical: {
    width: "100%",
    borderRadius: 4,
  },
  peakIndicatorVertical: {
    position: "absolute",
    width: "100%",
    height: 2,
  },
  meterContainerHorizontal: {
    width: "100%",
    height: 20,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  levelBarHorizontal: {
    height: "100%",
    borderRadius: 4,
  },
  peakIndicatorHorizontal: {
    position: "absolute",
    width: 2,
    height: "100%",
  },
});
