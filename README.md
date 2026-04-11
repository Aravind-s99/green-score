# Green Score — Scoring Methodology

Green Score is a 0–100 composite meant to be **auditable**: every score should trace back to a concrete source URL and a fetch timestamp.

## Sub-scores (0–100 each)

### Authenticity score
Measures whether the project’s **claimed location** is consistent with independent satellite-derived evidence.

- Inputs:
  - Registry-reported coordinates (e.g., Verra project detail page)
  - Satellite evidence gathered for the same location (buffered area)
- Scoring logic (typical):
  - High score when coordinates are present and consistent
  - Lower score when coordinates are missing or inconsistent
- Risk flags:
  - `missing_coordinates`
  - `coordinates_mismatch_*`

### Carbon efficiency
Checks whether credited reductions are plausible relative to the project’s reported reductions.

- Inputs:
  - Issued credits (when available)
  - Estimated annual emission reductions (registry-reported)
- Typical interpretation:
  - Scores are highest when the ratio is within a reasonable band (near 1.0)
  - Outliers (very low/high ratios) reduce the score and may trigger flags
- Risk flags:
  - `missing_carbon_inputs`
  - `carbon_ratio_*`

### Biodiversity score
Uses vegetation and forest integrity indicators around the project area.

- Inputs:
  - **NDVI** trend (Sentinel‑2) over multiple years
  - **Intact forest percentage** (Hansen baseline + loss mask)
  - Tree cover loss (hectares) as an additional risk signal
- Typical interpretation:
  - Improving NDVI and high intact forest percentage increase the score
  - Degrading NDVI, low intact forest percentage, or high recent loss decrease the score
- Risk flags:
  - `missing_intact_forest_pct`
  - `recent_tree_cover_loss`

### Transparency score
Measures how easy it is for an external reviewer to validate the project.

- Inputs:
  - Number of publicly accessible documents (monitoring reports, validation/verification docs, etc.)
  - Presence of validation/verification body details
- Typical interpretation:
  - More public documents and clear validation information increases the score
  - Missing documentation reduces the score
- Risk flags:
  - `no_public_documents`
  - `missing_validation_body`

## Overall score
The overall Green Score is a **weighted average** of the four sub-scores. Weights are chosen to prioritize verifiability and consistency across independent sources.



This is the authenticity proof that allows users to audit the score.
