import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PianoKeyboard } from "@/ui/PianoKeyboard";
import { midiActivity } from "@/midi/midiActivity";

/**
 * 16 · React Testing Library smoke test.
 * Confirms the UI layer renders without crashing and reflects live MIDI
 * activity from the midiActivity bus (which is what the Main / Settings
 * screens use to highlight pressed and outgoing notes).
 */
describe("UI · PianoKeyboard (RTL smoke)", () => {
  it("renders without crashing", () => {
    const { container, getByText } = render(<PianoKeyboard startNote={48} endNote={72} />);
    expect(container.firstChild).toBeTruthy();
    expect(getByText("PIANO MONITOR")).toBeTruthy();
  });

  it("renders white-key elements with note titles", () => {
    const { container } = render(<PianoKeyboard startNote={48} endNote={60} />);
    const titled = container.querySelectorAll('[title^="MIDI "]');
    // 8 white keys from C3..C4
    expect(titled.length).toBeGreaterThanOrEqual(8);
  });

  it("reacts to midiActivity bus updates", () => {
    midiActivity.clear();
    const { container } = render(<PianoKeyboard startNote={48} endNote={72} />);
    midiActivity.noteOn("in", 60);
    // useEffect subscription is synchronous; React 19 flushes the setState
    // before the next assertion in act-less render.
    const highlighted = container.querySelectorAll(
      '[class*="bg-sky-500"], [class*="bg-amber-500"], [class*="bg-emerald-500"]',
    );
    expect(highlighted.length).toBeGreaterThan(0);
    midiActivity.clear();
  });
});
