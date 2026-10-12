# PhD Life — Teaching task catalogue

This is the canonical Teaching list for the Home task logger and Supabase content data. Tasks may be completed repeatedly; every completion creates one `task_logs` row and contributes one count to the matching weekly, monthly, and yearly activity report.

| Order | Task | Category | XP | Slug |
| ---: | --- | --- | ---: | --- |
| 1 | Grade a paper | Teaching | 5 | `grade-paper` |
| 2 | Give a student feedback | Teaching | 10 | `give-student-feedback` |
| 3 | Help a labmate | Teaching | 10 | `help-labmate` |
| 4 | Help in a workshop | Teaching | 10 | `help-workshop` |
| 5 | Prepare a lecture | Teaching | 10 | `prepare-lecture` |
| 6 | Supervise exam | Teaching | 10 | `supervise-exam` |
| 7 | Teach a class / workshop | Teaching | 20 | `teach-class-workshop` |

## Implementation notes

- The Home task list sorts tasks by ascending XP, then by name for ties.
- XP is awarded by the `complete_task` Supabase RPC, not trusted from the client.
- Each task completion stores the awarded value in `task_logs.xp_awarded` so later reward changes do not rewrite historical XP reports.
- Reports group task logs by task and category and count every completion in the selected calendar period using the user’s timezone.
- Sanity is intentionally unchanged for all Teaching tasks.

## Database update

Run `supabase/migrations/0010_teaching_catalog.sql` after the existing migrations. It adds or updates these seven Teaching tasks and deactivates every Teaching task outside this exact list.
