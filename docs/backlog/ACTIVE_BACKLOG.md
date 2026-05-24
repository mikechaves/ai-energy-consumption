# Active Backlog

> Current execution queue for the AI Energy Context Explorer.

_Current as of: 2026-05-24_

---

## Scope

This file is the canonical backlog for work we are willing to start next.

Rules:

- Keep this file short enough to make real priority tradeoffs.
- Add only work with a clear owner, validation path, or decision gate.
- Move completed work to an archive or decision note instead of leaving `DONE` rows here.
- Keep broad wishlist or long-range ideas in [Future Backlog](./FUTURE_BACKLOG.md).
- Do not treat follow-up sections in reports, README notes, PR descriptions, or research docs as a
  work queue. Promote them here or park them in Future Backlog before acting.

## Current Product Posture

- The project now uses the live NESO Carbon Intensity regional API for Great Britain grid context.
- The mock country JSON has been removed from the runtime.
- The app remains a grid-carbon context explorer, not an AI emissions calculator.
- Near-term work should strengthen trust, data resilience, accessibility, and product framing before
  adding paid providers or model-specific estimates.

## Priority Legend

- `P0`: Blocks trust, data correctness, deployability, or basic validation.
- `P1`: Near-term product value or evidence needed for the next visible slice.
- `P2`: Useful, but not allowed to displace P0/P1 work without an explicit decision.
- `RESEARCH`: Needs a source, architecture, or product decision before implementation.

## Active Workboard

| Priority | Area               | Item                                                                  | Status   | Validation / Exit Criteria                                                                                                                                       |
| -------- | ------------------ | --------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Data Reliability   | Add explicit live-data freshness, outage, and malformed-response states. | TODO     | API failure, malformed response, and stale interval paths render clear UI states without console errors; provenance copy explains freshness and fallback behavior. |
| P0       | Accessibility      | Complete keyboard and screen-reader QA for controls, modal, and 3D scene. | TODO     | Keyboard-only navigation, focus order, modal behavior, screen-reader labels, and reduced-motion expectations are tested and documented with any fixes landed.       |
| P1       | Source Expansion   | Decide the next carbon-data provider for US or global coverage.          | RESEARCH | Decision note compares Electricity Maps, WattTime, EIA, and other viable sources for coverage, cost, API-key handling, freshness, and licensing.                  |
| P1       | Product Framing    | Shape the first workload-estimation layer.                              | RESEARCH | Spec defines supported inputs such as tokens, model, GPU-hours, cloud region, and caveats without presenting unsupported AI-attributed emissions claims.           |
| P1       | Visualization UX   | Reduce regional label overlap and improve small-screen readability.      | TODO     | GB region labels and tooltips remain legible on desktop and mobile smoke viewports while preserving hover/click affordances.                                      |
| P2       | Operations         | Add a repeatable deployment and smoke-check path.                        | TODO     | Hosted preview or production URL exists with documented smoke steps for live data load, source text, controls, modal, and console cleanliness.                     |

## Deferred

The following remain intentionally non-active:

- Paid provider integration before the provider/source decision is documented.
- AI workload or per-request estimates before assumptions and caveats are specified.
- Broad global comparisons that imply AI-attributed energy use by country.
- Heavy visualization rewrites before the live-data and accessibility contracts are stable.

See [Future Backlog](./FUTURE_BACKLOG.md) for the full parking lot.
