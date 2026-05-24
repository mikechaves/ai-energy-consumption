# AI Energy Context Explorer

An interactive 3D globe for exploring live Great Britain grid carbon intensity and electricity-mix context around AI and data-centre sustainability discussions.

The app no longer uses a mock country JSON dataset as its primary source. It fetches the current regional interval from the [NESO Carbon Intensity API](https://carbon-intensity.github.io/api-definitions/) and maps the live regional values onto the globe.

## Why This Data Frame

There is no reliable public real-time feed for AI-attributed energy consumption by country. The honest live signal is grid context: carbon intensity and generation mix for the electricity system where compute could run.

This project now separates:

- Live grid data from the NESO Carbon Intensity API
- Dataset provenance and limitations in `data_provenance.json`
- AI/data-centre context from IEA references

## Features

- Live regional carbon intensity for Great Britain grid areas
- Live renewables, low-carbon, and gas generation-share metrics
- Region filtering for England, Scotland, and Wales
- Search for individual grid regions
- Hover labels and click-through details for each region
- Modal chart showing the current generation mix from the live API response
- Explicit source, interval, and limitation copy in the UI

## Run Locally

The app must be served from a local web server because it fetches API and JSON data.

```bash
npm start
```

Then open:

```text
http://localhost:8000
```

## Data Sources

`https://api.carbonintensity.org.uk/regional` provides the live regional feed. The app uses:

- `intensity.forecast` as `carbonIntensity`
- `generationmix` to calculate `renewablePercentage`, `lowCarbonPercentage`, and `gasPercentage`
- `from` and `to` as the current settlement interval

`data_provenance.json` documents:

- Dataset status and measurement frame
- Metric labels, units, and provenance notes
- Known limitations
- Reference sources used for contextual framing

## Reference Sources

- [NESO Carbon Intensity API](https://carbon-intensity.github.io/api-definitions/)
- [IEA: Energy and AI](https://www.iea.org/reports/energy-and-ai)
- [IEA: Energy demand from AI](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai)

## Scope Notes

This is still not an AI-emissions calculator. It does not estimate the energy use of a particular model, request, GPU cluster, cloud account, or data centre. It gives a live grid-carbon context layer that can support a later workload-estimation feature.

Good future additions:

- Optional Electricity Maps or WattTime provider behind a server-side proxy
- A workload estimator using model calls, tokens, GPU-hours, or cloud region
- Provider switcher with source confidence and freshness states
- Cached serverless endpoint to avoid client-side API-key exposure for paid providers

## Project Structure

```text
ai-energy-consumption/
├── assets/
│   ├── earth_texture.jpg
│   └── starfield_texture.jpg
├── js/
│   └── ai_energy_consumption_prototype.js
├── data_provenance.json
├── index.html
├── package.json
└── README.md
```
