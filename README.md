# AI Energy Context Explorer

> [!IMPORTANT]
> This repository is archived and no longer actively maintained. It began as a graduate academic prototype using a synthetic country-level dataset. The synthetic values were created to demonstrate 3D interaction and data-visualization techniques and must not be treated as empirical AI energy or emissions data. A later revision replaced the synthetic runtime with live Great Britain grid-carbon data from the NESO Carbon Intensity API. Neither version calculates AI-attributed emissions by country, model, request, GPU cluster, cloud account, or data centre.

## Status

- **Status:** Archived.
- **Original project:** Graduate academic prototype, 2023.
- **Data-provenance revision:** 2026.
- **Original runtime data:** Synthetic.
- **Revised runtime data:** Live Great Britain regional grid-carbon context.
- **Measurement boundary:** Grid context, not AI-attributed energy consumption.
- **Maintenance status:** No planned feature development.

## Version History

- [`v1-academic-synthetic`](https://github.com/mikechaves/ai-energy-consumption/releases/tag/v1-academic-synthetic) preserves the final version of the original interaction prototype. Its country-level energy and emissions values were synthetic fixtures for visualization development, not observed or collected measurements.
- [`v2-grid-context`](https://github.com/mikechaves/ai-energy-consumption/releases/tag/v2-grid-context) preserves the later revision, which replaced the synthetic runtime with live Great Britain regional grid-carbon context and added explicit provenance, limitations, and archival documentation.

Neither version provides country-level measurements of energy use or emissions attributable to AI.

## What This Demonstrates

- A-Frame scene construction.
- D3-based data binding and scales.
- Geospatial coordinate mapping.
- Interactive filtering.
- Tooltips and detail views.
- Data provenance and limitation disclosure.
- Iteration from a synthetic prototype to a real-data context layer.

## What This Does Not Claim

- It is not an AI-emissions calculator.
- It does not measure the energy use of an AI model or request.
- It does not attribute national grid emissions to AI.
- It does not provide a country-level database of AI energy consumption.
- The original synthetic values are not evidence for policy, research, procurement, or sustainability reporting.

## Revised Runtime and Data Sources

The revised runtime fetches the current regional interval from the [NESO Carbon Intensity API](https://carbon-intensity.github.io/api-definitions/) and maps regional Great Britain electricity-system values onto the globe. The feed supplies regional forecast carbon intensity and generation mix. `data_provenance.json` documents the measurement frame, metric provenance, limitations, and contextual references.

Reference sources:

- [NESO Carbon Intensity API](https://carbon-intensity.github.io/api-definitions/)
- [IEA: Energy and AI](https://www.iea.org/reports/energy-and-ai)
- [IEA: Energy demand from AI](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai)

## Run Locally for Historical Verification

The project must be served through a local web server because the revised runtime fetches API and JSON data.

```bash
npm start
```

Then open `http://localhost:8000`.

## Project Structure

```text
ai-energy-consumption/
├── assets/
├── docs/
│   ├── ARCHIVE_DECISION.md
│   └── backlog/
├── js/
│   └── ai_energy_consumption_prototype.js
├── data_provenance.json
├── index.html
├── package.json
└── README.md
```

See [the archive decision record](docs/ARCHIVE_DECISION.md) for the preservation rationale and version boundaries.
