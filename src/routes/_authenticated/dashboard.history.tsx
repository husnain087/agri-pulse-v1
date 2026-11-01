import { useLanguage } from "@/lib/site-language";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader, EmptyState } from "@/components/agrisense/BrandMark";
import { RecordRow } from "@/components/agrisense/RecentPredictions";
import { RecordView } from "@/components/agrisense/RecordView";
import { useHistory, deleteRecord, clearRecords } from "@/lib/history-store";
import { prettyLabel } from "@/lib/agrisense-api";

export const Route = createFileRoute("/_authenticated/dashboard/history")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s["id"] === "string" ? { id: s["id"] } : {}),
  head: () => ({
    meta: [
      { title: "Prediction History — Agri Pulse" },
      { name: "description", content: "Search, filter and review every crop prediction saved to your account." },
      { property: "og:title", content: "Prediction History — Agri Pulse" },
      { property: "og:description", content: "Search, filter and review saved crop predictions." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
 const { t: tr } = useLanguage();
  const { records, loaded, storageError } = useHistory();
  const { id } = Route.useSearch();
  const nav = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState("");
  const [crop, setCrop] = useState("all");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState("new");

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return records
      .filter((r) => crop === "all" || r.crop === crop)
      .filter((r) => !t || r.crop.toLowerCase().includes(t) || prettyLabel(r.disease).toLowerCase().includes(t) || r.disease.toLowerCase().includes(t))
      .filter((r) => {
        if (!date) return true;
        const d = new Date(r.createdAt);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return local === date;
      })
      .sort((a, b) => (sort === "new" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
  }, [records, q, crop, date, sort]);
  const selected = records.find((r) => r.id === id);

  return (
    <div className="animate-fade-up">
      <PageHeader title={tr("Prediction History")} sub={tr("Completed predictions stored in your account. Available across devices when you sign in.")} />
      {tr(storageError && <p role="alert" className="mb-4 rounded-xl bg-muted p-3 text-sm text-destructive">{tr(storageError)}</p>)}
      {tr(loaded && records.length === 0 ? (
        <EmptyState title={tr("Your history is empty")} body="Every completed analysis is saved here automatically." action={<Button asChild><Link to="/dashboard/detect"><ScanLine /> {tr("Start a detection")}</Link></Button>} />
      ) : (
        <div className="surface rounded-2xl p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Search crop or disease")} className="pl-9" aria-label={tr("Search")} /></div>
            <Select value={crop} onValueChange={setCrop}><SelectTrigger className="md:w-36" aria-label={tr("Filter crop")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{tr("All crops")}</SelectItem><SelectItem value="Maize">{tr("Maize")}</SelectItem><SelectItem value="Wheat">{tr("Wheat")}</SelectItem></SelectContent></Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" aria-label={tr("Filter by date")} />
            <Select value={sort} onValueChange={setSort}><SelectTrigger className="md:w-40" aria-label={tr("Sort")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">{tr("Newest first")}</SelectItem><SelectItem value="old">{tr("Oldest first")}</SelectItem></SelectContent></Select>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="text-destructive"><Trash2 /> {tr("Clear history")}</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{tr("Clear all history?")}</AlertDialogTitle><AlertDialogDescription>{tr("This permanently deletes all ")}{tr(records.length)} {tr("saved predictions from your account.")}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>{tr("Cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => void clearRecords()}>{tr("Delete all")}</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{tr(list.length)} {tr("of ")}{tr(records.length)} {tr("records")}</p>
          <ul className="mt-2 divide-y">
            {tr(list.map((r) => (
              <RecordRow key={r.id} r={r} onClick={() => void nav({ search: { id: r.id } })}
                trailing={<Button size="icon" variant="ghost" aria-label={tr(`Delete ${r.disease} record`)} onClick={() => void deleteRecord(r.id)}><Trash2 /></Button>} />
            )))}
          </ul>
        </div>
      ))}
      <Dialog open={!!selected} onOpenChange={(o) => !o && void nav({ search: {} })}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader><DialogTitle>{tr("Prediction details")}</DialogTitle><DialogDescription>{tr("Saved result from ")}{tr(selected?.model)}</DialogDescription></DialogHeader>
          {tr(selected && <RecordView record={selected} />)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
