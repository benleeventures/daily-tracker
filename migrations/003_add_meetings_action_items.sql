-- Real checklist for meeting action items, replacing the "* [ ] " text in notes
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS action_items jsonb NOT NULL DEFAULT '[]'::jsonb;
