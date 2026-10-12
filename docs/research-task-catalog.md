# PhD Life — Research task catalogue

This is the canonical Research list for the Home task logger and Supabase content data. Tasks may be completed repeatedly; every completion creates one `task_logs` row and contributes one count to the matching weekly, monthly, and yearly activity report.

| Order | Task | Category | XP | Slug |
| ---: | --- | --- | ---: | --- |
| 1 | Define a research question | Research | 10 | `research-question` |
| 2 | Plan a literature search | Research | 10 | `search-strategy` |
| 3 | Clean a dataset | Research | 20 | `clean-dataset` |
| 4 | Create a questionnaire | Research | 20 | `create-questionnaire` |
| 5 | Interpret results | Research | 20 | `interpret-results` |
| 6 | Design a study protocol | Research | 25 | `design-protocol` |
| 7 | Complete data collection | Research | 30 | `complete-data-collection` |
| 8 | Perform a statistical analysis | Research | 30 | `statistical-analysis` |
| 9 | Confirm a hypothesis | Research | 50 | `confirm-hypothesis` |

## Implementation notes

- The Home task list sorts tasks by ascending XP, then by name for ties.
- XP is awarded by the `complete_task` Supabase RPC, not trusted from the client.
- Each task completion stores the awarded value in `task_logs.xp_awarded` so later reward changes do not rewrite historical XP reports.
- Reports group task logs by task and category and count every completion in the selected calendar period using the user’s timezone.
- Sanity is intentionally unchanged for all Research tasks.

## Database update

Run `supabase/migrations/0006_research_catalog.sql` after the existing migrations. It adds or updates these nine Research tasks and deactivates every Research task outside this exact list.
