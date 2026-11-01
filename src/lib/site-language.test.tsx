import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "./site-language";

function LanguageProbe() {
  const { language, setLanguage } = useLanguage();
  return <button onClick={() => setLanguage(language === "en" ? "ur" : "en")}>{language}</button>;
}
describe("site language preferences", () => {
  it("switches to Urdu right-to-left and remembers the selected site language", async () => {
    localStorage.clear();
    const view = render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "en" }));
    expect(document.documentElement.lang).toBe("ur");
    expect(document.documentElement.dir).toBe("rtl");
    expect(localStorage.getItem("agri-pulse-language")).toBe("ur");
    view.unmount();
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    await waitFor(() => expect(screen.getByRole("button", { name: "ur" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "ur" }));
    expect(document.documentElement.dir).toBe("ltr");
    expect(localStorage.getItem("agri-pulse-language")).toBe("en");
  });
});