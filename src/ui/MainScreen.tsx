import { useEffect } from "react";
import { useChordIT } from "@/app/useChordIT";
import { useChorditStore, PERFORMANCE_MODES } from "@/app/store";
import { ALL_KEYS } from "@/key/scales";
import { PATTERNS } from "@/performance/patterns";
import { PianoKeyboard } from "@/ui/PianoKeyboard";
import { MockPanel } from "@/ui/MockPanel";
import { MiniSequencer } from "@/ui/MiniSequencer";
import { HarmonicPanel } from "@/ui/HarmonicPanel";
import { VoicingSlider } from "@/ui/VoicingSlider";
import type { ChordExtension, ChordType } from "@/chord/chordTypes";

const CHORD_TYPES: ChordType[] = ["Dim", "Min", "Maj", "Sus"];
const EXT_BUTTONS: ChordExtension[] = ["6", "m7", "M7", "9"];
const EXT_LABEL_ELECTRONIC: Record<ChordExtension, string> = {
  "6": "Warm",
  m7: "Deep",
  M7: "Dream",
  "9": "Air",
};
const CHORD_LABEL_ELECTRONIC: Record<ChordType, string> = {
  Dim: "Dim",
  Min: "Min",
  Maj: "Maj",
  Sus: "Sus2",
};

// QWERTY → MIDI note (white + black keys, octave starting at C4=60)
const KEYBOARD_MAP: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
  k: 72, o: 73, l: 74, p: 75, ";": 76,
};

