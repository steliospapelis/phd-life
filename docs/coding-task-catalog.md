# PhD Life — Coding task catalogue

This is the canonical Coding list for the Home task logger and Supabase content data. Tasks may be completed repeatedly; every completion creates one `task_logs` row and contributes one count to the matching weekly, monthly, and yearly activity report.

| Order | Task | Category | XP | Slug |
| ---: | --- | --- | ---: | --- |
| 1 | Add a feature | Coding | 5 | `add-feature` |
| 2 | Create a pipeline | Coding | 10 | `create-pipeline` |
| 3 | Finish a script | Coding | 10 | `finish-script` |
| 4 | Run a model | Coding | 10 | `run-model` |
| 5 | Set up the environment | Coding | 10 | `setup-environment` |
| 6 | Create an interface | Coding | 20 | `create-interface` |
| 7 | Develop an app | Coding | 50 | `develop-app` |

## Implementation notes

- The Home task list sorts tasks by ascending XP, then by name for ties.
- XP is awarded by the `complete_task` Supabase RPC, not trusted from the client.
- Each task completion stores the awarded value in `task_logs.xp_awarded` so later reward changes do not rewrite historical XP reports.
- Reports group task logs by task and category and count every completion in the selected calendar period using the user’s timezone.
- Sanity is intentionally unchanged for all Coding tasks.

## Database update

Run `supabase/migrations/0007_coding_catalog.sql` after the existing migrations. It adds or updates these seven Coding tasks and deactivates every Coding task outside this exact list.
