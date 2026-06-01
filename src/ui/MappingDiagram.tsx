import type { ControlId, MidiMapping } from "@/midi/midiTypes";

type Pos = { x: number; y: number; r?: number; w?: number; h?: number; label: string; kind: "btn" | "rot" };

// Layout (viewBox 0..400 x 0..220) — buttons as circles, rotaries as larger circles.
const LAYOUT: Record<ControlId, Pos> = {
  "chord.Dim": { x: 50, y: 50, r: 16, label: "DIM", kind: "btn" },
  "chord.Min": { x: 95, y: 50, r: 16, label: "MIN", kind: "btn" },
  "chord.Maj": { x: 140, y: 50, r: 16, label: "MAJ", kind: "btn" },
  "chord.Sus": { x: 185, y: 50, r: 16, label: "SUS", kind: "btn" },

  "ext.6": { x: 50, y: 95, r: 14, label: "6", kind: "btn" },
  "ext.m7": { x: 95, y: 95, r: 14, label: "m7", kind: "btn" },
  "ext.M7": { x: 140, y: 95, r: 14, label: "M7", kind: "btn" },
  "ext.9": { x: 185, y: 95, r: 14, label: "9", kind: "btn" },

  "dial.perform": { x: 250, y: 50, r: 22, label: "PERFORM", kind: "rot" },
  "dial.voicing": { x: 310, y: 50, r: 22, label: "VOICING", kind: "rot" },
  "dial.key": { x: 370, y: 50, r: 22, label: "KEY", kind: "rot" },
  "dial.loopLen": { x: 370, y: 130, r: 22, label: "LOOP LEN", kind: "rot" },

  "toggle.perform": { x: 250, y: 110, r: 12, label: "T·P", kind: "btn" },
  "toggle.voicing": { x: 290, y: 110, r: 12, label: "T·V", kind: "btn" },
  "toggle.key": { x: 330, y: 110, r: 12, label: "T·K", kind: "btn" },

  "button.loop": { x: 260, y: 175, r: 18, label: "LOOP", kind: "btn" },
  "button.record": { x: 310, y: 175, r: 18, label: "REC", kind: "btn" },
  "button.propose": { x: 360, y: 175, r: 18, label: "PROP", kind: "btn" },
};

export function MappingDiagram({
  mappings,
  learning,
  onClick,
}: {
  mappings: MidiMapping[];
  learning?: string | null;
  onClick?: (controlId: string) => void;
}) {
  const byId = new Map(mappings.map((m) => [m.controlId, m]));

  return (
    <div className="border border-border rounded-md bg-card p-3">
      <div className="text-xs tracking-[0.3em] text-muted-foreground mb-2">DEVICE LAYOUT</div>
      <svg viewBox="0 0 420 220" className="w-full h-auto">
        {/* Device chassis */}
        <rect x="10" y="10" width="400" height="200" rx="14" className="fill-background stroke-border" strokeWidth="1" />
        {/* Section dividers */}
        <line x1="220" y1="20" x2="220" y2="200" className="stroke-border" strokeDasharray="3 3" />
        <text x="20" y="28" className="fill-muted-foreground" fontSize="8" letterSpacing="2">
          CHORD · EXT
        </text>
        <text x="230" y="28" className="fill-muted-foreground" fontSize="8" letterSpacing="2">
          ROTARIES · TOGGLES · LOOP
        </text>

        {(Object.entries(LAYOUT) as [ControlId, Pos][]).map(([id, p]) => {
          const m = byId.get(id);
          const isLearning = learning === id;
          const fill = isLearning ? "fill-pad-active/30" : m ? "fill-emerald-500/15" : "fill-card";
          const stroke = isLearning
            ? "stroke-pad-active"
            : m
            ? "stroke-emerald-500"
            : "stroke-border";
          return (
            <g
              key={id}
              onClick={() => onClick?.(id)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r}
                className={`${fill} ${stroke}`}
                strokeWidth={p.kind === "rot" ? 2 : 1.5}
              />
              {p.kind === "rot" && (
                <circle cx={p.x} cy={p.y} r={(p.r ?? 10) - 5} className="fill-none stroke-border" strokeDasharray="2 2" />
              )}
              <text
                x={p.x}
                y={p.y + (p.kind === "rot" ? 3 : 3)}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={p.kind === "rot" ? 7 : 7}
                fontWeight="600"
                letterSpacing="1"
              >
                {p.label}
              </text>
              {m && (
                <text
                  x={p.x}
                  y={p.y + (p.r ?? 14) + 9}
                  textAnchor="middle"
                  className="fill-emerald-400"
                  fontSize="7"
                  letterSpacing="0.5"
                >
                  {m.inputType.toUpperCase()} {m.channel}·{m.number}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="text-[10px] text-muted-foreground mt-1">
        Klick auf ein Element startet LEARN (wenn Web-MIDI verbunden). Grün = zugewiesen.
      </div>
    </div>
  );
}
