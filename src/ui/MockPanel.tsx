import { useEffect, useRef } from "react";
import { useChorditStore, PERFORMANCE_MODES } from "@/app/store";
import { ALL_KEYS } from "@/key/scales";
import { loopRecorder } from "@/app/loopRecorder";
import type { ChordType, ChordExtension } from "@/chord/chordTypes";

const CHORDS: ChordType[] = ["Dim", "Min", "Maj", "Sus"];
const EXTS: ChordExtension[] = ["6", "m7", "M7", "9"];

/**
 * Virtual hardware panel — clickable replica of the future ChordIT device.
 * Active whenever mockMode is on; all buttons + rotaries are reachable
 * without external hardware.
 */
export function MockPanel({
  onPlayRoot,
  onReleaseRoot,
}: {
  onPlayRoot: (note: number, vel?: number) => void;
  onReleaseRoot: (note: number) => void;
}) {
  const s = useChorditStore();

  // 2-second auto-commit for loop length while loop mode is on
  const pendingRef = useRef<number | null>(null);
  useEffect(() => {
    if (!s.loopEnabled) return;
    if (s.loopLengthPending === s.loopLength) return;
    if (pendingRef.current) window.clearTimeout(pendingRef.current);
    pendingRef.current = window.setTimeout(() => {
      s.setLoopLength(s.loopLengthPending);
    }, 2000);
    return () => {
      if (pendingRef.current) window.clearTimeout(pendingRef.current);
    };
  }, [s.loopLengthPending, s.loopEnabled, s.loopLength, s]);

  const toggleRecord = () => {
    if (!s.loopRecording) {
      loopRecorder.startRecord(s.performanceParams.bpm, s.loopLength);
      s.setLoopRecording(true);
      s.setLoopPlaying(false);
    } else {
      const loop = loopRecorder.stopRecord();
      s.setLoopRecording(false);
      if (loop && loop.events.length > 0) {
        loopRecorder.startPlay((e) => onPlayRoot(e.rootMidi, e.velocity), loop);
        s.setLoopPlaying(true);
      }
    }
  };

  const toggleLoop = () => {
    if (s.loopEnabled) {
      // Turning loop OFF also stops playback.
      loopRecorder.stopPlay();
      s.setLoopPlaying(false);
    }
    s.setLoopEnabled(!s.loopEnabled);
  };

  return (
    <section className="border border-border rounded-md bg-card p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.3em] text-muted-foreground">VIRTUAL HARDWARE</div>
        <div className="text-[10px] text-muted-foreground">
          {s.mockMode ? "MOCK ON" : "MOCK OFF"} · LEN {s.loopLength}{" "}
          {s.loopLengthPending !== s.loopLength && `→ ${s.loopLengthPending} (2s…)`}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* CHORD buttons */}
        <div className="col-span-6 grid grid-cols-4 gap-2">
          {CHORDS.map((c) => (
            <button
              key={c}
              data-control={`chord.${c}`}
              onClick={() => s.setChordType(c)}
              className={`py-4 rounded-full border text-xs tracking-widest ${
                s.selectedChordType === c
                  ? "bg-pad-active text-background border-pad-active"
                  : "border-border hover:border-pad-active/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {/* EXT buttons */}
        <div className="col-span-6 grid grid-cols-4 gap-2">
          {EXTS.map((e) => (
            <button
              key={e}
              data-control={`ext.${e}`}
              onClick={() => s.toggleExtension(e)}
              className={`py-4 rounded-full border text-xs tracking-widest ${
                s.activeExtensions.includes(e)
                  ? "bg-pad-active text-background border-pad-active"
                  : "border-border hover:border-pad-active/50"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Rotaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RotaryKnob
          label="PERFORM"
          value={s.performanceMode}
          onPrev={() => s.setPerformanceMode(prev(PERFORMANCE_MODES, s.performanceMode))}
          onNext={() => s.setPerformanceMode(next(PERFORMANCE_MODES, s.performanceMode))}
        />
        <RotaryKnob
          label="VOICING"
          value={s.voicingMode}
          onPrev={() => s.setVoicingMode(s.voicingMode === "Split" ? "Octave" : "Split")}
          onNext={() => s.setVoicingMode(s.voicingMode === "Split" ? "Octave" : "Split")}
        />
        <RotaryKnob
          label="KEY"
          value={s.selectedKey}
          onPrev={() => s.setSelectedKey(prev(ALL_KEYS, s.selectedKey))}
          onNext={() => s.setSelectedKey(next(ALL_KEYS, s.selectedKey))}
        />
        <RotaryKnob
          label="LOOP LEN"
          value={`${s.loopLengthPending}`}
          dimmed={!s.loopEnabled}
          onPrev={() => s.loopEnabled && s.setLoopLengthPending(Math.max(4, s.loopLengthPending - 1))}
          onNext={() => s.loopEnabled && s.setLoopLengthPending(Math.min(16, s.loopLengthPending + 1))}
        />
      </div>

      {/* Quick play row + LOOP / RECORD */}
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-8 grid grid-cols-8 gap-1">
          {[60, 62, 64, 65, 67, 69, 71, 72].map((n) => (
            <button
              key={n}
              onMouseDown={() => onPlayRoot(n)}
              onMouseUp={() => onReleaseRoot(n)}
              onMouseLeave={() => onReleaseRoot(n)}
              className="py-3 rounded border border-border bg-background hover:bg-accent text-[10px]"
            >
              {noteName(n)}
            </button>
          ))}
        </div>
        <button
          data-control="button.loop"
          onClick={toggleLoop}
          className={`col-span-2 py-3 rounded-full border text-xs tracking-widest ${
            s.loopEnabled
              ? "bg-sky-500/80 text-background border-sky-500"
              : "border-border hover:border-sky-500/50"
          }`}
        >
          LOOP
        </button>
        <button
          data-control="button.record"
          onClick={toggleRecord}
          className={`col-span-2 py-3 rounded-full border text-xs tracking-widest ${
            s.loopRecording
              ? "bg-rose-500 text-background border-rose-500 animate-pulse"
              : s.loopPlaying
              ? "bg-emerald-500/80 text-background border-emerald-500"
              : "border-border hover:border-rose-500/50"
          }`}
        >
          {s.loopRecording ? "● REC" : s.loopPlaying ? "▶ PLAY" : "REC"}
        </button>
      </div>
    </section>
  );
}

function RotaryKnob({
  label,
  value,
  onPrev,
  onNext,
  dimmed,
}: {
  label: string;
  value: string;
  onPrev: () => void;
  onNext: () => void;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`border border-border rounded-md p-2 bg-background flex flex-col gap-1 ${
        dimmed ? "opacity-40" : ""
      }`}
    >
      <div className="text-[10px] text-muted-foreground tracking-widest">{label}</div>
      <div className="flex items-center justify-between gap-1">
        <button onClick={onPrev} className="size-7 border border-border rounded-full hover:bg-accent">
          ◀
        </button>
        <div className="text-xs tracking-widest text-center flex-1">{value}</div>
        <button onClick={onNext} className="size-7 border border-border rounded-full hover:bg-accent">
          ▶
        </button>
      </div>
    </div>
  );
}

function prev<T>(arr: readonly T[], v: T): T {
  const i = arr.indexOf(v);
  return arr[(i - 1 + arr.length) % arr.length];
}
function next<T>(arr: readonly T[], v: T): T {
  const i = arr.indexOf(v);
  return arr[(i + 1) % arr.length];
}
function noteName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}
