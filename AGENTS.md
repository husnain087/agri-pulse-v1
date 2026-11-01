<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Plant growth prediction calls the external FastAPI growth model directly from the browser (multipart /predict, CORS open); no AI gateway is used for it — the user requires real model output.
- Public branding is Agri Pulse. Keep the existing layout and disease model pipeline intact.
- Google uses the managed Lovable OAuth helper; email signup requires confirmation. A single root auth listener updates session UI and clears private state on identity changes.
- Dashboard routes are under the pathless authenticated layout. Prediction data is owner-scoped in Cloud with RLS; do not import unclaimed legacy browser history into an account automatically.
- Growth predictions remain public to run; signed-in users' successful predictions are saved privately. Do not render model-warning notes.
- Sitemap URLs derive from required route staticData decisions; exclude private subtrees and omit lastmod without page-specific content timestamps to prevent private or misleading search entries.
- Growth processing visuals follow the real request stages without adding artificial model delays; shared neural visuals use canvas and semantic palette tokens for lightweight animation.
- Fixed project reports use Lovable Assets pointers and a shared report dialog with same-origin PDF viewing and download links, keeping binary documents out of source control.
- The farming assistant uses AI Elements and in-memory AI SDK messages mounted at the root, remounting on identity changes to prevent conversation leakage; no chat persistence.
- Gemini chat uses a same-origin streaming server route and the user's gateway-backed Gemini connector; reject foreign origins, validate text-only history, keep credentials server-side and never substitute another provider.
- Site localization uses a root language context and explicit dictionary lookups, never DOM mutation; translate display text only, preserving model payloads, option values, user inputs and model raw JSON. Chat sends a separately validated reply-language choice with each request.
