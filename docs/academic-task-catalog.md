# PhD Life — Academic task catalogue

This is the canonical Academic list for the Home task logger and Supabase content data. Tasks may be completed repeatedly; every completion creates one `task_logs` row and contributes one count to the matching weekly, monthly, and yearly activity report.

| Order | Task | Category | XP | Slug |
| ---: | --- | --- | ---: | --- |
| 1 | Attend a class | Academic | 5 | `attend-class` |
| 2 | Attend a seminar | Academic | 10 | `seminar` |
| 3 | Network with another researcher | Academic | 10 | `network-researcher` |
| 4 | Attend a conference | Academic | 20 | `attend-conference` |
| 5 | Review a paper | Academic | 20 | `review-paper` |
| 6 | Pass an exam | Academic | 50 | `pass-exam` |
| 7 | Submit a proposal | Academic | 50 | `submit-proposal` |
| 8 | Present in a conference | Academic | 100 | `present-in-conference` |

## Implementation notes

- The Home task list sorts tasks by ascending XP, then by name for ties.
- XP is awarded by the `complete_task` Supabase RPC, not trusted from the client.
- Each task completion stores the awarded value in `task_logs.xp_awarded` so later reward changes do not rewrite historical XP reports.
- Reports group task logs by task and category and count every completion in the selected calendar period using the user’s timezone.
- Sanity is intentionally unchanged for all Academic tasks.

## Database update

Run `supabase/migrations/0009_academic_catalog.sql` after the existing migrations. It adds or updates these eight Academic tasks and deactivates every Academic task outside this exact list.
