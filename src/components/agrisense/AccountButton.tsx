import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function AccountButton() {
  const { user, ready } = useAccount();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!ready) return <Button size="sm" variant="outline" disabled>Loading…</Button>;
  if (!user) return <Button asChild size="sm" variant="outline"><Link to="/auth">Sign in</Link></Button>;
  async function signOut() {
    setBusy(true); setError("");
    await client.cancelQueries();
    client.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setError(error.message); setBusy(false); return; }
    await navigate({ to: "/auth", replace: true });
    setBusy(false);
  }
  return <div className="flex items-center gap-2"><span className="hidden max-w-44 truncate text-xs text-muted-foreground sm:block" title={user.email}>{user.email}</span><Button size="sm" variant="outline" disabled={busy} onClick={() => void signOut()}><LogOut className="h-4 w-4" />Sign out</Button>{error && <span role="alert" className="text-xs text-destructive">{error}</span>}</div>;
}