# microKONTROL — LED-Patch für ChordIT

Ziel: Die unteren 2 Pad-Reihen (Pads 9–16) deines Korg microKONTROL sollen
**den Live-Zustand** der ChordIT-Buttons widerspiegeln:

- Pad 9–12  →  Akkordtyp **Dim · Min · Maj · Sus**  (genau eins leuchtet)
- Pad 13–16 →  Extensions **6 · m7 · M7 · 9**       (Toggle, mehrere möglich)

Quelle: *microKONTROL MIDI Implementation*, Rev 1.0 (2003-07-18),
Abschnitt 3 (15)/(16) „Native KORG mode In/Out" und 3-2 (1) „Display LEDs".

---

## Warum das Problem auftritt

Im normalen **MIDI-Modus** verwaltet der microKONTROL die Pad-LEDs **lokal**
(Standard-Setting „PAD Illumination", Pad 12 in Setting Mode). In diesem Modus
ignoriert der Controller die LED-SysEx des Hosts komplett — deshalb bleiben
deine Pads dauerhaft an / aus und reagieren nur auf den Druck selbst.

Die Display-LED-SysEx (`F0 42 4g 6E 00 01 …`) wirkt **ausschließlich im
Native KORG Mode** (siehe MIDI-Implementation, Fußnote *5: *„Received when in
native KORG mode"*).

---

## Wichtige Korrektur gegenüber älteren Versionen dieser Doku

> Es gibt am Gerät **keinen** Menüeintrag „Common → Mode = Native".
> Der Native KORG Mode wird **nicht** über das SETTING-Menü umgeschaltet,
> sondern **vom Host per SysEx angefordert**:
>
> ```
> F0 42 4g 6E 00 00 01 F7        ← Native KORG Mode In Request (Host → Gerät)
> F0 42 4g 6E 00 00 00 F7        ← Native KORG Mode Out Request (zurück in MIDI-Mode)
> ```
>
> Das Gerät antwortet mit `F0 42 4g 6E 00 40 00 03 F7` (= „bin jetzt im
> Native Mode") und gibt die Kontrolle der LEDs an den Host ab.

Das Setting-Menü deines microKONTROL (siehe das Screenshot-Foto aus der
Bedienungsanleitung S. „Setting mode") besteht aus 16 Seiten:

- Pad 1–8 → Scene-Parameter (Encoder/Slider/Pad/Pedal/Joystick/USB-Port-Assign)
- Pad 9–16 → Global-Parameter (Keyboard-/PAD-Velocity, LCD-Backlight,
  **PAD Illumination** (Pad 12), Transpose, **Global MIDI-Channel** (Pad 14),
  Polarity, System)

Ein „Native/MIDI-Mode"-Schalter existiert dort bewusst nicht — er ist
ausschließlich Host-getrieben.

---

## Schritt 1 — Nichts am Gerät umstellen

Lass den microKONTROL in seinem Auslieferungs-MIDI-Mode. Prüfe nur:

- **SETTING → Pad 14 (Global MIDI Channel)** → ggf. auf `1` (= `g = 0`) setzen.
  ChordIT geht standardmäßig von Kanal 1 aus.
- **SETTING → Pad 12 (PAD Illumination)** kannst du auf einem beliebigen Wert
  lassen — sobald der Host Native-Mode anfordert, übernimmt er die Pads sowieso.

Mit `EXIT` das Setting-Menü verlassen (Werte werden automatisch gespeichert).

---

## Schritt 2 — SysEx im Browser erlauben

> **Wichtig — Chrome zeigt den Prompt nur EINMAL pro Origin.** Wenn du
> ChordIT schon einmal geöffnet hast und die Berechtigung damals erteilt
> (oder abgelehnt) hast, kommt **nie wieder ein Dialog**. Chrome merkt sich
> die Entscheidung dauerhaft als Site-Setting.

### So prüfst du den aktuellen Stand (Chrome)

Klicke links neben der URL auf das **Schloss-Symbol** → es öffnet sich ein
Popover mit allen Berechtigungen dieser Seite. Suche dort den Eintrag:

**„MIDI-Gerätesteuerung & -Neuprogrammierung"**

- Steht dort **„Zulassen"** (Toggle blau/an) → ✅ alles korrekt, SysEx ist
  erteilt, ChordIT kann die Pad-LEDs ansteuern. **Du musst nichts tun.**
- Steht dort **„Blockieren"** oder der Eintrag fehlt → Toggle auf
  *Zulassen* schalten **und einmal die Seite neu laden** (F5).

> Hinweis zur Chrome-Terminologie: „MIDI-Gerätesteuerung & -Neuprogrammierung"
> ist Chromes deutsche Übersetzung für **SysEx-MIDI-Zugriff**. Einen separaten
> Eintrag nur „MIDI" (ohne SysEx) gibt es in aktuellen Chrome-Versionen nicht
> mehr — beides ist in dieser einen Berechtigung zusammengefasst.

### Falls du den Prompt nie gesehen hast

Das ist **normal** und meistens kein Fehler. Drei mögliche Ursachen:

1. **Du hast schon mal „Zulassen" geklickt** (z. B. bei einem früheren Besuch)
   → Chrome zeigt den Dialog nicht erneut. Prüfe per Schloss-Symbol wie oben.
2. **Du hast schon mal „Blockieren" geklickt** → Chrome zeigt den Dialog
   ebenfalls nicht erneut, blockiert aber stumm. Im Schloss-Popover auf
   *Zulassen* umstellen und neu laden.
3. **Die Seite läuft in einem iFrame ohne MIDI-Permission-Policy** (z. B. in
   manchen Editor-Previews). Öffne ChordIT in einem eigenen Tab über die
   Preview-URL — dort fragt Chrome korrekt nach.

### Firefox / Safari

- Firefox: `about:preferences#privacy` → Berechtigungen → MIDI.
- Safari: Web MIDI mit SysEx ist erst ab Safari 18 (macOS 15) verfügbar;
  vorher funktionieren die LEDs nicht — bitte Chrome oder Edge verwenden.

---

## Schritt 3 — microKONTROL als MIDI-Output in ChordIT wählen

Settings → MIDI Output → `microKONTROL 1 PORT A` (oder wie das Gerät bei dir heißt).

In dem Moment, in dem ChordIT den Output aktiviert, sendet es **automatisch**:

1. `F0 42 40 6E 00 00 01 F7` — Native KORG Mode In Request
2. 8 × `F0 42 40 6E 00 01 <ledNum> <state> F7` — Initial-Snapshot der Pads 9–16

Du erkennst es daran, dass alle 16 LEDs **kurz aus** gehen (Modus-Wechsel) und
dann nur die untere Hälfte gemäß ChordIT-State wieder anspringt.

---

## Schritt 4 — Pad-Mapping (nichts zu tun)

Hart verdrahtet auf die untere Pad-Hälfte:

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

> Pads 1–8 bleiben dunkel und sind frei. Sag Bescheid, dann mappe ich sie z. B.
> auf Pattern-Trigger oder Propose.

---

## Wie der Patch technisch arbeitet

Pro LED schickt ChordIT eine **9-Byte SysEx** (MIDI-Impl., Section 3-2 (1)):

```
F0 42 4g 6E 00 01 <ledNum> <state> F7
```

- `g` = globaler MIDI-Kanal (0..F)
- `ledNum` = `00..0F` → Pad 1..16
- `state` = `00` Off, `20` On, `40+t` OneShot, `60` Blink

Beispiel — Pad 11 (Maj) AN auf Kanal 1: `F0 42 40 6E 00 01 0A 20 F7`
Beispiel — Pad 11 (Maj) AUS:           `F0 42 40 6E 00 01 0A 00 F7`

ChordIT diffed den Zustand im Store und sendet nur LEDs, die sich tatsächlich
geändert haben — kein SysEx-Flood.

---

## Troubleshooting

| Symptom | Ursache / Fix |
|---|---|
| Pads bleiben dauerhaft an / reagieren nur lokal | Native-Mode-Request ist nicht angekommen → SysEx im Browser blockiert (Schritt 2) **oder** falscher Output gewählt (Schritt 3). |
| LEDs gehen kurz aus und kommen nicht wieder | Initial-Snapshot wurde gesendet aber alle Pads sind „off" — passiert wenn ChordIT-State leer ist. Drück einmal einen Chord-Pad in der App. |
| Falscher Pad leuchtet | Globaler Kanal ≠ 1 → SETTING → Pad 14 prüfen oder in ChordIT-Settings den Kanal anpassen. |
| Nach Stromaus alles wieder „normal" | Korrekt — Native-Mode wird **nicht** persistent gespeichert. ChordIT fordert ihn bei jedem Connect neu an. |
| Pads senden im Native-Mode keine Note-Events mehr | Stimmt — sie senden Pad-Output-SysEx (Function ID `45`). ChordIT routet das intern. Falls du das Gerät auch in anderer Software nutzt, dort vorher disconnecten oder ChordIT die „Mode Out"-SysEx senden lassen (Settings → MIDI → „Release microKONTROL"). |

---

## Rückbau

In ChordIT: Settings → MIDI Output auf „—" setzen → ChordIT sendet
`F0 42 40 6E 00 00 00 F7` (Native KORG Mode Out Request). Das Gerät ist sofort
wieder im normalen MIDI-Mode.

Alternativ: Gerät kurz aus- und einschalten — Native-Mode überlebt den
Power-Cycle ohnehin nicht.
