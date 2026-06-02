# microKONTROL — LED-Patch für ChordIT

Ziel: Die unteren 2 Pad-Reihen (Pads 9–16) deines Korg microKONTROL sollen
**den Live-Zustand** der ChordIT-Buttons widerspiegeln:

- Pad 9–12  →  Akkordtyp **Dim · Min · Maj · Sus**  (genau eins leuchtet)
- Pad 13–16 →  Extensions **6 · m7 · M7 · 9**       (Toggle, mehrere möglich)

Quelle: *microKONTROL MIDI Implementation*, Rev 1.0 (2003-07-18),
Abschnitt 3-2 (1) „Native KORG mode Display LEDs".

---

## Warum das Problem auftritt

Im Standard-**MIDI-Modus** verwaltet der microKONTROL die Pad-LEDs **lokal**.
Per Default stehen die Pads auf `SW Mode = Toggle` — d. h. ein Druck schaltet
die LED um und der Host kann sie **nicht** von außen steuern. Deshalb bleiben
deine Pads dauerhaft an und gehen nur kurz aus, wenn du drückst.

Die SysEx-Befehle für LED-Steuerung (`F0 42 4g 6E 00 01 …`) funktionieren
**ausschließlich im *Native KORG Mode***. Sobald der Controller im Native Mode
läuft, ist der Host alleiniger Besitzer der LEDs — und ChordIT übernimmt.

---

## Schritt 1 — microKONTROL in Native KORG Mode versetzen

1. **SETTING** drücken (LED leuchtet).
2. Mit den `<`/`>`-Tastern den Parameter **„Common"** wählen.
3. Encoder 1 drehen, bis **„Mode = Native"** im Display steht.
4. **ENTER** drücken → Display zeigt „Sure?"
5. **ENTER** erneut drücken → Gerät startet kurz neu im Native KORG Mode.

> **Bleibend speichern**: SETTING ▸ „Write Global" ▸ ENTER (sonst geht der
> Modus beim Ausschalten verloren).

Nach dem Neustart sind **alle LEDs aus** — das ist korrekt. Der Host hat jetzt
die volle Kontrolle.

---

## Schritt 2 — Globalen MIDI-Kanal merken

Im Native Mode sendet der microKONTROL alle Events (Pad / Encoder / Slider)
**als SysEx auf seinem Global Channel** (Default: **Kanal 1 = `g=0`**).
ChordIT geht standardmäßig von `g=0` aus. Wenn dein Gerät auf einem anderen
Kanal steht: SETTING ▸ „MIDI Ch" ▸ ggf. auf `1` stellen.

---

## Schritt 3 — SysEx im Browser erlauben

Beim nächsten Öffnen von ChordIT fragt der Browser
**„Erlaubt die Seite, SysEx-Nachrichten zu senden?"** → **Zulassen**.
Ohne SysEx-Erlaubnis funktioniert die LED-Steuerung **nicht** (Web-MIDI-Spec).

Falls du das versehentlich abgelehnt hast:
- Chrome: Schloss-Symbol → „Website-Einstellungen" → MIDI auf *Zulassen*.
- Firefox: about:preferences#privacy → Berechtigungen → MIDI.

---

## Schritt 4 — Pad-Mapping in ChordIT (nichts zu tun)

Das Mapping ist hart verdrahtet auf die untere Pad-Hälfte:

| Pad | Funktion       | LED-Verhalten              |
|----:|----------------|----------------------------|
|  9  | Chord **Dim**  | leuchtet wenn aktiv        |
| 10  | Chord **Min**  | leuchtet wenn aktiv        |
| 11  | Chord **Maj**  | leuchtet wenn aktiv        |
| 12  | Chord **Sus**  | leuchtet wenn aktiv        |
| 13  | Ext **6**      | leuchtet wenn aktiviert    |
| 14  | Ext **m7**     | leuchtet wenn aktiviert    |
| 15  | Ext **M7**     | leuchtet wenn aktiviert    |
| 16  | Ext **9**      | leuchtet wenn aktiviert    |

> Pads 1–8 (obere Reihe) bleiben **dunkel** und sind frei für andere Funktionen
> (z. B. Pattern-Trigger, Loop, Propose-Button …).

---

## Wie der Patch arbeitet (technisch)

Pro LED schickt ChordIT eine **9-Byte SysEx**:

```
F0 42 4g 6E 00 01 <ledNum> <state> F7
```

- `g` = globaler MIDI-Kanal (0–F)
- `ledNum` = `00..0F` → Pad 1..16
- `state` = `00` Off, `20` On, `40+t` OneShot, `60` Blink

**Beispiel — Pad 11 (Maj) AN auf Kanal 1**:
```
F0 42 40 6E 00 01 0A 20 F7
```

**Beispiel — Pad 11 (Maj) AUS**:
```
F0 42 40 6E 00 01 0A 00 F7
```

ChordIT diffed bei jeder Zustandsänderung im Store, sendet also nur die
LEDs, die sich tatsächlich geändert haben — kein SysEx-Flood.

---

## Optional — Pads 1–8 ebenfalls vom Host steuern

Wenn du z. B. Pattern 1–8 auf der oberen Reihe darstellen willst:
ChordIT verwendet dieselbe SysEx, einfach `ledNum = 00..07` für Pads 1–8.
Sag Bescheid, dann erweitere ich das Mapping.

---

## Troubleshooting

| Symptom                          | Ursache / Fix |
|----------------------------------|---------------|
| Pads bleiben dauerhaft an        | Gerät ist noch im **MIDI-Modus** — Schritt 1 wiederholen. |
| LEDs reagieren gar nicht         | SysEx im Browser blockiert → Schritt 3. |
| Falscher Pad leuchtet            | Globaler Kanal ≠ 1 → SETTING → MIDI Ch prüfen. |
| Funktioniert nach Neustart nicht | „Write Global" wurde nicht ausgeführt — Schritt 1, letzter Hinweis. |
| Pads senden falsche Noten        | Im Native Mode senden Pads SysEx, **keine** Note-Events. Du musst die Pad→Chord-Mappings in *ChordIT → Settings → MIDI Learn* nach dem Moduswechsel **einmal neu lernen** (eine kommende ChordIT-Version wird Native-Pad-SysEx automatisch routen). |

---

## Rückbau

SETTING ▸ Common ▸ Encoder 1 → **„Mode = MIDI"** ▸ ENTER ▸ „Write Global".
Damit ist der Auslieferungszustand wieder hergestellt.
