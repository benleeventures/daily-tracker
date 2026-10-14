# Sending a note to Dailys

Instinct sends one note per day. The app merges it into that day. Nothing already in Dailys is overwritten.

**Form (no login):** https://www.teambenlee.com/dailies/ingest. Fill the access key from the password manager item "Dailys access key", paste the note, press **Send note**.
**API:** `POST https://www.teambenlee.com/api/dailies/import` with `Authorization: Bearer <key>` and the note as the body.

## Rules

1. Never invent a value. If Ben didn't say it, leave the line out.
2. Never put the access key in chat, a note or a log.
3. Resending the exact same note is safe ("Already imported"). For a correction, tell Ben instead of sending a second full note: tasks, habits and action items add up, they never replace.

## Format

```
# 2026-10-14

## Day
energy: 4
habits: meditate, write, surf
reflection: Good build day. Shipped the import route.
observations: Slept badly, still felt clear by noon.

## Tasks
- [ ] Send Anya the workbook link
- [x] Review PR

## Meetings
### Anya
granola: https://notes.granola.ai/d/...
notes: Weekly check-in. Agreed to drop LYS clarity calls by Nov 5.
- [ ] Build the GoHighLevel client tracker
- [x] Share the energy audit link
```

- **Date:** first line. Missing or in the future means today (Costa Rica time).
- **Headings:** only `## Day`, `## Tasks`, `## Meetings`, and `### Person` under Meetings. Any section can be left out.
- **energy:** 1 to 5 (1 😤, 2 😔, 3 😐, 4 😊, 5 🤩), or the face itself. Anything else is ignored.
- **habits:** any of `surf`, `write`, `meditate`, `supplements`, `biofeedback` (also `movement`, `journal`, `meditation`, `peptides`). They can only be turned on, never off.
- **reflection / observations / notes:** free text. Indent following lines by two spaces to continue it. If the day already has text, the new text is added below it.
- **Tasks and action items:** `- [ ]` open, `- [x]` done. Matched by text, so a repeat doesn't double. A note can complete an item but never reopens one.
- **Meetings:** matched to an existing meeting by person on that date, otherwise a new one is added. `granola:` must be an https link.

## What the replies mean

| Reply starts with | Meaning |
|---|---|
| `Imported.` | Worked. It says what went in. |
| `Already imported.` | This exact note was sent before. Nothing changed. |
| `That access key was not accepted.` | Wrong or revoked key. Stop and tell Ben. |
| `Too many wrong tries.` | Rate limit after bad keys. Wait an hour, tell Ben. |
| `That note doesn't follow the template.` | No recognizable headings. Fix them and resend. |
