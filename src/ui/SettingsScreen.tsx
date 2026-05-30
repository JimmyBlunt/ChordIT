import { useEffect, useMemo, useState } from "react";
import { useChorditStore } from "@/app/store";
import { MidiMapper } from "@/midi/midiMapper";
import { ALL_CONTROL_IDS, type ControlId, type MidiMapping } from "@/midi/midiTypes";
import { initWebMidi, type WebMidiHandle } from "@/midi/webMidi";
import { midiBridge } from "@/midi/midiBridge";

export function SettingsScreen() {
  const s = useChorditStore();
  const mapper = useMemo(() => {
    const m = new MidiMapper();
    m.load();
    return m;
  }, []);
  const [mappings, setMappings] = useState<MidiMapping[]>(mapper.list());
  const [learning, setLearning] = useState<ControlId | null>(null);
  const [handle, setHandle] = useState<WebMidiHandle | null>(null);
  const [inputId, setInputId] = useState<string>("");
  const [outputId, setOutputId] = useState<string>("");
  const [midiError, setMidiError] = useState<string | null>(null);

  useEffect(() => {
    s.setMidiMappings(mappings);
  }, [mappings]);

  // Initialize Web MIDI regardless of Mock Mode — Mock Mode only disables the
  // hardware *input* requirement; users may still pick a real MIDI output.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("requestMIDIAccess" in navigator)) {
      setMidiError("Web MIDI API wird in diesem Browser nicht unterstützt (nutze Chrome/Edge).");
      return;
    }
    initWebMidi()
      .then((h) => {
        if (!h) {
          setMidiError("Web MIDI konnte nicht initialisiert werden.");
          return;
        }
        setHandle(h);
        setMidiError(
          h.inputs.length === 0 && h.outputs.length === 0
            ? "Keine MIDI-Geräte gefunden. Schließe ein Gerät an und lade die Seite neu."
            : null,
        );
      })
      .catch((err) => {
        setMidiError(`MIDI-Zugriff verweigert: ${err?.message ?? err}`);
      });
  }, []);

  useEffect(() => {
    if (!handle) return;
    const unsub = handle.midiIn.onMessage((msg) => {
      const { learned } = mapper.handle(msg);
      if (learned) {
        setMappings(mapper.list());
        setLearning(null);
        mapper.save();
      }
    });
    return unsub;
  }, [handle, mapper]);

  const startLearn = (id: ControlId) => {
    setLearning(id);
    mapper.startLearn(id, () => {
      setMappings(mapper.list());
      setLearning(null);
      mapper.save();
    });
  };

  // Mock learn (no hardware): user picks CC/Note + channel + number manually
  const mockBind = (id: ControlId, type: "cc" | "note", channel: number, number: number) => {
    mapper.set({ controlId: id, inputType: type, channel, number });
    setMappings(mapper.list());
    mapper.save();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h1 className="text-xl tracking-[0.3em]">CHORD·IT / SETTINGS</h1>
        <nav className="flex gap-4 text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground">MAIN</a>
          <a href="/settings" className="text-foreground">SETTINGS</a>
        </nav>
      </header>

      {/* Statusanzeige */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatusCard
          label="WEB MIDI API"
          status={handle ? "online" : "offline"}
          text={handle ? "Bereit" : (midiError ?? "Nicht verfügbar")}
        />
        <StatusCard
          label="OUTPUT GERÄT"
          status={outputId && handle ? "online" : "offline"}
          text={
            outputId && handle
              ? (handle.outputs.find((o) => o.id === outputId)?.name ?? outputId)
              : "Kein Gerät gewählt"
          }
        />
        <StatusCard
          label="BRIDGE"
          status={midiBridge.hasTarget() ? "online" : "offline"}
          text={midiBridge.hasTarget() ? "Aktiv" : "Inaktiv"}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="MOCK MODE (INPUT)">
          <button
            className={`px-3 py-1 border rounded text-xs ${s.mockMode ? "bg-pad-active text-background border-pad-active" : "border-border"}`}
            onClick={() => s.setMockMode(!s.mockMode)}
          >
            {s.mockMode ? "ON — QWERTY/UI only" : "OFF — Hardware Input"}
          </button>
          <div className="text-[10px] text-muted-foreground">
            Beeinflusst nur den Input. MIDI Output kannst du jederzeit unten wählen.
          </div>
        </Field>
        <Field label="BPM">
          <input
            type="number"
            min={40}
            max={240}
            value={s.performanceParams.bpm}
            onChange={(e) => s.setPerformanceParams({ bpm: Number(e.target.value) })}
            className="bg-card border border-border px-2 py-1 rounded w-24"
          />
        </Field>
        <Field label="SPLIT KEY">
          <input
            type="number"
            min={0}
            max={127}
            value={s.splitKey}
            onChange={(e) => s.setSplitKey(Number(e.target.value))}
            className="bg-card border border-border px-2 py-1 rounded w-24"
          />
        </Field>
        <Field label="OCTAVE BASE">
          <input
            type="number"
            min={0}
            max={127}
            value={s.octaveBase}
            onChange={(e) => s.setOctaveBase(Number(e.target.value))}
            className="bg-card border border-border px-2 py-1 rounded w-24"
          />
        </Field>

        <Field label="MIDI INPUT">
          {handle ? (
            <select
              className="bg-card border border-border px-2 py-1 rounded"
              value={inputId}
              onChange={(e) => {
                setInputId(e.target.value);
                handle.selectInput(e.target.value || null);
                s.setMidiStatus(!!e.target.value, s.midiOutputConnected);
              }}
            >
              <option value="">— None —</option>
              {handle.inputs.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-muted-foreground">
              {midiError ?? "Initialisiere…"}
            </div>
          )}
        </Field>
        <Field label="MIDI OUTPUT">
          {handle ? (
            <select
              className="bg-card border border-border px-2 py-1 rounded"
              value={outputId}
              onChange={(e) => {
                const id = e.target.value;
                setOutputId(id);
                handle.selectOutput(id || null);
                midiBridge.setTarget(id ? handle.midiOut : null);
                s.setMidiStatus(s.midiInputConnected, !!id);
              }}
            >
              <option value="">— None (silent) —</option>
              {handle.outputs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-muted-foreground">
              {midiError ?? "Initialisiere…"}
            </div>
          )}
        </Field>
      </section>

      {midiError && (
        <div className="text-xs text-destructive border border-destructive/40 rounded p-2">
          {midiError}
        </div>
      )}

      <section className="border border-border rounded-md">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="tracking-widest text-sm">MIDI MAPPINGS</div>
          <div className="flex gap-2">
            <button
              className="text-xs border border-border rounded px-2 py-1 hover:bg-accent"
              onClick={() => {
                mapper.reset();
                setMappings([]);
                mapper.save();
              }}
            >
              RESET ALL
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="text-left p-2">CONTROL</th>
              <th className="text-left p-2">TYPE</th>
              <th className="text-left p-2">CH</th>
              <th className="text-left p-2">#</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {ALL_CONTROL_IDS.map((id) => {
              const m = mappings.find((x) => x.controlId === id);
              return (
                <tr key={id} className="border-t border-border">
                  <td className="p-2 text-xs tracking-widest">{id}</td>
                  <td className="p-2">{m?.inputType ?? "—"}</td>
                  <td className="p-2">{m?.channel ?? "—"}</td>
                  <td className="p-2">{m?.number ?? "—"}</td>
                  <td className="p-2 text-right">
                    <div className="inline-flex gap-2">
                      {handle ? (
                        <button
                          className={`text-xs px-2 py-1 rounded border ${learning === id ? "bg-pad-active text-background border-pad-active" : "border-border hover:bg-accent"}`}
                          onClick={() => startLearn(id)}
                        >
                          {learning === id ? "LEARNING…" : "LEARN"}
                        </button>
                      ) : (
                        <button
                          className="text-xs px-2 py-1 rounded border border-border hover:bg-accent"
                          onClick={() => {
                            const t = prompt("Type cc or note", m?.inputType ?? "cc");
                            if (t !== "cc" && t !== "note") return;
                            const ch = Number(prompt("Channel 0-15", String(m?.channel ?? 0)));
                            const num = Number(prompt("Number 0-127", String(m?.number ?? 0)));
                            if (Number.isFinite(ch) && Number.isFinite(num)) {
                              mockBind(id, t, ch, num);
                            }
                          }}
                        >
                          BIND
                        </button>
                      )}
                      {m && (
                        <button
                          className="text-xs px-2 py-1 rounded border border-border hover:bg-accent"
                          onClick={() => {
                            mapper.clear(id);
                            setMappings(mapper.list());
                            mapper.save();
                          }}
                        >
                          CLEAR
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-md p-3 bg-card flex flex-col gap-2">
      <div className="text-xs text-muted-foreground tracking-widest">{label}</div>
      {children}
    </div>
  );
}

function StatusCard({ label, status, text }: { label: string; status: "online" | "offline"; text: string }) {
  return (
    <div className="border border-border rounded-md p-3 bg-card flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${status === "online" ? "bg-emerald-500" : "bg-rose-500"}`} />
      <div>
        <div className="text-[10px] text-muted-foreground tracking-widest">{label}</div>
        <div className="text-sm font-medium">{text}</div>
      </div>
    </div>
  );
}
