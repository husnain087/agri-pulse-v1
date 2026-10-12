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

export const Route = createFileRoute("/dashboard/history")({
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
  const { records, loaded } = useHistory();
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
      <PageHeader title="Prediction History" sub="Completed predictions stored in your account. Available across devices when you sign in." />
      {loaded && records.length === 0 ? (
        <EmptyState title="Your history is empty" body="Every completed analysis is saved here automatically." action={<Button asChild><Link to="/dashboard/detect"><ScanLine /> Start a detection</Link></Button>} />
      ) : (
        <div className="surface rounded-2xl p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search crop or disease" className="pl-9" aria-label="Search" /></div>
            <Select value={crop} onValueChange={setCrop}><SelectTrigger className="md:w-36" aria-label="Filter crop"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All crops</SelectItem><SelectItem value="Maize">Maize</SelectItem><SelectItem value="Wheat">Wheat</SelectItem></SelectContent></Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" aria-label="Filter by date" />
            <Select value={sort} onValueChange={setSort}><SelectTrigger className="md:w-40" aria-label="Sort"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">Newest first</SelectItem><SelectItem value="old">Oldest first</SelectItem></SelectContent></Select>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="text-destructive"><Trash2 /> Clear history</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Clear all history?</AlertDialogTitle><AlertDialogDescription>This permanently deletes all {records.length} saved predictions from your account.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void clearRecords()}>Delete all</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{list.length} of {records.length} records</p>
          <ul className="mt-2 divide-y">
            {list.map((r) => (
              <RecordRow key={r.id} r={r} onClick={() => void nav({ search: { id: r.id } })}
                trailing={<Button size="icon" variant="ghost" aria-label={`Delete ${r.disease} record`} onClick={() => void deleteRecord(r.id)}><Trash2 /></Button>} />
            ))}
          </ul>
        </div>
      )}
      <Dialog open={!!selected} onOpenChange={(o) => !o && void nav({ search: {} })}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader><DialogTitle>Prediction details</DialogTitle><DialogDescription>Saved result from {selected?.model}</DialogDescription></DialogHeader>
          {selected && <RecordView record={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
