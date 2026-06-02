import { useRef } from "react";
import { useChorditStore } from "@/app/store";

/**
 * Centered voicing slider: middle = 0. Drag up to shift voicing up,
 * drag down to shift voicing down. Each step away from 0 fires
 * voicingShift once. The slider position lives in the global store so
 * MIDI hardware input visually moves the on-screen slider too.
 * Snaps back to 0 on release.
 */
export function VoicingSlider({
  onShift,
}: {
  onShift: (delta: 1 | -1) => void;
}) {
  const val = useChorditStore((s) => s.voicingShiftValue);
  const setVal = useChorditStore((s) => s.setVoicingShiftValue);
  const lastRef = useRef(val);
  const currentNotes = useChorditStore((s) => s.currentChordNotes);

  // Keep lastRef in sync with external (MIDI) updates without firing shifts.
  if (lastRef.current !== val && Math.abs(lastRef.current - val) > 6) {
    lastRef.current = val;
  }

  const handleChange = (next: number) => {
    const last = lastRef.current;
    const diff = next - last;
    if (diff !== 0) {
      const dir: 1 | -1 = diff > 0 ? 1 : -1;
      for (let i = 0; i < Math.abs(diff); i++) onShift(dir);
    }
    lastRef.current = next;
    setVal(next);
  };

  const reset = () => {
    lastRef.current = 0;
    setVal(0);
  };

  const lo = currentNotes[0];
  const hi = currentNotes[currentNotes.length - 1];

  return (
    <div className="border border-border rounded-md p-3 bg-card flex flex-col gap-2">
      <div className="text-xs text-muted-foreground tracking-widest">VOICING SHIFT</div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1 py-1">
          <span className="text-[9px] text-muted-foreground">UP</span>
          <input
            type="range"
            min={-6}
            max={6}
            step={1}
            value={val}
            onChange={(e) => handleChange(Number(e.target.value))}
            onMouseUp={reset}
            onTouchEnd={reset}
            onBlur={reset}
            className="-rotate-90 w-24 accent-[var(--pad-active)]"
            aria-label="Voicing shift"
          />
          <span className="text-[9px] text-muted-foreground">DOWN</span>
        </div>
        <div className="flex-1 font-mono text-[10px] text-muted-foreground leading-tight">
          <div>
            shift{" "}
            <span className="text-foreground">
              {val > 0 ? `+${val}` : val}
            </span>
          </div>
          <div className="mt-1">
            range{" "}
            <span className="text-foreground">
              {lo !== undefined ? `${lo}` : "—"} … {hi !== undefined ? `${hi}` : "—"}
            </span>
          </div>
          <div className="mt-1 break-all">
            notes{" "}
            <span className="text-foreground">[{currentNotes.join(", ") || "—"}]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
