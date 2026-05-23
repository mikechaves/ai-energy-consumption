# AI Energy Context Explorer

An interactive 3D globe for exploring country-level energy, CO2, and population context around AI and data-centre sustainability discussions. The current dataset is a prototype context dataset; it is not a source-verified estimate of AI-attributed energy use or AI-caused emissions by country.

## Why This Caveat Matters

Country-level AI energy consumption is difficult to attribute cleanly because data-centre load, model training, inference, cloud region routing, grid mix, and corporate renewable procurement are not reported consistently across countries. This project now separates:

- The bundled visualization values in `ai_energy_consumption_data.json`
- Dataset provenance and limitations in `data_provenance.json`
- External reference sources for AI/data-centre energy framing and CO2 accounting methodology

## Features

- 3D globe with bars positioned by country latitude and longitude
- Metric switching for national energy context, national CO2 context, and per-capita views
- Region, country search, and value-range filtering
- Hover labels and click-through country detail modal
- Explicit dataset status, limitations, and source links in the UI
- Illustrative detail chart that is labeled as non-sourced until a real historical series is connected

## Run Locally

The app must be served from a local web server because it fetches JSON data files.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Data Files

`ai_energy_consumption_data.json` contains the country records used by the prototype:

- `country`
- `region`
- `latitude`
- `longitude`
- `energyConsumed`
- `co2Emissions`
- `population`
- `energyPerCapita`
- `co2PerCapita`

`data_provenance.json` documents the status of those values:

- Dataset status and measurement frame
- Field labels, units, and provenance notes
- Known limitations
- Reference sources used for contextual framing

## Reference Sources

The UI links to current reference sources for the topic framing:

- [IEA: Key Questions on Energy and AI](https://www.iea.org/reports/key-questions-on-energy-and-ai)
- [IEA: Energy and AI](https://www.iea.org/reports/energy-and-ai)
- [Our World in Data: CO2 emissions](https://ourworldindata.org/co2-emissions)

These references do not validate every bundled country value. They provide context for AI/data-centre energy demand and CO2 accounting methodology.

## Recommended Next Data Step

Before using this as an evidence-backed public visualization, replace the prototype records with a source-verified dataset and document:

- Source URL and publication date
- Collection year
- Whether the metric represents AI, data centres, electricity demand, total energy, or national emissions
- Calculation method for per-capita values
- Confidence or caveat notes for each country

## Project Structure

```text
ai-energy-consumption/
├── assets/
│   ├── earth_texture.jpg
│   └── starfield_texture.jpg
├── js/
│   └── ai_energy_consumption_prototype.js
├── ai_energy_consumption_data.json
├── data_provenance.json
├── index.html
└── README.md
```
