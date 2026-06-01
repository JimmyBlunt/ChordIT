import { useChorditStore } from "@/app/store";
import {
  ALL_HARMONIC_MODES,
  ALL_HARMONIC_STYLES,
  ALL_MOOD_TARGETS,
} from "@/progressions/progressionTypes";
import { progressionPresets } from "@/progressions/progressionPresets";
import type { ProposalColor } from "@/propose/proposeTypes";
import type { ChordExtension, ChordType } from "@/chord/chordTypes";

function mapProposalToStd(
  chordType: string,
  exts: string[],
): { chordType: ChordType; extensions: ChordExtension[] } | null {
  const ctMap: Record<string, ChordType> = {
    Maj: "Maj",
    Min: "Min",
    Sus: "Sus",
    Sus2: "Sus",
    Sus4: "Sus",
    Dim: "Dim",
    Pow: "Maj",
  };
  const ct = ctMap[chordType];
  if (!ct) return null;
  const allowed: ChordExtension[] = ["6", "m7", "M7", "9"];
  const extensions = exts.filter((e): e is ChordExtension =>
    (allowed as string[]).includes(e),
  );
  return { chordType: ct, extensions };
}

const COLOR_CLASS: Record<ProposalColor, string> = {
  green: "border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
  yellow: "border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]",
  blue: "border-sky-500 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.35)]",
  purple: "border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]",
};

export function HarmonicPanel({
  onPlay,
  onRelease,
}: {
  onPlay?: (rootMidi: number, velocity?: number) => void;
  onRelease?: (rootMidi: number) => void;
} = {}) {
  const s = useChorditStore();
  return (
    <section className="border border-border rounded-md bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.3em] text-muted-foreground">HARMONIC</div>
        <button
          onClick={() => s.clearChordHistory()}
          className="text-[10px] tracking-widest text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1"
        >
          CLEAR HISTORY ({s.chordHistory.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Select
          label="MODE"
          value={s.harmonicMode}
          options={ALL_HARMONIC_MODES}
          onChange={(v) => s.setHarmonicMode(v)}
        />
        <Select
          label="STYLE"
          value={s.harmonicStyle}
          options={ALL_HARMONIC_STYLES}
          onChange={(v) => s.setHarmonicStyle(v)}
        />
        <Select
          label="MOOD"
          value={s.moodTarget}
          options={ALL_MOOD_TARGETS}
          onChange={(v) => s.setMoodTarget(v)}
        />
        <Select
          label="PROGRESSION"
          value={s.activeProgressionPresetId ?? "—"}
          options={["—", ...progressionPresets.map((p) => p.id)]}
          onChange={(v) => s.setActiveProgressionPresetId(v === "—" ? null : v)}
          displayMap={Object.fromEntries(progressionPresets.map((p) => [p.id, p.name]))}
        />
      </div>

      <div className="text-[10px] tracking-widest text-muted-foreground">PROPOSE — NEXT CHORDS</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {s.proposals.length === 0 && (
          <div className="col-span-full text-xs text-muted-foreground italic">
            Play a chord to see suggestions…
          </div>
        )}
        {s.proposals.map((p) => {
          const handlePlay = () => {
            // Map proposal chord type + extensions back into store.
            const std = mapProposalToStd(p.chordType, p.extensions);
            if (std) {
              s.setChordType(std.chordType);
              s.setExtensions(std.extensions);
            }
            // Snap pitch class to nearest MIDI note around octaveBase.
            const base = s.octaveBase;
            const pc = ((p.rootPitchClass % 12) + 12) % 12;
            const baseRoot = base - (base % 12) + pc;
            const root = baseRoot < base - 6 ? baseRoot + 12 : baseRoot;
            onPlay?.(root, 100);
            window.setTimeout(() => onRelease?.(root), 350);
          };
          return (
            <button
              key={`${p.rootPitchClass}-${p.displayName}`}
              type="button"
              onClick={handlePlay}
              className={`text-left border rounded-md p-2 bg-background/40 flex flex-col gap-1 hover:bg-background/70 transition-colors ${COLOR_CLASS[p.color]}`}
            >
              <div className="flex items-baseline justify-between">
                <div className="text-lg tracking-widest">{p.displayName}</div>
                <div className="text-[9px] uppercase opacity-70">{p.strength}</div>
              </div>
              <div className="text-[10px] text-muted-foreground tracking-widest">
                {p.romanNumeral} · {p.voicingRecipe} · {p.performanceModeSuggestion}
              </div>
              <div className="text-[10px] text-muted-foreground/80 line-clamp-2">{p.reason}</div>
              <div className="text-[9px] opacity-60">score {p.score}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  displayMap,
}: {
  label: string;
  value: T | string;
  options: readonly T[] | string[];
  onChange: (v: T) => void;
  displayMap?: Record<string, string>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-background border border-border rounded px-2 py-1 text-xs tracking-widest"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {displayMap?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}