export function MainScreen() {
  const { playRoot, releaseRoot, voicingShift, toggleExt } = useChordIT({ hardwareInput: true });
  const s = useChorditStore();
  const electronic = s.harmonicMode === "Electronic";

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k in KEYBOARD_MAP) {
        playRoot(KEYBOARD_MAP[k], 100);
      } else if (k === "arrowup") {
        voicingShift(1);
      } else if (k === "arrowdown") {
        voicingShift(-1);
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in KEYBOARD_MAP) releaseRoot(KEYBOARD_MAP[k]);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [playRoot, releaseRoot, voicingShift]);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-3 flex flex-col gap-3">
      <header className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-3">
          <div className="size-2.5 rounded-full bg-pad-active animate-pulse" />
          <h1 className="text-base tracking-[0.3em]">CHORD·IT</h1>
        </div>
        <nav className="flex gap-4 text-xs text-muted-foreground">
          <a href="/" className="text-foreground">MAIN</a>
          <a href="/settings" className="hover:text-foreground">SETTINGS</a>
          <a href="/tests" className="hover:text-foreground">TESTS</a>
        </nav>
      </header>

      {/* Top zone: display + pads + rotaries — fits with keyboard above the fold */}
      <div className="grid grid-cols-12 gap-3 items-stretch">
        {/* Display */}
        <section className="col-span-12 md:col-span-5 flex flex-col items-center justify-center py-3 border border-border rounded-md bg-card">
          <div className="text-[5rem] leading-none tracking-tight text-pad-active select-none">
            {s.currentDisplayString || "—"}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground tracking-[0.3em] uppercase text-center">
            {s.harmonicMode} · {s.performanceMode} · {s.voicingMode} ·{" "}
            {s.keyModeEnabled ? `KEY ${s.selectedKey}` : "FREE"} · {s.performanceParams.bpm} BPM
          </div>
        </section>

        {/* Pads */}
        <section className="col-span-12 md:col-span-4 flex flex-col gap-2">
          <PadRow
            label="CHORD"
            items={CHORD_TYPES}
            renderLabel={(t) => (electronic ? CHORD_LABEL_ELECTRONIC[t] : t)}
            active={(t) => s.selectedChordType === t}
            onClick={(t) => s.setChordType(t)}
          />
          <PadRow
            label={electronic ? "PAD" : "EXT"}
            items={EXT_BUTTONS}
            renderLabel={(e) => (electronic ? EXT_LABEL_ELECTRONIC[e] : e)}
            active={(e) => s.activeExtensions.includes(e)}
            onClick={(e) => toggleExt(e)}
          />
          <div className="text-[10px] text-muted-foreground tracking-widest">
            A S D F G H J K (white) / W E T Y U (black) · ↑ ↓ voicing
          </div>
        </section>

        {/* Rotaries / voicing slider */}
        <section className="col-span-12 md:col-span-3 flex flex-col gap-2">
          <Rotary
            label="PERFORM"
            value={s.performanceMode}
            options={PERFORMANCE_MODES}
            onChange={(m) => s.setPerformanceMode(m)}
          />
          <VoicingSlider onShift={voicingShift} />
          <Toggle
            label="VOICING"
            value={s.voicingMode}
            options={["Split", "Octave"] as const}
            onChange={(v) => s.setVoicingMode(v)}
          />
          {s.performanceMode === "Pattern" && (
            <Rotary
              label="PATTERN"
              value={PATTERNS[s.performanceParams.patternIndex]?.name ?? "—"}
              options={PATTERNS.map((p) => p.name)}
              onChange={(name) =>
                s.setPerformanceParams({
                  patternIndex: Math.max(0, PATTERNS.findIndex((p) => p.name === name)),
                })
              }
            />
          )}
        </section>
      </div>

      <PianoKeyboard />

      {/* Secondary controls below the fold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Rotary
          label="KEY"
          value={s.selectedKey}
          options={ALL_KEYS}
          onChange={(k) => s.setSelectedKey(k)}
        />
        <Toggle
          label="KEY MODE"
          value={s.keyModeEnabled ? "ON" : "OFF"}
          options={["OFF", "ON"] as const}
          onChange={(v) => v !== (s.keyModeEnabled ? "ON" : "OFF") && s.toggleKeyMode()}
        />
      </div>

      <HarmonicPanel onPlay={playRoot} onRelease={releaseRoot} />

      <MiniSequencer />

      {s.mockMode && <MockPanel onPlayRoot={playRoot} onReleaseRoot={releaseRoot} />}

      <footer className="text-[10px] text-muted-foreground border-t border-border pt-2 flex justify-between">
        <div>NOTES: [{s.currentChordNotes.join(", ")}]</div>
        <div>{s.mockMode ? "MOCK MIDI" : s.midiOutputConnected ? "MIDI OUT ●" : "MIDI OUT ○"}</div>
      </footer>
    </div>
  );
}

function PadRow<T extends string>({
  label,
  items,
  active,
  onClick,
  renderLabel,
}: {
  label: string;
  items: readonly T[];
  active: (t: T) => boolean;
  onClick: (t: T) => void;
  renderLabel?: (t: T) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 text-[10px] text-muted-foreground tracking-widest">{label}</div>
      <div className="grid grid-cols-4 gap-2 flex-1">
        {items.map((it) => (
          <button
            key={it}
            onClick={() => onClick(it)}
            className={`py-3 rounded-md border text-xs tracking-widest transition-colors ${
              active(it)
                ? "bg-pad-active text-background border-pad-active shadow-[0_0_14px_var(--pad-active)]"
                : "bg-card border-border hover:border-pad-active/50"
            }`}
          >
            {renderLabel ? renderLabel(it) : it}
          </button>
        ))}
      </div>
    </div>
  );
}

function Rotary<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  const idx = options.indexOf(value);
  return (
    <div className="border border-border rounded-md p-2 bg-card">
      <div className="text-[10px] text-muted-foreground tracking-widest mb-1">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <button
          className="size-7 border border-border rounded hover:bg-accent text-xs"
          onClick={() => onChange(options[(idx - 1 + options.length) % options.length])}
        >
          ◀
        </button>
        <div className="text-xs flex-1 text-center tracking-widest">{value}</div>
        <button
          className="size-7 border border-border rounded hover:bg-accent text-xs"
          onClick={() => onChange(options[(idx + 1) % options.length])}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="border border-border rounded-md p-2 bg-card">
      <div className="text-[10px] text-muted-foreground tracking-widest mb-1">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`py-1.5 rounded text-xs tracking-widest border ${
              value === o
                ? "bg-pad-active text-background border-pad-active"
                : "bg-background border-border hover:border-pad-active/50"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
