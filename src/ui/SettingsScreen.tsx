import { useEffect, useMemo, useState } from "react";
import { useChordIT } from "@/app/useChordIT";
import { useChorditStore, type State } from "@/app/store";
import { MidiMapper } from "@/midi/midiMapper";
import { ALL_CONTROL_IDS, type ControlId, type MidiMapping } from "@/midi/midiTypes";
import { type WebMidiHandle } from "@/midi/webMidi";
import { midiBridge } from "@/midi/midiBridge";
import { midiManager } from "@/midi/midiManager";
import { pushAllLeds } from "@/midi/microKontrolLedSync";
import { nativeModeInRequestSysex } from "@/midi/microKontrolLeds";
import { PianoKeyboard } from "@/ui/PianoKeyboard";
import { MappingDiagram } from "@/ui/MappingDiagram";

type SavedMidiConfig = {
  version: 1;
  exportedAt: string;
  midiMappings: MidiMapping[];
  midiInputIds: string[];
  midiOutputId: string;
  mockMode: boolean;
  selectedChordType: State["selectedChordType"];
  activeExtensions: State["activeExtensions"];
  performanceMode: State["performanceMode"];
  performanceParams: State["performanceParams"];
  voicingMode: State["voicingMode"];
  splitKey: number;
  octaveBase: number;
  keyModeEnabled: boolean;
  selectedKey: State["selectedKey"];
  loopLength: number;
};

function isValidMapping(value: unknown): value is MidiMapping {
  if (!value || typeof value !== "object") return false;
  const m = value as Partial<MidiMapping>;
  return (
    typeof m.controlId === "string" &&
    ALL_CONTROL_IDS.includes(m.controlId as ControlId) &&
    (m.inputType === "cc" || m.inputType === "note") &&
    typeof m.channel === "number" &&
    m.channel >= 0 &&
    m.channel <= 15 &&
    typeof m.number === "number" &&
    m.number >= 0 &&
    m.number <= 127
  );
}

function isMicroKontrolPortA(name: string) {
  return /microkontrol/i.test(name) && /port\s*a/i.test(name);
}

function isMicroKontrol(name: string) {
  return /microkontrol/i.test(name);
}

