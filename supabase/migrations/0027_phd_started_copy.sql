-- Keep already-migrated databases in sync with the canonical milestone copy.
update public.milestone_catalog
set description = 'You signed up for this. On purpose.',
    updated_at = now()
where slug = 'phd_started_voluntarily';
