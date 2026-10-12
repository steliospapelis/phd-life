# PhD Life — Writing task catalogue

This is the canonical Writing list for the Home task logger and Supabase content data. Tasks may be completed repeatedly; every completion creates one `task_logs` row and contributes one count to the matching weekly, monthly, and yearly activity report.

| Order | Task | Category | XP | Slug |
| ---: | --- | --- | ---: | --- |
| 1 | Revise a paragraph | Writing | 5 | `revise-paragraph` |
| 2 | Craft a figure or table | Writing | 10 | `craft-figure-table` |
| 3 | Write the abstract | Writing | 10 | `prepare-abstract` |
| 4 | Prepare an outline | Writing | 10 | `prepare-outline` |
| 5 | Write a section | Writing | 20 | `write-section` |
| 6 | Finish a thesis section | Writing | 100 | `finish-section` |
| 7 | Submit a conference paper | Writing | 300 | `submit-conference-paper` |
| 8 | Submit a journal paper | Writing | 500 | `submit-journal-paper` |

## Implementation notes

- The Home task list sorts tasks by ascending XP, then by name for ties.
- XP is awarded by the `complete_task` Supabase RPC, not trusted from the client.
- Each task completion stores the awarded value in `task_logs.xp_awarded` so later reward changes do not rewrite historical XP reports.
- Reports group task logs by task and category and count every completion in the selected calendar period using the user’s timezone.
- Sanity is intentionally unchanged for all Writing tasks.

## Database update

Run `supabase/migrations/0005_writing_catalog.sql` after the existing migrations. It updates the Writing rewards, adds the conference and journal submission tasks, and deactivates every Writing task outside this exact eight-task list.
