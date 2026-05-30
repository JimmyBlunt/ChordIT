import { useEffect } from "react";
import { useChordIT } from "@/app/useChordIT";
import { useChorditStore, PERFORMANCE_MODES } from "@/app/store";
import { ALL_KEYS } from "@/key/scales";
import { PATTERNS } from "@/performance/patterns";
import { PianoKeyboard } from "@/ui/PianoKeyboard";
import type { ChordExtension, ChordType } from "@/chord/chordTypes";

const CHORD_TYPES: ChordType[] = ["Dim", "Min", "Maj", "Sus"];
const EXT_BUTTONS: ChordExtension[] = ["6", "m7", "M7", "9"];

// QWERTY → MIDI note (white + black keys, octave starting at C4=60)
const KEYBOARD_MAP: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
  k: 72, o: 73, l: 74, p: 75, ";": 76,
};

export function MainScreen() {
  const { playRoot, releaseRoot, voicingShift, toggleExt } = useChordIT();
  const s = useChorditStore();

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
    <div className="min-h-screen bg-background text-foreground font-mono p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="size-3 rounded-full bg-pad-active animate-pulse" />
          <h1 className="text-xl tracking-[0.3em]">CHORD·IT</h1>
        </div>
        <nav className="flex gap-4 text-xs text-muted-foreground">
          <a href="/" className="text-foreground">MAIN</a>
          <a href="/settings" className="hover:text-foreground">SETTINGS</a>
        </nav>
      </header>

      {/* Display */}
      <section className="flex flex-col items-center justify-center py-10 border border-border rounded-md bg-card">
        <div className="text-[12rem] leading-none tracking-tight text-pad-active select-none">
          {s.currentDisplayString || "—"}
        </div>
        <div className="mt-4 text-xs text-muted-foreground tracking-[0.3em] uppercase">
          {s.performanceMode} · {s.voicingMode} · {s.keyModeEnabled ? `KEY ${s.selectedKey}` : "FREE"} · {s.performanceParams.bpm} BPM
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pads */}
        <section className="md:col-span-2 flex flex-col gap-4">
          <PadRow
            label="CHORD"
            items={CHORD_TYPES}
            active={(t) => s.selectedChordType === t}
            onClick={(t) => s.setChordType(t)}
          />
          <PadRow
            label="EXT"
            items={EXT_BUTTONS}
            active={(e) => s.activeExtensions.includes(e)}
            onClick={(e) => toggleExt(e)}
          />
          <div className="text-xs text-muted-foreground tracking-widest">
            Press A S D F G H J K (white) / W E T Y U (black) to play. ↑ ↓ voicing.
          </div>
        </section>

        {/* Rotaries */}
        <section className="flex flex-col gap-4">
          <Rotary
            label="PERFORM"
            value={s.performanceMode}
            options={PERFORMANCE_MODES}
            onChange={(m) => s.setPerformanceMode(m)}
          />
          <div className="flex gap-2">
            <button
              className="flex-1 border border-border rounded-md py-2 text-xs hover:bg-accent"
              onClick={() => voicingShift(-1)}
            >
              VOICE −
            </button>
            <button
              className="flex-1 border border-border rounded-md py-2 text-xs hover:bg-accent"
              onClick={() => voicingShift(1)}
            >
              VOICE +
            </button>
          </div>
          <Toggle
            label="VOICING"
            value={s.voicingMode}
            options={["Split", "Octave"] as const}
            onChange={(v) => s.setVoicingMode(v)}
          />
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

      {/* Footer */}
      <footer className="text-xs text-muted-foreground border-t border-border pt-3 flex justify-between">
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
}: {
  label: string;
  items: readonly T[];
  active: (t: T) => boolean;
  onClick: (t: T) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 text-xs text-muted-foreground tracking-widest">{label}</div>
      <div className="grid grid-cols-4 gap-3 flex-1">
        {items.map((it) => (
          <button
            key={it}
            onClick={() => onClick(it)}
            className={`py-5 rounded-md border text-sm tracking-widest transition-colors ${
              active(it)
                ? "bg-pad-active text-background border-pad-active shadow-[0_0_20px_var(--pad-active)]"
                : "bg-card border-border hover:border-pad-active/50"
            }`}
          >
            {it}
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
    <div className="border border-border rounded-md p-3 bg-card">
      <div className="text-xs text-muted-foreground tracking-widest mb-2">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <button
          className="size-8 border border-border rounded hover:bg-accent"
          onClick={() => onChange(options[(idx - 1 + options.length) % options.length])}
        >
          ◀
        </button>
        <div className="text-sm flex-1 text-center tracking-widest">{value}</div>
        <button
          className="size-8 border border-border rounded hover:bg-accent"
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
    <div className="border border-border rounded-md p-3 bg-card">
      <div className="text-xs text-muted-foreground tracking-widest mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`py-2 rounded text-xs tracking-widest border ${
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
