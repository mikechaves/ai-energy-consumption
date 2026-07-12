# Archive Decision: AI Energy Context Explorer

**Archive date:** July 12, 2026

## Original Academic Intent

The project began as a graduate academic prototype for exploring how A-Frame and D3.js could support 3D geospatial interaction, filtering, spatial encoding, tooltips, and data navigation. Its original country-level dataset was synthetic and served interaction and visualization development. It was not an empirical dataset of AI energy consumption or emissions.

## Why the Original Premise Is Insufficient for a Current Case Study

The synthetic values cannot support factual claims about national AI energy use, AI-attributed emissions, or environmental impact. Those questions require explicit system boundaries, source-backed measurements or models, documented assumptions, and uncertainty. Presenting the prototype beside current professional work would give its exploratory data premise more evidentiary weight than it can support.

## Version Boundary

- **v1, academic synthetic:** The original runtime used synthetic country-level values to develop and demonstrate interaction and visualization techniques.
- **v2, live grid context:** The 2026 revision replaced the synthetic runtime with live Great Britain regional grid-carbon context from the NESO Carbon Intensity API and added explicit provenance and limitations. Grid context is not a measurement of energy use or emissions attributable to AI.

## Decisions

- Preserve the repository and its Git history because they document a legitimate academic interaction prototype and a later data-provenance correction.
- Remove the project from the primary portfolio and retain only a clearly labeled legacy entry on the portfolio Archive page.
- Retire public deployment and active roadmap material so the repository cannot be mistaken for a maintained product or current empirical case study.
- Do not continue the proposed workload estimator in this repository.

## Future Work Boundary

Any future AI infrastructure or carbon-aware workload product should begin in a new repository. It should define explicit system and measurement boundaries, document assumptions and confidence ranges, and use source-backed data appropriate to each claim.
