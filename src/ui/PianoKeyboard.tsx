import { useEffect, useState } from "react";
import { midiActivity } from "@/midi/midiActivity";

/**
 * Visualizes a range of MIDI notes as a piano keyboard.
 * Highlights incoming notes (blue) and outgoing notes (amber).
 * Overlap is rendered green.
 */
export function PianoKeyboard({
  startNote = 48, // C3
  endNote = 84, // C6
}: {
  startNote?: number;
  endNote?: number;
}) {
  const [active, setActive] = useState<{ in: Set<number>; out: Set<number> }>({
    in: new Set(),
    out: new Set(),
  });

  useEffect(() => {
    const unsub = midiActivity.subscribe(setActive);
    return () => void unsub();
  }, []);

  const notes: number[] = [];
  for (let n = startNote; n <= endNote; n++) notes.push(n);
  const whites = notes.filter((n) => !isBlack(n));

  return (
    <div className="border border-border rounded-md bg-card p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px] tracking-widest text-muted-foreground">
        <div>PIANO MONITOR</div>
        <div className="flex gap-3">
          <Legend color="bg-sky-500" label="IN" />
          <Legend color="bg-amber-500" label="OUT" />
          <Legend color="bg-emerald-500" label="BOTH" />
        </div>
      </div>
      <div className="relative h-28 select-none" style={{ minWidth: whites.length * 22 }}>
        {/* White keys */}
        <div className="absolute inset-0 flex">
          {whites.map((n) => {
            const isIn = active.in.has(n);
            const isOut = active.out.has(n);
            const color = isIn && isOut
              ? "bg-emerald-500 border-emerald-600"
              : isIn
              ? "bg-sky-500 border-sky-600"
              : isOut
              ? "bg-amber-500 border-amber-600"
              : "bg-zinc-100 border-zinc-400";
            return (
              <div
                key={n}
                className={`flex-1 border-r last:border-r-0 ${color} flex items-end justify-center pb-1 text-[9px] text-zinc-700`}
                title={`MIDI ${n}`}
              >
                {n % 12 === 0 ? `C${Math.floor(n / 12) - 1}` : ""}
              </div>
            );
          })}
        </div>
        {/* Black keys */}
        <div className="absolute inset-0 flex pointer-events-none">
          {whites.map((n, i) => {
            const black = n + 1;
            const hasBlackAfter = isBlack(black) && black <= endNote;
            return (
              <div key={n} className="flex-1 relative">
                {hasBlackAfter && (
                  <BlackKey
                    note={black}
                    isIn={active.in.has(black)}
                    isOut={active.out.has(black)}
                  />
                )}
                {i === 0 && <div />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BlackKey({ note, isIn, isOut }: { note: number; isIn: boolean; isOut: boolean }) {
  const color = isIn && isOut
    ? "bg-emerald-500"
    : isIn
    ? "bg-sky-500"
    : isOut
    ? "bg-amber-500"
    : "bg-zinc-900";
  return (
    <div
      className={`absolute top-0 h-[60%] w-[60%] right-[-30%] z-10 rounded-b ${color} border border-zinc-800`}
      title={`MIDI ${note}`}
    />
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`inline-block w-2 h-2 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function isBlack(midi: number): boolean {
  const pc = ((midi % 12) + 12) % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}
