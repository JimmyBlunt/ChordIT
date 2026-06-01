import { useEffect, useState } from "react";
import { midiActivity } from "@/midi/midiActivity";
import { useChorditStore } from "@/app/store";
import type { ChordProposal, ProposalColor } from "@/propose/proposeTypes";

const DOT_COLOR: Record<ProposalColor, string> = {
  green: "bg-emerald-500 ring-emerald-300",
  yellow: "bg-yellow-400 ring-yellow-200",
  blue: "bg-sky-500 ring-sky-300",
  purple: "bg-purple-500 ring-purple-300",
};

/**
 * Visualizes a range of MIDI notes as a piano keyboard.
 * Highlights incoming notes (blue) and outgoing notes (amber).
 * Overlap is rendered green.
 * Also paints colored dots on keys whose pitch class matches a proposed
 * next-chord root, using the proposal's strength color.
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
  const proposals = useChorditStore((s) => s.proposals);

  useEffect(() => {
    const unsub = midiActivity.subscribe(setActive);
    return () => void unsub();
  }, []);

  // pitchClass → highest-priority proposal (proposals are pre-ranked).
  const proposalByPc = new Map<number, ChordProposal>();
  for (const p of proposals) {
    if (!proposalByPc.has(p.rootPitchClass)) proposalByPc.set(p.rootPitchClass, p);
  }

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
          <Legend color="bg-emerald-500" label="BEST" />
          <Legend color="bg-yellow-400" label="GOOD" />
          <Legend color="bg-sky-500" label="ALT" />
          <Legend color="bg-purple-500" label="SPICY" />
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
            const prop = proposalByPc.get(((n % 12) + 12) % 12);
            return (
              <div
                key={n}
                className={`relative flex-1 border-r last:border-r-0 ${color} flex items-end justify-center pb-1 text-[9px] text-zinc-700`}
                title={prop ? `MIDI ${n} · ${prop.displayName} (${prop.strength})` : `MIDI ${n}`}
              >
                {prop && (
                  <span
                    className={`absolute top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ring-2 ${DOT_COLOR[prop.color]}`}
                  />
                )}
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
                    proposal={proposalByPc.get(((black % 12) + 12) % 12)}
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

function BlackKey({
  note,
  isIn,
  isOut,
  proposal,
}: {
  note: number;
  isIn: boolean;
  isOut: boolean;
  proposal?: ChordProposal;
}) {
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
      title={proposal ? `MIDI ${note} · ${proposal.displayName} (${proposal.strength})` : `MIDI ${note}`}
    >
      {proposal && (
        <span
          className={`absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ring-2 ${DOT_COLOR[proposal.color]}`}
        />
      )}
    </div>
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
