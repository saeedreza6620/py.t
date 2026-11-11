# Weekly marketing data

- `latest.json` is the newest snapshot. `snapshot-YYYY-MM-DD.json` keeps the history, one file per week.
- They are written by `.github/workflows/marketing-snapshot.yml` every Friday night (Tehran) from `/admin/marketing.json`.
- **Aggregates only.** There are no names, phone numbers, device ids or texts. The workflow refuses to save anything that looks like a phone number.
- Weeks run Saturday → Friday (Asia/Tehran).
  - `funnelPeople` counts distinct devices per step.
  - `instagram` holds the numbers the team typed into `/admin/marketing`.
- Used by the skill `.claude/skills/beautywallet-weekly/SKILL.md` to build the next content pack.
