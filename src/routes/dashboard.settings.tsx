import { createFileRoute } from "@tanstack/react-router";
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
      { title: "Settings — Agri Pulse" },
      { name: "description", content: "Manage private account prediction storage and view Agri Pulse service configuration." },
      { property: "og:title", content: "Settings — Agri Pulse" },
      { property: "og:description", content: "Manage Agri Pulse storage and configuration." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { records, storageError } = useHistory();
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Settings" />
      <section className="surface rounded-2xl p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><HardDrive className="h-5 w-5 text-primary" /> Account storage</h2>
        <p className="mt-2 text-sm text-muted-foreground">{records.length} disease predictions saved to your account.</p>
        <p className="mt-1 text-sm text-muted-foreground">Your history is private and available across devices when you sign in. Growth predictions are saved on the Plant Growth page.</p>
        {storageError && <p role="alert" className="mt-2 text-sm text-destructive">{storageError}</p>}
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline" className="mt-4 text-destructive" disabled={!records.length}><Trash2 /> Clear all history</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Clear disease history?</AlertDialogTitle><AlertDialogDescription>This permanently deletes your saved disease predictions. Growth results are not affected.</AlertDialogDescription></AlertDialogHeader>
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
