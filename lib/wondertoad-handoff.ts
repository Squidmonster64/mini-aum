import type { WondertoadHandoff } from "@/types/wondertoad";

function baseUrl() {
  const value = process.env.EXPO_PUBLIC_WONDERTOAD_URL?.trim();
  if (!value) {
    throw new Error("EXPO_PUBLIC_WONDERTOAD_URL is not configured");
  }
  return value.replace(/\/$/, "");
}

export async function resolveWondertoadHandoff(
  token: string,
): Promise<WondertoadHandoff> {
  if (!token.trim()) throw new Error("Missing Wondertoad handoff token");

  const response = await fetch(
    `${baseUrl()}/api/handoff/${encodeURIComponent(token)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Wondertoad handoff failed (${response.status})${detail ? `: ${detail}` : ""}`,
    );
  }

  const payload = (await response.json()) as WondertoadHandoff;
  if (!Array.isArray(payload.candidates) || payload.candidates.length === 0) {
    throw new Error("Wondertoad handoff contained no candidates");
  }

  return payload;
}

export function wondertoadDeepLink(token: string) {
  return `miniaum://wondertoad?token=${encodeURIComponent(token)}`;
}
