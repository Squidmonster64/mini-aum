import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const mixer = readFileSync(join(root, "public", "mixer.html"), "utf8");
const studio = readFileSync(join(root, "public", "studio.js"), "utf8");
const server = readFileSync(join(root, "server", "_core", "index.ts"), "utf8");
const sw = readFileSync(join(root, "public", "service-worker.js"), "utf8");

describe("Mini AUM web studio beta contract", () => {
  it("does not ship the old decorative demo mixer", () => {
    expect(mixer).not.toContain("Playback started!");
    expect(mixer).not.toContain("slider-vertical");
    expect(mixer).not.toContain("vu-bar\" style=\"width: 75%");
    expect(mixer).toContain('src="/studio.js"');
  });

  it("exposes explicit audio sources and real loading controls", () => {
    expect(mixer).toContain("SOURCE");
    expect(studio).toContain("LOAD AUDIO");
    expect(mixer).toContain("OPEN WONDERTOAD");
    expect(mixer).toContain("No demo sound is hidden behind the strips");
  });

  it("uses permissively licensed audio and MIDI foundations", () => {
    expect(studio).toContain("tone@15.1.22");
    expect(studio).toContain("@tonejs/midi@2.0.28");
    expect(studio).toContain("Tone.Player");
    expect(studio).toContain("Tone.PolySynth");
    expect(studio).toContain("new Midi(data)");
  });

  it("has a functional MIDI editor surface", () => {
    expect(mixer).toContain("MIDI EDITOR");
    expect(mixer).toContain("IMPORT MIDI");
    expect(mixer).toContain("data-transpose");
    expect(mixer).toContain("DELETE NOTE");
    expect(studio).toContain("dblclick");
    expect(studio).toContain("rebuildMidiPart");
  });

  it("does not replace a channel DOM tree while a fader is moving", () => {
    const volumeHandler = studio.slice(
      studio.indexOf("volumeInput.addEventListener('input'"),
      studio.indexOf("const panInput", studio.indexOf("volumeInput.addEventListener('input'")),
    );
    expect(volumeHandler).toContain("ch.node.volume.value");
    expect(volumeHandler).not.toContain("renderChannels()");
  });

  it("proxies secure Wondertoad handoffs and audio ranges", () => {
    expect(server).toContain('/api/wondertoad/handoff/:token');
    expect(server).toContain('/api/wondertoad/handoff/:token/file/:sampleKey');
    expect(server).toContain('req.headers.range');
    expect(server).toContain('cache-control');
    expect(studio).toContain('/api/wondertoad/handoff/');
  });

  it("forces navigation and API requests network-first after beta upgrades", () => {
    expect(sw).toContain("mini-aum-v2");
    expect(sw).toContain("event.request.mode === 'navigate'");
    expect(sw).toContain("url.pathname.startsWith('/api/')");
  });
});
