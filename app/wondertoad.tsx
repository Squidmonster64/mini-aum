import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useMixer } from "@/lib/mixer-context";
import { resolveWondertoadHandoff } from "@/lib/wondertoad-handoff";
import type { WondertoadHandoff, WondertoadSample } from "@/types/wondertoad";

const clampRate = (value: number) => Math.max(0.5, Math.min(2, value));
const id = () => Math.random().toString(36).slice(2, 11);

export default function WondertoadAuditionScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const colors = useColors();
  const { addChannel } = useMixer();
  const player = useAudioPlayer(null, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);

  const [handoff, setHandoff] = useState<WondertoadHandoff | null>(null);
  const [index, setIndex] = useState(0);
  const [sync, setSync] = useState(true);
  const [loop, setLoop] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setError("Missing Wondertoad handoff token");
      return;
    }
    setError(null);
    resolveWondertoadHandoff(token)
      .then((value) => {
        if (cancelled) return;
        setHandoff(value);
        setIndex(Math.max(0, Math.min(value.candidates.length - 1, value.activeIndex ?? 0)));
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const sample = handoff?.candidates[index] ?? null;
  const contextBpm = handoff?.context?.bpm ?? null;
  const rate = useMemo(() => {
    if (!sync || !sample?.bpm || !contextBpm) return 1;
    return clampRate(contextBpm / sample.bpm);
  }, [sync, sample?.bpm, contextBpm]);

  useEffect(() => {
    if (!sample) return;
    player.replace({ uri: sample.streamUrl });
    player.loop = loop;
    player.setPlaybackRate(rate);
    player.play();
  }, [sample?.id, loop, rate]);

  const togglePlay = () => {
    status.playing ? player.pause() : player.play();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const move = (delta: number) => {
    if (!handoff) return;
    setIndex((current) => (current + delta + handoff.candidates.length) % handoff.candidates.length);
  };

  const keep = (chosen: WondertoadSample) => {
    addChannel({
      id: id(),
      name: chosen.name,
      volume: 75,
      pan: 0,
      muted: false,
      solo: false,
      color: "#B7F34A",
      outputRoute: "master",
      sourceType: "sample",
      sampleRef: {
        wondertoadId: chosen.id,
        uri: chosen.streamUrl,
        filename: chosen.name,
        bpm: chosen.bpm ?? null,
        key: chosen.key ?? null,
        sampleType: chosen.sampleType ?? null,
        instrument: chosen.instrument ?? null,
        genre: chosen.genre ?? null,
      },
      loop,
      sync,
      playbackRate: rate,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  if (error) {
    return (
      <ScreenContainer className="p-5">
        <View style={styles.center}>
          <Text style={[styles.kicker, { color: colors.error }]}>WONDERTOAD HANDOFF</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Could not open sample</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!sample || !handoff) {
    return (
      <ScreenContainer className="p-5">
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={[styles.body, { color: colors.muted }]}>Loading Wondertoad handoff…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-5">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: "#7DD3FC" }]}>MINI AUM</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Does it work here?</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.muted }]}>CONTEXT</Text>
          <Text style={[styles.contextName, { color: colors.foreground }]}>{handoff.context?.name || "Current sketch"}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            {contextBpm ? `${contextBpm} BPM` : "Tempo free"}{handoff.context?.key ? ` · ${handoff.context.key}` : ""}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: "#B7F34A" }]}>AUDITION</Text>
          <Text style={[styles.sampleName, { color: colors.foreground }]}>{sample.name}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            {[sample.bpm ? `${sample.bpm} BPM` : null, sample.key, sample.instrument || sample.sampleType].filter(Boolean).join(" · ")}
          </Text>

          <View style={styles.transportRow}>
            <Action label={status.playing ? "PAUSE" : "PLAY"} active onPress={togglePlay} />
            <Action label="LOOP" active={loop} onPress={() => setLoop((v) => !v)} />
            <Action label="SYNC" active={sync} onPress={() => setSync((v) => !v)} />
          </View>

          <Text style={[styles.body, { color: colors.muted }]}>Playback rate {rate.toFixed(3)}×</Text>

          <View style={styles.transportRow}>
            <Action label="← PREV" onPress={() => move(-1)} />
            <Action label="NEXT →" onPress={() => move(1)} />
          </View>

          <Pressable onPress={() => keep(sample)} style={({ pressed }) => [styles.keep, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.keepText}>KEEP IN SESSION</Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.muted }]}>Wondertoad candidate {index + 1} of {handoff.candidates.length}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function Action({ label, onPress, active = false }: { label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, active && styles.actionActive, { opacity: pressed ? 0.75 : 1 }]}>
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 24 },
  center: { flex: 1, justifyContent: "center", gap: 10 },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { fontSize: 30, fontWeight: "800" },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  contextName: { fontSize: 18, fontWeight: "700" },
  sampleName: { fontSize: 20, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 20 },
  transportRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  action: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: "#232831" },
  actionActive: { backgroundColor: "#B7F34A" },
  actionText: { color: "#F2F4F7", fontWeight: "800", fontSize: 12 },
  actionTextActive: { color: "#111318" },
  keep: { backgroundColor: "#B7F34A", borderRadius: 13, alignItems: "center", paddingVertical: 14, marginTop: 4 },
  keepText: { color: "#111318", fontSize: 13, fontWeight: "900" },
  footer: { textAlign: "center", fontSize: 12 },
});
