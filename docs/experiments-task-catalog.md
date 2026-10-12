# PhD Life — Experiments task catalogue

This is the canonical Experiments list for the Home task logger and Supabase content data. Tasks may be completed repeatedly; every completion creates one `task_logs` row and contributes one count to the matching weekly, monthly, and yearly activity report.

| Order | Task | Category | XP | Slug |
| ---: | --- | --- | ---: | --- |
| 1 | Clean the lab | Experiments | 5 | `clean-lab` |
| 2 | Prepare samples | Experiments | 5 | `prepare-samples` |
| 3 | Calibrate equipment | Experiments | 10 | `calibrate-equipment` |
| 4 | Prepare an experiment protocol | Experiments | 10 | `prepare-protocol` |
| 5 | Record observations | Experiments | 10 | `record-observations` |
| 6 | Analyze experimental data | Experiments | 20 | `analyze-experimental-data` |
| 7 | Perform an experiment | Experiments | 20 | `perform-experiment` |

## Implementation notes

- The Home task list sorts tasks by ascending XP, then by name for ties.
- XP is awarded by the `complete_task` Supabase RPC, not trusted from the client.
- Each task completion stores the awarded value in `task_logs.xp_awarded` so later reward changes do not rewrite historical XP reports.
- Reports group task logs by task and category and count every completion in the selected calendar period using the user’s timezone.
- Sanity is intentionally unchanged for all Experiments tasks.

## Database update

Run `supabase/migrations/0008_experiments_catalog.sql` after the existing migrations. It adds or updates these seven Experiments tasks and deactivates every Experiments task outside this exact list.
