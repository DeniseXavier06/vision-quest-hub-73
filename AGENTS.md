# Architecture rules
- Student result storytelling uses the shared CPA measures in `src/lib/medidas.ts`; keep its filtering and priority aggregation in a tested pure helper so every view uses the same concepts and averages.
- Read existing `resultados` fields for storytelling without inventing missing professor or axis classifications; show unavailable breakdowns explicitly.