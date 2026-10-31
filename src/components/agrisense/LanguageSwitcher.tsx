import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/site-language";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" aria-label="Site language" className="shrink-0 gap-1.5"><Languages className="h-4 w-4" /><span lang={language}>{language === "ur" ? "اردو" : "English"}</span></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" dir="ltr">
      <DropdownMenuRadioGroup value={language} onValueChange={(value) => { if (value === "en" || value === "ur") setLanguage(value); }}>
        <DropdownMenuRadioItem value="en" lang="en">English</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="ur" lang="ur">اردو</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}