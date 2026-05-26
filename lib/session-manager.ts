import AsyncStorage from "@react-native-async-storage/async-storage";
import { MixerState, Session } from "@/types/mixer";

const SESSIONS_KEY = "mini-aum-sessions";
const CURRENT_SESSION_KEY = "mini-aum-current-session";

export class SessionManager {
  /**
   * Save a mixer state as a named session
   */
  static async saveSession(name: string, state: MixerState): Promise<Session> {
    try {
      const sessions = await this.getAllSessions();
      const session: Session = {
        id: `session-${Date.now()}`,
        name,
        timestamp: Date.now(),
        state,
      };

      sessions.push(session);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      return session;
    } catch (error) {
      console.error("Failed to save session:", error);
      throw error;
    }
  }

  /**
   * Load a session by ID
   */
  static async loadSession(sessionId: string): Promise<Session | null> {
    try {
      const sessions = await this.getAllSessions();
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        await AsyncStorage.setItem(CURRENT_SESSION_KEY, sessionId);
      }
      return session || null;
    } catch (error) {
      console.error("Failed to load session:", error);
      return null;
    }
  }

  /**
   * Get all saved sessions
   */
  static async getAllSessions(): Promise<Session[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get sessions:", error);
      return [];
    }
  }

  /**
   * Delete a session by ID
   */
  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sessions = await this.getAllSessions();
      const filtered = sessions.filter((s) => s.id !== sessionId);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Failed to delete session:", error);
      return false;
    }
  }

  /**
   * Update an existing session
   */
  static async updateSession(
    sessionId: string,
    state: MixerState
  ): Promise<Session | null> {
    try {
      const sessions = await this.getAllSessions();
      const index = sessions.findIndex((s) => s.id === sessionId);

      if (index === -1) return null;

      sessions[index].state = state;
      sessions[index].timestamp = Date.now();

      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      return sessions[index];
    } catch (error) {
      console.error("Failed to update session:", error);
      return null;
    }
  }

  /**
   * Get the current session ID
   */
  static async getCurrentSessionId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    } catch (error) {
      console.error("Failed to get current session ID:", error);
      return null;
    }
  }

  /**
   * Clear all sessions
   */
  static async clearAllSessions(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(SESSIONS_KEY);
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
      return true;
    } catch (error) {
      console.error("Failed to clear sessions:", error);
      return false;
    }
  }
}
