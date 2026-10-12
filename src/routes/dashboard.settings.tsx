import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/agrisense/BrandMark";
import { useHistory, clearRecords } from "@/lib/history-store";
import { API } from "@/lib/agrisense-api";
import { MIN_MS } from "@/lib/detection-store";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AgriSense AI" },
      { name: "description", content: "Manage local prediction storage and view AgriSense AI service configuration." },
      { property: "og:title", content: "Settings — AgriSense AI" },
      { property: "og:description", content: "Manage AgriSense AI storage and configuration." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { records } = useHistory();
  const [usage, setUsage] = useState<string | null>(null);
  useEffect(() => {
    void navigator.storage?.estimate?.().then((e) => e.usage !== undefined && e.quota && setUsage(`${(e.usage / 1048576).toFixed(1)} MB used of ~${(e.quota / 1048576).toFixed(0)} MB available`));
  }, [records.length]);
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Settings" />
      <section className="surface rounded-2xl p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><HardDrive className="h-5 w-5 text-primary" /> Local storage</h2>
        <p className="mt-2 text-sm text-muted-foreground">{records.length} predictions saved in this browser. {usage ?? ""}</p>
        <p className="mt-1 text-sm text-muted-foreground">History lives only on this device and browser — it is not synced to an account.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline" className="mt-4 text-destructive" disabled={!records.length}><Trash2 /> Clear all history</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Clear all history?</AlertDialogTitle><AlertDialogDescription>This permanently deletes every saved prediction.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void clearRecords()}>Delete all</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
      <section className="surface rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Analysis pipeline</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Analysis view is shown for at least {MIN_MS / 1000} seconds; model calls are never delayed.</li>
          <li>Crop Identifier always runs first; only the matching disease model is called.</li>
          {Object.values(API).map((a) => <li key={a.name}><span className="text-foreground">{a.name}:</span> <span className="font-mono text-xs">{a.base}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
