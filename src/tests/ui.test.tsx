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
    const { container } = render(<PianoKeyboard startNote={48} endNote={72} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders an SVG with at least one <rect> per white key", () => {
    const { container } = render(<PianoKeyboard startNote={48} endNote={60} />);
    const rects = container.querySelectorAll("rect");
    // 8 white keys from C3..C4 + black-key rects
    expect(rects.length).toBeGreaterThanOrEqual(8);
  });

  it("reacts to midiActivity bus updates", () => {
    midiActivity.clear();
    const { container, rerender } = render(<PianoKeyboard startNote={48} endNote={72} />);
    midiActivity.noteOn("in", 60);
    rerender(<PianoKeyboard startNote={48} endNote={72} />);
    // After bus emit, at least one rect should carry a highlight class
    const highlighted = container.querySelectorAll('[class*="sky"], [class*="amber"], [class*="emerald"]');
    expect(highlighted.length).toBeGreaterThan(0);
    midiActivity.clear();
  });
});
