import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import urdu from "./urdu.json";

export type SiteLanguage = "en" | "ur";
const dictionary: Record<string, string> = urdu;
export function translateText(text: string, language: SiteLanguage): string {
  if (language === "en") return text;
  const trimmed = text.trim();
  const translated = dictionary[trimmed];
  if (translated) return text.replace(trimmed, translated);
  // Translate individual labels in compound model summaries without changing values.
  return text.split(/( · | → |: |\n)/).map((part) => dictionary[part.trim()] ?? part).join("");
}
type LanguageContextValue = { language: SiteLanguage; setLanguage: (language: SiteLanguage) => void; t: <T>(value: T) => T };
const LanguageContext = createContext<LanguageContextValue>({ language: "en", setLanguage: () => {}, t: (value) => value });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<SiteLanguage>("en");
  useEffect(() => {
    try { if (localStorage.getItem("agri-pulse-language") === "ur") updateLanguage("ur"); } catch { /* Storage is optional. */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  }, [language]);
  const setLanguage = (next: SiteLanguage) => {
    updateLanguage(next);
    try { localStorage.setItem("agri-pulse-language", next); } catch { /* Keep working without storage. */ }
  };
  const t = <T,>(value: T): T => (typeof value === "string" ? translateText(value, language) : value) as T;
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);