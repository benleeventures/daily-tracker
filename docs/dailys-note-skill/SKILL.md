---
name: dailys-note
description: How to send Ben Lee's day note, tasks and meetings to his Dailys app - the note format, the web form at teambenlee.com/dailies/ingest, what the replies mean, and the rules (never invent values, never expose the access key). Use after Ben's day check-in or after a meeting, and whenever asked to log, send, sync or fix a day in Dailys.
---

# Send the day's note to Dailys

Ben tracks his day in Dailys: a reflection, energy, habits, tasks, and meeting notes with action items. You send a note and the app merges it into the right day. This skill covers the format, the delivery, and the rules.

This is separate from the gut note. Send the gut note with the `gut-audit-note` skill and this one with its own key. A problem with one never blocks the other.

## The rules first

1. **Never invent a value.** If Ben didn't say it, leave the line out. A missing energy score or habit is fine; a made-up one is wrong.
2. **Never expose the access key.** Fill it only from your password manager into the form field. Don't type it, quote it, summarize it or put it in any chat, note or log.
3. **One note per day, plus meetings as they happen.** Resending the exact same note is safe (the app says "already imported" and changes nothing). If something needs a correction, tell Ben instead of sending a second full note. Tasks, habits and action items add up, they never replace or untick.
4. **Don't advise or interpret.** You are only logging.

## Delivering it

Open **https://www.teambenlee.com/dailies/ingest**. No login. The page has two fields and one button:

1. **Access key**: fill from the password manager item "Dailys access key".
2. **Day note**: paste the whole note (format below).
3. Press **Send note**, then read the message under the button.

What the replies mean:

| Message starts with | Meaning | What to do |
|---|---|---|
| `Imported.` | Worked. It says the date and what went in. | Tell Ben it's logged. |
| `Already imported.` | This exact note was sent before. Nothing changed. | Fine. Tell Ben. |
| `That access key was not accepted.` | Wrong or revoked key. | Stop. Tell Ben. Don't keep trying. |
| `Too many wrong tries.` | Rate limit after bad keys. | Wait an hour, tell Ben. |
| `That note doesn't follow the template.` | No recognizable headings. | Fix the headings below and resend. |
| `The note has the right headings but nothing in it to import.` | Every section was empty or unreadable. | Add what Ben actually said, or don't send. |
| `Couldn't reach the server.` | Network. | Retry once a few minutes later, then tell Ben. |

If you can't use the form at all, give the note to Ben in chat and he'll add it by hand.

Developers: the form posts to `POST https://www.teambenlee.com/api/dailies/import` with `Authorization: Bearer <key>` and the note as the body. That is only for a tool that can set headers; you most likely can't, so use the form.

## The note format

First line is the date. If the date is missing or in the future, the app files it under today (Costa Rica time). Use only these headings: `## Day`, `## Tasks`, `## Meetings`, and `### Person` under Meetings. Any section can be left out.

```
# 2026-10-14

## Day
energy: 4
habits: meditate, write, surf
reflection: Good build day. Shipped the import route.
  It felt calm.
observations: Slept badly, still clear by noon.

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

### Field notes

- **energy:** a whole number 1 to 5 (1 😤, 2 😔, 3 😐, 4 😊, 5 🤩) or the face itself. Anything else is ignored. If Ben didn't give one, leave the line out.
- **habits:** a comma list of `surf`, `write`, `meditate`, `supplements`, `biofeedback`. Also accepted: `movement`, `journal`, `meditation`, `peptides`. Only list what Ben said he did. Habits can only be turned on, never off.
- **reflection / observations / notes:** free text. Indent following lines by two spaces to continue the same field. If that day already has text, yours is added below it, never replacing it.
- **Tasks and action items:** `- [ ]` open, `- [x]` done. Matched by text, so a repeat doesn't double. A note can mark an item done but never reopens one.
- **Meetings:** one `### Person` block per meeting. If a meeting with that person already exists on that date, the notes and items are added to it; otherwise a new meeting is created. `granola:` must be an https link, or leave it out.

## Checklist before you press Send

- [ ] Date line is right and matches the day being logged.
- [ ] Only the headings above.
- [ ] Nothing in it that Ben didn't tell you.
- [ ] Key filled from the password manager, not typed.
