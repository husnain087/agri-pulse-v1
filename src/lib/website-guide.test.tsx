import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepByStepGuide } from "@/components/agrisense/StepByStepGuide";
import { LanguageProvider } from "./site-language";
import { selectGuideVoice } from "./website-guide";

const audio = { cancel: vi.fn(), speak: vi.fn((_speech: unknown) => {}), pause: vi.fn(), resume: vi.fn(), getVoices: vi.fn(() => []), addEventListener: vi.fn(), removeEventListener: vi.fn() };
class Utterance {
  constructor(public text: string) {}
  lang = "";
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal("speechSynthesis", audio);
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("spoken website guide", () => {
  it("speaks on click, advances only when speech finishes, and cancels on close", () => {
    render(<LanguageProvider><StepByStepGuide /></LanguageProvider>);
    expect(audio.speak).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Step-by-Step Guide" }));
    expect(audio.speak).toHaveBeenCalledTimes(1);
    const first = audio.speak.mock.calls[0]?.[0] as unknown as Utterance;
    act(() => first.onend?.());
    expect(audio.speak).toHaveBeenCalledTimes(2);
    const second = audio.speak.mock.calls[1]?.[0] as unknown as Utterance;
    fireEvent.click(screen.getByRole("button", { name: /^Close$/ }));
    expect(audio.cancel).toHaveBeenCalled();
    expect(second.onend).toBeNull();
  });

  it("pauses, resumes and stops narration without navigating or submitting a model", () => {
    render(<LanguageProvider><StepByStepGuide /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Step-by-Step Guide" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause guide" }));
    expect(audio.pause).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Play guide" }));
    expect(audio.resume).toHaveBeenCalledTimes(1);
    const beforeStop = audio.cancel.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Stop guide" }));
    expect(audio.cancel.mock.calls.length).toBe(beforeStop + 1);
  });

  it("does not speak Urdu through an English-only voice", () => {
    localStorage.setItem("agri-pulse-language", "ur");
    render(<LanguageProvider><StepByStepGuide /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "مرحلہ وار رہنمائی" }));
    expect(audio.speak).not.toHaveBeenCalled();
  });

  it("selects an Urdu voice only when its language matches", () => {
    const english = { lang: "en-US" } as SpeechSynthesisVoice;
    const urdu = { lang: "ur-PK" } as SpeechSynthesisVoice;
    expect(selectGuideVoice([english, urdu], "ur")).toBe(urdu);
    expect(selectGuideVoice([english], "ur")).toBeUndefined();
  });
});