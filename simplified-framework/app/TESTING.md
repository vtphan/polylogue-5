# Running and testing the app locally

After `git pull` from a fresh machine (e.g. home), from `simplified-framework/app/`:

```bash
cd simplified-framework/app
npm install                    # only if package.json changed
npx prisma migrate deploy      # apply any new migrations to prisma/dev.db
npx prisma generate            # regenerate the Prisma client
npm run dev                    # http://localhost:3000
```

## Walking through to the Milestone 4 completion surface

1. Open `http://localhost:3000` → pick a group → pick a student.
2. Click Continue on the transcript, then work through both warm-ups and all 4 levels of the active episode. Try opening a hint on level 2 and level 4 so `Used Help And Kept Going` appears.
3. On the final level's feedback screen, press **Finish the episode** — you land on the completion surface at `/runs/{runId}/level`.

## Quick checks on the completion surface

- **Reload the page** — same surface, same badges.
- Click **Re-read the transcript** → `/runs/{runId}/read` still shows the transcript with "Back to your finished episode" (no Continue form).
- Visit `/runs/{runId}/level` directly after closing the tab — reopens completion deterministically.
- Inspect persisted rows and sanity-check the 9-badge count: `npx prisma studio`.

## Resetting state for a fresh run

Delete `prisma/dev.db` and re-run `npx prisma migrate deploy`. This resets state without touching any code.
