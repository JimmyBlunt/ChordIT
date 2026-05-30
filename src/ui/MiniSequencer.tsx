import { useMemo, useState } from "react";
import { useChorditStore } from "@/app/store";
import { PATTERNS, type Pattern } from "@/performance/patterns";

/**
 * Compact step sequencer (16 steps, 3 chord-note tracks).
 * - Read mode: displays the currently selected built-in or user pattern.
 * - Edit mode: lets the user toggle steps and save as a new user pattern.
 */
export function MiniSequencer() {
  const s = useChorditStore();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("My Groove");

  const all: Pattern[] = useMemo(() => [...PATTERNS, ...s.userPatterns], [s.userPatterns]);
  const idx = Math.min(s.performanceParams.patternIndex, all.length - 1);
  const current = all[idx] ?? PATTERNS[0];

  // Derive a 16-step / 3-track grid from the current pattern.
  const STEPS = 16;
  const TRACKS = 3;
  const initialGrid = useMemo(() => {
    const g: boolean[][] = Array.from({ length: TRACKS }, () => Array(STEPS).fill(false));
    const stepLen = current.lengthTicks / STEPS;
    current.steps.forEach((st) => {
      const col = Math.round(st.tickOffset / stepLen) % STEPS;
      const row = st.noteIndex % TRACKS;
      g[row][col] = true;
    });
    return g;
  }, [current]);

  const [grid, setGrid] = useState<boolean[][]>(initialGrid);

  // Reset grid when switching pattern.
  useMemo(() => setGrid(initialGrid), [initialGrid]);

  const toggle = (r: number, c: number) => {
    if (!edit) return;
    setGrid((g) => g.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? !v : v))));
  };

  const save = () => {
    const id = `user-${Date.now()}`;
    const stepLen = 96 / STEPS; // 16 steps per bar @ 24ppqn
    const steps = [];
    for (let r = 0; r < TRACKS; r++) {
      for (let c = 0; c < STEPS; c++) {
        if (grid[r][c]) {
          steps.push({
            tickOffset: c * stepLen,
            noteIndex: r,
            velocityScale: 1,
            gateLengthTicks: stepLen,
          });
        }
      }
    }
    const pattern: Pattern = { id, name: name || `Pattern ${s.userPatterns.length + 1}`, lengthTicks: 96, steps };
    s.addUserPattern(pattern);
    // Select the newly saved pattern.
    s.setPerformanceParams({ patternIndex: PATTERNS.length + s.userPatterns.length });
    setEdit(false);
  };

  return (
    <section className="border border-border rounded-md bg-card p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.3em] text-muted-foreground">RHYTHM GROOVE</div>
        <div className="flex gap-2 items-center">
          <select
            className="bg-background border border-border rounded px-2 py-1 text-xs"
            value={idx}
            onChange={(e) => s.setPerformanceParams({ patternIndex: Number(e.target.value) })}
          >
            {all.map((p, i) => (
              <option key={p.id} value={i}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setEdit((v) => !v)}
            className={`text-[10px] px-2 py-1 rounded border ${
              edit ? "bg-pad-active text-background border-pad-active" : "border-border hover:bg-accent"
            }`}
          >
            {edit ? "EDIT ON" : "EDIT"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {grid.map((row, r) => (
          <div key={r} className="flex items-center gap-1">
            <div className="w-10 text-[10px] text-muted-foreground">N{r + 1}</div>
            <div className="grid grid-cols-16 gap-[2px] flex-1" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
              {row.map((on, c) => (
                <button
                  key={c}
                  onClick={() => toggle(r, c)}
                  className={`h-5 rounded-[2px] border ${
                    on
                      ? "bg-pad-active border-pad-active"
                      : c % 4 === 0
                      ? "bg-background border-border"
                      : "bg-background/40 border-border/40"
                  } ${edit ? "cursor-pointer hover:border-pad-active" : "cursor-default"}`}
                  aria-label={`step-${r}-${c}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="flex gap-2 items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-xs flex-1"
            placeholder="Pattern name"
          />
          <button
            onClick={save}
            className="text-[10px] px-3 py-1 rounded border border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10"
          >
            SAVE
          </button>
        </div>
      )}
    </section>
  );
}
