# PhD Life — Reading task catalogue

This is the canonical Reading list for the Home task logger and Supabase content data. Tasks may be completed repeatedly; every completion creates one `task_logs` row and contributes one count to the matching weekly, monthly, and yearly activity report.

| Order | Task | Category | XP | Slug |
| ---: | --- | --- | ---: | --- |
| 1 | Skim an abstract | Reading | 2 | `skim-abstract` |
| 2 | Extract useful citations | Reading | 3 | `extract-citations` |
| 3 | Read a paper | Reading | 10 | `read-paper` |
| 4 | Take paper notes | Reading | 10 | `paper-notes` |
| 5 | Read a book chapter | Reading | 20 | `read-book-chapter` |
| 6 | Identify a research gap | Reading | 30 | `identify-research-gap` |

## Implementation notes

- The Home task list sorts tasks by ascending XP, then by name for ties.
- XP is awarded by the `complete_task` Supabase RPC, not trusted from the client.
- Each task completion stores the awarded value in `task_logs.xp_awarded` so later reward changes do not rewrite historical XP reports.
- Reports group task logs by task and category and count every completion in the selected calendar period using the user’s timezone.
- Sanity is intentionally unchanged for all six Reading tasks.

## Database update

Run `supabase/migrations/0004_reading_catalog_and_logged_xp.sql` after the existing migrations. It adds or updates the six Reading tasks, deactivates the previous Reading tasks, stores immutable awarded XP on task logs, and updates the completion and report functions.
