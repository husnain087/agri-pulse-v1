import { describe, expect, it } from "vitest";
import { parseVoiceCommand } from "./voice-commands";

describe("voice website controls", () => {
  it("opens the fertilizer page in English", () => {
    expect(parseVoiceCommand("Open fertilizer.")).toEqual({ type: "navigate", path: "/fertilizer-recommendation" });
  });
  it("opens the fertilizer page in Urdu", () => {
    expect(parseVoiceCommand("کھاد کھولو")).toEqual({ type: "navigate", path: "/fertilizer-recommendation" });
  });
  it("keeps private pages behind their existing routes", () => {
    expect(parseVoiceCommand("Open history")).toEqual({ type: "navigate", path: "/dashboard/history" });
  });
  it("changes the site to Urdu", () => {
    expect(parseVoiceCommand("Switch language to Urdu")).toEqual({ type: "language", language: "ur" });
  });
  it("drafts a spoken question without sending it", () => {
    expect(parseVoiceCommand("Ask assistant Why are my wheat leaves yellow?")).toEqual({ type: "assistant", open: true, draft: "Why are my wheat leaves yellow?" });
  });
  it("does not run destructive or unknown commands", () => {
    expect(parseVoiceCommand("Delete all history")).toBeNull();
    expect(parseVoiceCommand("Open https://example.com")).toBeNull();
    expect(parseVoiceCommand("Analyze orange")).toBeNull();
  });
  it("scrolls without selecting model actions", () => {
    expect(parseVoiceCommand("Scroll down")).toEqual({ type: "scroll", direction: "down" });
  });
});