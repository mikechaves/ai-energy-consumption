# Future Backlog

> Deferred and long-range backlog programs that are not in the active execution queue.

_Current as of: 2026-05-24_

---

## Scope

This file is the parking lot. It should not be treated as a commitment to build everything here.
Move items into [Active Backlog](./ACTIVE_BACKLOG.md) only after they have a clear owner,
validation path, and reason to beat the current queue.

If another doc records a follow-up, finding, or proposed roadmap item, it must also appear here or in
[Active Backlog](./ACTIVE_BACKLOG.md). Otherwise it is context, not work.

## Data Provider Expansion

- [ ] Add Electricity Maps through a server-side proxy if coverage, licensing, and cost fit the app.
- [ ] Add WattTime support if regional marginal-emissions data is the stronger product frame.
- [ ] Add EIA data for US electricity context behind a no-secret-leak API-key path.
- [ ] Evaluate ENTSO-E or other regional operators for Europe-wide expansion.
- [ ] Add historical NESO regional time series for trend charts.
- [ ] Add source confidence, licensing, and update cadence fields to provenance metadata.
- [ ] Add cached provider responses for resilience and rate-limit control.

## AI Workload And Estimation

- [ ] Build a token/request estimator once assumptions are documented.
- [ ] Build a GPU-hour or training-scenario estimator for advanced users.
- [ ] Let users choose cloud region and compare against regional grid context.
- [ ] Model data-centre PUE and renewable-procurement caveats without overstating precision.
- [ ] Add explainable calculation notes for every estimate.
- [ ] Consider OpenAI API use only for explanatory summaries, not as the source of numeric truth.
- [ ] Compare model/provider efficiency only after a source-verified dataset exists.

## Visualization And UX

- [ ] Add a GB map view or 2D regional mode alongside the globe.
- [ ] Add mobile-first controls for metric switching, filtering, and region search.
- [ ] Add richer generation-mix chart details and fuel-category grouping.
- [ ] Add current-versus-recent interval comparison once historical data exists.
- [ ] Add visual regression coverage for the globe, controls, labels, and modal.
- [ ] Add reduced-motion behavior for scene animation.

## Trust, Governance, And Documentation

- [ ] Add a data-source audit checklist for every provider.
- [ ] Add a provenance schema validator beyond basic JSON parsing.
- [ ] Add docs for what the app can and cannot claim about AI energy use.
- [ ] Archive completed backlog items once the project has enough recurring work to need history.
- [ ] Add a release note template for visible data-source or methodology changes.

## Operations And Distribution

- [ ] Deploy a public preview or production build.
- [ ] Add CI for JSON validation, JavaScript syntax checks, and static smoke checks.
- [ ] Add an automated browser smoke script for live data load and modal behavior.
- [ ] Add a serverless API proxy for providers that require secrets.
- [ ] Add monitoring for live data failures after deployment.
- [ ] Decide whether GitHub Pages, Vercel, or another static host is the durable target.

---

_For current execution, see [Active Backlog](./ACTIVE_BACKLOG.md)._
