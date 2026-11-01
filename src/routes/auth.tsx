import { useLanguage } from "@/lib/site-language";
import { LanguageSwitcher } from "@/components/agrisense/LanguageSwitcher";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAccount } from "@/lib/auth-context";
import { BrandMark } from "@/components/agrisense/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Sign in — Agri Pulse" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AuthPage,
});

function AuthPage() {
 const { t: tr } = useLanguage();
  const { user } = useAccount();
  const navigate = useNavigate();
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { if (user) void navigate({ to: "/dashboard", replace: true }); }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in. Please try again."); }
    finally { setBusy(false); }
  }

  async function google() {
    setBusy(true); setError("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
    } catch (e) { setError(e instanceof Error ? e.message : "Google sign-in failed. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-background">
    <header className="theme-night"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 flex-wrap px-5 py-5"><BrandMark /><div className="flex items-center gap-2"><LanguageSwitcher /><Button asChild variant="outline" size="sm"><Link to="/">{tr("Home")}</Link></Button></div></div></header>
    <main className="mx-auto max-w-md px-5 py-14">
      <div className="surface rounded-2xl p-7">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary"><Leaf /></span>
        <h1 className="mt-5 text-3xl font-bold">{tr(signup ? "Create your account" : "Welcome back")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tr("Sign in to keep your crop analyses and growth predictions private, saved, and available across devices.")}</p>
        <Button variant="outline" className="mt-6 w-full" disabled={busy} onClick={() => void google()}><svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.5ZM12 22c2.7 0 5-1 6.6-2.3l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2H3v2.6A10 10 0 0 0 12 22ZM6.3 14a6 6 0 0 1 0-4V7.4H3a10 10 0 0 0 0 9.2L6.3 14ZM12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9 5.4L6.3 10c.8-2.4 3.1-4.2 5.7-4.2Z" /></svg> {tr("Continue with Google")}</Button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{tr("or with email")}<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">{tr("Email address")}</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tr("you@example.com")} /></div>
          <div className="space-y-2"><Label htmlFor="password">{tr("Password")}</Label><Input id="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {tr(error && <p role="alert" className="text-sm text-destructive">{tr(error)}</p>)}
          {tr(notice && <p role="status" className="rounded-lg bg-accent p-3 text-sm">{tr(notice)}</p>)}
          <Button className="w-full bg-gradient-primary" disabled={busy} type="submit"><Mail />{tr(busy ? "Please wait…" : signup ? "Create account" : "Sign in")}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">{tr(signup ? "Already have an account?" : "New to Agri Pulse?")} <button className="font-medium text-primary hover:underline" onClick={() => { setSignup(!signup); setError(""); setNotice(""); }}>{tr(signup ? "Sign in" : "Create account")}</button></p>
      </div>
    </main>
  </div>;
}