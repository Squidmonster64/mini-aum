import { useEffect } from "react";
import { Platform } from "react-native";

export interface KeyboardShortcuts {
  onSpacePress?: () => void;
  onPlayPress?: () => void;
  onStopPress?: () => void;
  onMutePress?: () => void;
  onChannelSelect?: (index: number) => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
}

/**
 * Hook to handle keyboard shortcuts on web/desktop
 * Only works on web platform
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    // Only register on web platform
    if (Platform.OS !== "web") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Space: Play/Pause
      if (event.code === "Space") {
        event.preventDefault();
        shortcuts.onSpacePress?.();
        return;
      }

      // P: Play
      if (event.code === "KeyP" && !event.ctrlKey && !event.metaKey) {
        shortcuts.onPlayPress?.();
        return;
      }

      // S: Stop
      if (event.code === "KeyS" && !event.ctrlKey && !event.metaKey) {
        shortcuts.onStopPress?.();
        return;
      }

      // M: Mute
      if (event.code === "KeyM" && !event.ctrlKey && !event.metaKey) {
        shortcuts.onMutePress?.();
        return;
      }

      // 1-9: Select channel
      if (event.code >= "Digit1" && event.code <= "Digit9") {
        const index = parseInt(event.code[5]) - 1;
        shortcuts.onChannelSelect?.(index);
        return;
      }

      // Arrow Up: Volume Up
      if (event.code === "ArrowUp") {
        event.preventDefault();
        shortcuts.onVolumeUp?.();
        return;
      }

      // Arrow Down: Volume Down
      if (event.code === "ArrowDown") {
        event.preventDefault();
        shortcuts.onVolumeDown?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts]);
}

/**
 * Get keyboard shortcut help text
 */
export const KEYBOARD_HELP = `
Keyboard Shortcuts:
  Space     - Play/Pause
  P         - Play
  S         - Stop
  M         - Mute selected channel
  1-9       - Select channel
  ↑         - Volume Up
  ↓         - Volume Down
`;