export function SettingsScreen() {
  useChordIT({ hardwareInput: true });
  const s = useChorditStore();
  const mapper = useMemo(() => {
    return new MidiMapper(useChorditStore.getState().midiMappings);
  }, []);
  const [mappings, setMappings] = useState<MidiMapping[]>(mapper.list());
  const [learning, setLearning] = useState<ControlId | null>(null);
  const [handle, setHandle] = useState<WebMidiHandle | null>(null);
  const [inputIds, setInputIds] = useState<string[]>(
    s.midiInputIds.length > 0 ? s.midiInputIds : s.midiInputId ? [s.midiInputId] : [],
  );
  const [outputId, setOutputId] = useState<string>(s.midiOutputId);
  const [ledOutputId, setLedOutputId] = useState<string>("");
  const [midiError, setMidiError] = useState<string | null>(null);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  useEffect(() => {
    s.setMidiMappings(mappings);
  }, [mappings]);

  useEffect(() => {
    const loaded = mapper.load();
    if (loaded.length > 0) {
      setMappings(mapper.list());
      s.setMidiMappings(mapper.list());
    } else if (s.midiMappings.length > 0) {
      s.midiMappings.forEach((mapping) => mapper.set(mapping));
      mapper.save();
      setMappings(mapper.list());
    }
    // Load browser-only mapping storage after mount to keep SSR/client markup identical.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapper]);

  // Detect iframe AFTER mount to avoid SSR/CSR hydration mismatch.
  const [inIframe, setInIframe] = useState(false);
  const [bridgeActive, setBridgeActive] = useState(midiBridge.hasTarget());
  const [bridgeTargetName, setBridgeTargetName] = useState(midiBridge.getTargetName());
  useEffect(() => {
    setInIframe(window.self !== window.top);
    return midiBridge.onTargetChange((name) => {
      setBridgeActive(midiBridge.hasTarget());
      setBridgeTargetName(name);
    });
  }, []);

  const initMidi = () => {
    setMidiError(null);
    if (typeof navigator === "undefined" || !("requestMIDIAccess" in navigator)) {
      setMidiError("Web MIDI API wird in diesem Browser nicht unterstützt (nutze Chrome/Edge/Opera).");
      return;
    }
    midiManager
      .init()
      .then((h) => {
        if (!h) {
          setMidiError("Web MIDI konnte nicht initialisiert werden.");
          return;
        }
        setMidiError(
          h.inputs.length === 0 && h.outputs.length === 0
            ? "Web MIDI verbunden, aber keine Geräte gefunden. Auf macOS: IAC Driver im Audio-MIDI-Setup aktivieren. Auf Windows: loopMIDI installieren."
            : null,
        );
      })
      .catch((err) => {
        setMidiError(
          inIframe
            ? `MIDI im Preview-Iframe blockiert (${err?.message ?? err}). Öffne die App in einem neuen Tab.`
            : `MIDI-Zugriff verweigert: ${err?.message ?? err}`,
        );
      });
  };

  // Init Web MIDI via the global singleton; subscribe to handle changes so
  // the UI updates when init resolves (or fails) later.
  useEffect(() => {
    initMidi();
    const unsub = midiManager.onHandle((h) => setHandle(h));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-reconnect last-used devices once handle is ready, and forward
  // incoming messages to the mapper's learn flow. Note: incoming notes are
  // already mirrored into midiActivity by midiManager (global), so the piano
  // monitor lights up on every screen.
  useEffect(() => {
    if (!handle) return;
    const savedIds =
      s.midiInputIds.length > 0 ? s.midiInputIds : s.midiInputId ? [s.midiInputId] : [];
    const validIds = savedIds.filter((id) => handle.inputs.some((i) => i.id === id));
    if (validIds.length > 0) {
      midiManager.selectInputs(validIds);
      setInputIds(validIds);
      s.setMidiStatus(true, s.midiOutputConnected);
    }
    if (s.midiOutputId && handle.outputs.some((o) => o.id === s.midiOutputId)) {
      midiManager.selectOutput(s.midiOutputId);
      const outputName = handle.outputs.find((o) => o.id === s.midiOutputId)?.name ?? s.midiOutputId;
      midiBridge.setTarget(handle.midiOut, outputName);
      setOutputId(s.midiOutputId);
      setBridgeActive(true);
      s.setMidiStatus(s.midiInputConnected, true);
    }
    const ledOutput = handle.outputs.find((o) => isMicroKontrolPortA(o.name)) ?? null;
    if (ledOutput) {
      handle.selectSysExOutput(ledOutput.id);
      setLedOutputId(ledOutput.id);
      midiBridge.sendSysEx(nativeModeInRequestSysex(0));
      pushAllLeds(0);
    }
    const unsub = midiManager.subscribe((msg) => {
      const { learned } = mapper.handle(msg);
      if (learned) {
        setMappings(mapper.list());
        setLearning(null);
        mapper.save();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const exportConfig = () => {
    const state = useChorditStore.getState();
    const config: SavedMidiConfig = {
      version: 1,
      exportedAt: new Date().toISOString(),
      midiMappings: mapper.list(),
      midiInputIds: inputIds,
      midiOutputId: outputId,
      mockMode: state.mockMode,
      selectedChordType: state.selectedChordType,
      activeExtensions: state.activeExtensions,
      performanceMode: state.performanceMode,
      performanceParams: state.performanceParams,
      voicingMode: state.voicingMode,
      splitKey: state.splitKey,
      octaveBase: state.octaveBase,
      keyModeEnabled: state.keyModeEnabled,
      selectedKey: state.selectedKey,
      loopLength: state.loopLength,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chordit-midi-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setConfigMessage("Konfig gespeichert/exportiert.");
  };

  const importConfig = async (file: File | null) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<SavedMidiConfig>;
      const nextMappings = Array.isArray(parsed.midiMappings)
        ? parsed.midiMappings.filter(isValidMapping)
        : [];
      mapper.reset();
      nextMappings.forEach((m) => mapper.set(m));
      mapper.save();
      setMappings(mapper.list());
      s.setMidiMappings(mapper.list());

      const nextInputIds = Array.isArray(parsed.midiInputIds)
        ? parsed.midiInputIds.filter((id): id is string => typeof id === "string")
        : [];
      setInputIds(nextInputIds);
      s.setMidiInputIds(nextInputIds);
      if (handle) handle.selectInputs(nextInputIds);

      const nextOutputId = typeof parsed.midiOutputId === "string" ? parsed.midiOutputId : "";
      setOutputId(nextOutputId);
      s.setMidiDeviceIds(nextInputIds[0] ?? "", nextOutputId);
      if (handle) {
        handle.selectOutput(nextOutputId || null);
        const outputName = handle.outputs.find((o) => o.id === nextOutputId)?.name ?? nextOutputId;
        midiBridge.setTarget(nextOutputId ? handle.midiOut : null, outputName);
        setBridgeActive(!!nextOutputId);
      }

      if (typeof parsed.mockMode === "boolean") s.setMockMode(parsed.mockMode);
      if (parsed.selectedChordType) s.setChordType(parsed.selectedChordType);
      if (Array.isArray(parsed.activeExtensions)) s.setExtensions(parsed.activeExtensions);
      if (parsed.performanceMode) s.setPerformanceMode(parsed.performanceMode);
      if (parsed.performanceParams) s.setPerformanceParams(parsed.performanceParams);
      if (parsed.voicingMode) s.setVoicingMode(parsed.voicingMode);
      if (typeof parsed.splitKey === "number") s.setSplitKey(parsed.splitKey);
      if (typeof parsed.octaveBase === "number") s.setOctaveBase(parsed.octaveBase);
      if (typeof parsed.keyModeEnabled === "boolean" && parsed.keyModeEnabled !== s.keyModeEnabled) s.toggleKeyMode();
      if (parsed.selectedKey) s.setSelectedKey(parsed.selectedKey);
      if (typeof parsed.loopLength === "number") s.setLoopLength(parsed.loopLength);
      s.setMidiStatus(nextInputIds.length > 0, !!nextOutputId);
      setConfigMessage(`${nextMappings.length} Mappings geladen.`);
    } catch (err) {
      setConfigMessage(`Import fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    }
  };




  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h1 className="text-xl tracking-[0.3em]">CHORD·IT / SETTINGS</h1>
        <nav className="flex gap-4 text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground">MAIN</a>
          <a href="/settings" className="text-foreground">SETTINGS</a>
          <a href="/tests" className="hover:text-foreground">TESTS</a>
        </nav>
      </header>

      {/* Iframe / Web MIDI Warnung */}
      {!handle && (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-md p-3 text-xs flex flex-col gap-2">
          <div className="font-bold tracking-widest text-amber-400">⚠ WEB MIDI NICHT VERFÜGBAR</div>
          <div className="text-muted-foreground">
            {midiError ?? "Initialisiere Web MIDI…"}
          </div>
          {inIframe && (
            <div className="text-muted-foreground">
              Du bist im Lovable-Preview-Iframe. Web MIDI ist hier per Permissions-Policy blockiert.
              Öffne die App in einem eigenen Tab, dann erscheinen deine MIDI-Outs (IAC, loopMIDI, USB-Controller…).
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {inIframe && (
              <button
                className="px-3 py-1 border border-amber-400/60 rounded hover:bg-amber-500/20"
                onClick={() => window.open(window.location.href, "_blank", "noopener")}
              >
                IN NEUEM TAB ÖFFNEN
              </button>
            )}
            <button
              className="px-3 py-1 border border-border rounded hover:bg-accent"
              onClick={initMidi}
            >
              ERNEUT VERSUCHEN
            </button>
          </div>
        </div>
      )}



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
          status={bridgeActive ? "online" : "offline"}
          text={bridgeActive ? `Aktiv → ${bridgeTargetName || "Output"}` : "Inaktiv"}
        />
      </section>

      <PianoKeyboard />



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

        <Field label="MIDI INPUTS (mehrfach wählbar)">
          {handle ? (
            handle.inputs.length === 0 ? (
              <div className="text-xs text-muted-foreground">Keine Eingänge gefunden.</div>
            ) : (
              <div className="flex flex-col gap-1 max-h-40 overflow-auto">
                {handle.inputs.map((i) => {
                  const checked = inputIds.includes(i.id);
                  return (
                    <label key={i.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent/40 px-1 py-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...inputIds, i.id]
                            : inputIds.filter((x) => x !== i.id);
                          setInputIds(next);
                          handle.selectInputs(next);
                          s.setMidiInputIds(next);
                          s.setMidiStatus(next.length > 0, s.midiOutputConnected);
                        }}
                      />
                      <span className="truncate">{i.name}</span>
                    </label>
                  );
                })}
                <div className="text-[10px] text-muted-foreground mt-1">
                  Tipp microKONTROL: KEYBOARD- und CTRL-Port beide aktivieren.
                </div>
              </div>
            )
          ) : (
            <div className="text-xs text-muted-foreground">
              {midiError ?? "Initialisiere…"}
            </div>
          )}
        </Field>

        <Field label="MIDI OUTPUT">
          {handle ? (
            <div className="flex flex-col gap-2">
              <select
                className="bg-card border border-border px-2 py-1 rounded"
                value={outputId}
                onChange={(e) => {
                  const id = e.target.value;
                  setOutputId(id);
                  handle.selectOutput(id || null);
                  const outputName = handle.outputs.find((o) => o.id === id)?.name ?? id;
                  midiBridge.setTarget(id ? handle.midiOut : null, outputName);
                  setBridgeActive(!!id);
                  s.setMidiStatus(s.midiInputConnected, !!id);
                  s.setMidiDeviceIds(s.midiInputId, id);
                }}
              >
                <option value="">— None (silent) —</option>
                {handle.outputs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              <button
                className="text-[10px] px-2 py-1 border border-border rounded hover:bg-accent self-start"
                disabled={!outputId}
                onClick={() => {
                  // Send a C4 note-on / note-off via the bridge so the user
                  // can confirm routing is live without playing a chord.
                  midiBridge.send({ type: "noteOn", note: 60, velocity: 100, channel: 0 });
                  setTimeout(() => {
                    midiBridge.send({ type: "noteOff", note: 60, velocity: 0, channel: 0 });
                  }, 300);
                }}
              >
                TEST NOTE (C4)
              </button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              {midiError ?? "Initialisiere…"}
            </div>
          )}
        </Field>

        <Field label="microKONTROL LED / SYS EX OUTPUT">
          {handle ? (
            <div className="flex flex-col gap-2">
              <select
                className="bg-card border border-border px-2 py-1 rounded"
                value={ledOutputId}
                onChange={(e) => {
                  const id = e.target.value;
                  setLedOutputId(id);
                  handle.selectSysExOutput(id || null);
                  if (id) {
                    midiBridge.sendSysEx(nativeModeInRequestSysex(0));
                    pushAllLeds(0);
                  }
                }}
              >
                <option value="">— Auto/None —</option>
                {handle.outputs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {isMicroKontrol(o.name) ? "★ " : ""}{o.name}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-muted-foreground">
                Für Pad-LEDs muss hier microKONTROL PORT A stehen. Dein normaler MIDI-Output kann trotzdem ROLI bleiben.
              </div>
              <button
                className="text-[10px] px-2 py-1 border border-border rounded hover:bg-accent self-start"
                disabled={!ledOutputId}
                onClick={() => {
                  midiBridge.sendSysEx(nativeModeInRequestSysex(0));
                  pushAllLeds(0);
                }}
              >
                NATIVE MODE + LED SNAPSHOT SENDEN
              </button>
            </div>
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

      <section className="border border-border rounded-md p-3 bg-card flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="tracking-widest text-sm">MIDI CONFIG BACKUP</div>
            <div className="text-[10px] text-muted-foreground">
              Sichert Mappings, Inputs, Output und Performance-Werte als JSON-Datei.
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              className="text-xs border border-border rounded px-2 py-1 hover:bg-accent"
              onClick={exportConfig}
            >
              SAVE / EXPORT
            </button>
            <label className="text-xs border border-border rounded px-2 py-1 hover:bg-accent cursor-pointer">
              LOAD / IMPORT
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  void importConfig(e.target.files?.[0] ?? null);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>
        {configMessage && <div className="text-xs text-muted-foreground">{configMessage}</div>}
      </section>

      <MappingDiagram
        mappings={mappings}
        learning={learning}
        onClick={(id) => {
          if (handle) startLearn(id as ControlId);
        }}
      />

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
