import type { ControlId, MidiMapping } from "@/midi/midiTypes";
import deviceAsset from "@/assets/microkontrol.png.asset.json";

type Spot = { x: number; y: number; w: number; h: number; label: string; shape?: "rect" | "circle" };

// Coordinates are percentages relative to the 846x429 reference image.
const SPOTS: Record<ControlId, Spot> = {
  // ── Pads (4×4 grid on the left) ────────────────────────────────────────
  // Photo has slight barrel: middle columns sit a touch right + lower than
  // a linear interpolation between the (correct) left and right edges.
  // Row 1 — pads 1..4
  "button.propose":  { x: 7.9,  y: 11.4, w: 5.4, h: 10.4, label: "PROPOSE" },
  "toggle.perform":  { x: 15.0, y: 12.0, w: 5.0, h: 10.4, label: "PERFORM" },
  "toggle.voicing":  { x: 21.0, y: 12.3, w: 5.0, h: 10.1, label: "VOICING" },
  "toggle.key":      { x: 26.6, y: 11.7, w: 5.0, h: 10.1, label: "KEY" },
  // Row 2 — pads 5..8
  "button.loop":     { x: 7.9,  y: 23.4, w: 5.4, h: 10.4, label: "LOOP" },
  "button.record":   { x: 15.0, y: 24.0, w: 5.0, h: 10.4, label: "REC" },
  "button.style":    { x: 21.0, y: 24.3, w: 5.0, h: 10.1, label: "STYLE" },
  "button.mode":     { x: 26.6, y: 23.7, w: 5.0, h: 10.1, label: "MODE" },
  // Row 3 — pads 9..12 (chord types)
  "chord.Dim":       { x: 7.9,  y: 36.0, w: 5.4, h: 10.4, label: "DIM" },
  "chord.Min":       { x: 15.0, y: 36.6, w: 5.0, h: 10.4, label: "MIN" },
  "chord.Maj":       { x: 21.0, y: 36.9, w: 5.0, h: 10.1, label: "MAJ" },
  "chord.Sus":       { x: 26.6, y: 36.3, w: 5.0, h: 10.1, label: "SUS" },
  // Row 4 — pads 13..16 (extensions)
  "ext.6":           { x: 7.9,  y: 47.4, w: 5.4, h: 10.4, label: "6" },
  "ext.m7":          { x: 15.0, y: 48.0, w: 5.0, h: 10.4, label: "m7" },
  "ext.M7":          { x: 21.0, y: 48.3, w: 5.0, h: 10.1, label: "M7" },
  "ext.9":           { x: 26.6, y: 47.7, w: 5.0, h: 10.1, label: "9" },


  // ── Encoders (top row of knobs, 8) ────────────────────────────────────
  "dial.perform":    { x: 47.2, y: 22.7, w: 5.0, h: 10.0, label: "PERFORM", shape: "circle" },
  "dial.voicing":    { x: 53.7, y: 22.7, w: 5.0, h: 10.0, label: "VOICING", shape: "circle" },
  "dial.key":        { x: 60.2, y: 22.7, w: 5.0, h: 10.0, label: "KEY",     shape: "circle" },
  "dial.loopLen":    { x: 66.7, y: 22.7, w: 5.0, h: 10.0, label: "LOOPLEN", shape: "circle" },
  "dial.style":      { x: 73.2, y: 22.7, w: 5.0, h: 10.0, label: "STYLE",   shape: "circle" },
  "dial.mood":       { x: 79.7, y: 22.7, w: 5.0, h: 10.0, label: "MOOD",    shape: "circle" },
  "dial.progression":{ x: 86.2, y: 22.7, w: 5.0, h: 10.0, label: "PROG",    shape: "circle" },
  "dial.bpm":        { x: 92.7, y: 22.7, w: 5.0, h: 10.0, label: "BPM",     shape: "circle" },

  // ── Sliders (faders, 8) ───────────────────────────────────────────────
  "slider.rhythm":      { x: 47.2, y: 42.0, w: 4.0, h: 16.2, label: "RHY" },
  "slider.voicingShift":{ x: 53.7, y: 42.0, w: 4.0, h: 16.2, label: "V·SH" },
  "slider.strum":       { x: 60.2, y: 42.0, w: 4.0, h: 16.2, label: "STRUM" },
  "slider.slop":        { x: 66.7, y: 42.0, w: 4.0, h: 16.2, label: "SLOP" },
  "slider.arp":         { x: 73.2, y: 42.0, w: 4.0, h: 16.2, label: "ARP" },
  "slider.harp":        { x: 79.7, y: 42.0, w: 4.0, h: 16.2, label: "HARP" },
  "slider.harpOctaves": { x: 86.2, y: 42.0, w: 4.0, h: 16.2, label: "H·OCT" },
  "slider.octaveBase":  { x: 92.7, y: 42.0, w: 4.0, h: 16.2, label: "OCT" },
};

export function MicroKontrolPhotoMap({
  mappings,
  learning,
  onClick,
}: {
  mappings: MidiMapping[];
  learning?: string | null;
  onClick?: (controlId: ControlId) => void;
}) {
  const byId = new Map(mappings.map((m) => [m.controlId, m]));
  const entries = Object.entries(SPOTS) as [ControlId, Spot][];

  return (
    <div className="border border-border rounded-md bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs tracking-[0.3em] text-muted-foreground">microKONTROL · LAYOUT</div>
        <div className="text-[10px] text-muted-foreground">
          Klick = LEARN · <span className="text-emerald-400">grün</span> = zugewiesen
        </div>
      </div>
      <div className="relative w-full" style={{ aspectRatio: "846 / 429" }}>
        <img
          src={deviceAsset.url}
          alt="Korg microKONTROL device layout"
          className="absolute inset-0 w-full h-full object-contain rounded-md select-none pointer-events-none"
          draggable={false}
        />
        {entries.map(([id, p]) => {
          const m = byId.get(id);
          const isLearning = learning === id;
          const border = isLearning
            ? "border-pad-active shadow-[0_0_18px_var(--pad-active)]"
            : m
            ? "border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
            : "border-white/30 hover:border-white/70";
          const bg = isLearning
            ? "bg-pad-active/25"
            : m
            ? "bg-emerald-500/15"
            : "bg-white/0 hover:bg-white/10";
          return (
            <button
              key={id}
              type="button"
              onClick={() => onClick?.(id)}
              title={`${p.label} — ${m ? `${m.inputType.toUpperCase()} ch${m.channel} #${m.number}` : "unmapped"}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 ${border} ${bg} transition-colors flex flex-col items-center justify-center text-[8px] leading-tight font-mono`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.w}%`,
                height: `${p.h}%`,
                borderRadius: p.shape === "circle" ? "9999px" : "4px",
              }}
            >
              <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">{p.label}</span>
              {m && (
                <span className="text-emerald-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                  {m.inputType === "cc" ? "CC" : "N"} {m.channel}·{m.number}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
