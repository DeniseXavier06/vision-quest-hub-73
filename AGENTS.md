# Architecture rules
- Student result storytelling uses the shared CPA measures in `src/lib/medidas.ts`; keep its filtering and priority aggregation in a tested pure helper so every view uses the same concepts and averages.
- Read existing `resultados` fields for storytelling without inventing missing professor or axis classifications; show unavailable breakdowns explicitly.
- Student storytelling course drill-down and PowerPoint exports reuse pure CPA aggregations; exports include every filtered group and priority question, paginated for legibility rather than limited to the visible page.
- Student presentation mode renders in a body portal with a scrollable slide and persistent navigation so dashboard layout cannot conceal the presentation.- Student storytelling loads pre-aggregated rows from the `resultados_discentes_agregados` database function in one request; aggregated rows carry `peso` so shared CPA averages stay identical to raw-row averages.
