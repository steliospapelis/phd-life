# PhD Life — Admin task catalogue

This is the canonical Admin list for the Home task logger and Supabase content data. Tasks may be completed repeatedly; every completion creates one `task_logs` row and contributes one count to the matching weekly, monthly, and yearly activity report.

| Order | Task | Category | XP | Slug |
| ---: | --- | --- | ---: | --- |
| 1 | Clean your desk | Admin | 2 | `clean-desk` |
| 2 | Make a call | Admin | 2 | `make-call` |
| 3 | Organise files | Admin | 2 | `organise-files` |
| 4 | Plan the week | Admin | 2 | `plan-week` |
| 5 | Schedule a meeting | Admin | 2 | `schedule-meeting` |
| 6 | Write an email | Admin | 2 | `write-email` |
| 7 | Fill a form | Admin | 3 | `fill-form` |
| 8 | Survive a meeting with the supervisor | Admin | 5 | `survive-supervisor-meeting` |

## Implementation notes

- The Home task list sorts tasks by ascending XP, then by name for ties.
- XP is awarded by the `complete_task` Supabase RPC, not trusted from the client.
- Each task completion stores the awarded value in `task_logs.xp_awarded` so later reward changes do not rewrite historical XP reports.
- Reports group task logs by task and category and count every completion in the selected calendar period using the user’s timezone.
- Sanity is intentionally unchanged for all Admin tasks.

## Database update

Run `supabase/migrations/0011_admin_catalog.sql` after the existing migrations. It adds or updates these eight Admin tasks and deactivates every Admin task outside this exact list.
