# INT6066 Design Studio

A complete English-language course workspace for 22 course groups with no member limit, plus a separate Test workspace. The first release covers Empathize and Define, with personal observations, shared discussions, evidence and unknowns, problem framing, versioned submissions, Nicole’s teacher feedback, and individual reflections.

The visual design follows the supplied cream, black, green, orange, cyan and coral interface previews. The original Design Thinking diagram is included in `public/design-thinking.png`.

## Quick local preview

Use Node.js 22.12 or later (Node 24 is recommended):

```sh
npm ci
npm run dev:local
```

Open http://127.0.0.1:3000. This runs a persistent local PostgreSQL-compatible database using PGlite. No cloud credentials are required. It is for local preview and testing; Vercel uses your actual Prisma Postgres database. Local data stays in `.local-data/`, which is excluded from Git and the deliverable ZIP.

Students choose their existing group and enter their name. A returning student uses the same group and name. Names are normalized for spacing and case; each course group allows any number of identities. No student roster is pre-filled: the selected group and entered name establish the identity on first login. Test allows trial identities, and is excluded from course progress totals and the class CSV. This is the classroom identification flow requested by the course owner, rather than a verified institutional sign-in. Nicole can remove unused identities to correct accidental registrations.

Choose **Nicole · Teacher** and use the teacher password configured in `TEACHER_PASSWORD`. The local preview uses the password requested by the course owner. The password is checked on the server and never included in the browser bundle.

## Deploy to Vercel with Prisma Postgres

1. Put this folder in a Git repository and import it into Vercel as a Next.js project. The root directory is this folder (the folder containing `package.json`).
2. In the Vercel project’s **Storage / Marketplace**, add **Prisma Postgres** and connect it to the project. It supplies `DATABASE_URL`. Use the standard PostgreSQL URL beginning with `postgres://` or `postgresql://`.
3. Add `SESSION_SECRET` and `TEACHER_PASSWORD` under **Settings → Environment Variables**, for Production and any Preview environments you intend to use. `.env.example` describes both. Generate a fresh secret with:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Deploy or redeploy after connecting the database and adding the variables. `vercel.json` selects `npm run vercel-build`. The command checks configuration, runs `prisma migrate deploy`, then builds Next.js. The initial migration creates all tables and pre-registers the 22 named course groups. An additive migration registers the separate Test workspace.
5. Visit `/join`, sign in as Nicole, and confirm all 22 course groups and Test appear. Then register a trial user in Test, share an observation, refresh the page, and confirm it remains saved.

The project does not contain production credentials, a provisioned cloud database, or an existing public deployment. Connecting your database is the remaining deployment step. For local work with a real database, copy `.env.example` to `.env.local`, replace its values, run `npm run db:deploy`, then `npm run dev`.

Official references: [Prisma Postgres connections](https://www.prisma.io/docs/postgres/database/connecting-to-your-database), [Prisma ORM v7 with Next.js](https://www.prisma.io/docs/guides/v7/frameworks/nextjs).

## Learning flow

1. **Course Home** — large original Design Thinking diagram and today’s Empathize → Define journey.
2. **Join your group** — choose one of the 22 supplied course names or Test, then enter a name. Nicole uses a password.
3. **Individual observation** — describe learners, context, actions or quotes; classify the source; optionally attach a photo or PDF under 2 MB.
4. **Group discussion** — compare observations, comment on a specific record, and capture an emerging focus.
5. **Evidence & unknowns** — identify target learners and situation; select direct evidence; record interpretations, alternative explanations and questions with ways to investigate them.
6. **Empathize summary** — review the record and complete the stage. Assumptions cannot satisfy the direct-evidence requirement.
7. **Review findings** — connect patterns to their source records.
8. **Focus the problem** — compare possible learner challenges and choose one.
9. **Write the definition** — Who / Situation / Need / Difficulty, with a statement template.
10. **Review & submit** — edit the statement and How might we question; record a feedback request and next inquiry.
11. **Saved work** — immutable submission versions, teacher feedback, contribution record, JSON export and Print / Save PDF.

Students can revisit earlier steps and submit revised versions. Templates and reflective prompts are deterministic; this release does not use an external AI service or automatically grade students. Later Ideate, Prototype and Test workspaces are not implemented in this release.

## Required and optional work

Every input and evidence choice identifies its requirement. Continue, sidebar navigation and direct future page access use the same learning prerequisites. Earlier steps remain available for revision. The server checks the saved group record before advancing and before completing milestones.

| Step | Required to continue | Optional |
| --- | --- | --- |
| Individual observation | At least one saved record from the current student, with learners, context, a concrete observation and source type | Source details, photo or PDF |
| Group discussion | The group's emerging learner challenge | Discussion comments |
| Evidence and unknowns | Group learners, learning situation, selected direct user evidence, at least one question and an investigation method | Interpretations and alternative explanations |
| Empathize summary | Complete the previous requirements and explicitly select Continue to Define | No new writing |
| Review findings | At least one titled pattern linked to direct user evidence | Additional patterns and interpretations |
| Focus | A described, selected learning problem with direct user evidence, and a desired learning behavior | Additional possible problems |
| Four-part definition | Who, situation, need and difficulty | No additional writing |
| Review and submit | A complete problem statement and How might we question | Feedback request and next inquiry |

Assumptions can start a personal record but cannot satisfy direct user evidence. Completely unused extra rows do not block progress. A partly completed row needs its missing parts or removal. Each student needs their own starting record to advance, but the group does not need to wait for every registered member to submit. The optional personal journal is separate from today's required path.

## Collaboration and data

- Prisma ORM 7, PostgreSQL, Next.js App Router and React.
- Database-backed group work, observations, discussions, attachments, submission snapshots, feedback and reflections.
- Shared fields autosave after a short pause; other members’ records refresh every 12 seconds. Teacher overview refreshes every 15 seconds.
- Optimistic revision checks protect shared fields from silent overwrites. Students review teammate changes before choosing which changed fields to save.
- Group identity creation and submission versions are protected by PostgreSQL row locks. Personal observations can only be edited by their author; students cannot read another group’s private records or post teacher feedback.
- Signed, HttpOnly, SameSite session cookies and same-origin mutation checks. Nicole’s password attempts are rate limited.
- Temporary, unsaved text is backed up in the current browser tab. Database saves are the shared course record.
- Uploaded evidence is stored in PostgreSQL and served through authenticated download routes. Each attachment is limited to 2 MB. Keep file evidence selective and anonymous.

## Checks

```sh
npm run typecheck
npm test
npm run test:migration
npm run build
npm run test:integration
```

Integration tests automatically start a separate server on port 3001 and create a fresh, disposable in-memory database on port 54331. They never use the persistent course preview database. QA identities exist only inside that disposable database. They cover teacher authentication, unrestricted group membership, returning identities, author ownership, cross-group access, evidence classification, concurrent shared-field writes, stage completion, immutable submissions, teacher feedback, reflections and logout. The worker refuses to start unless invoked by the isolated runner. Build the project before running this suite.

The migration test starts a disposable local PostgreSQL-compatible database, runs the actual `prisma migrate deploy` command twice, and verifies that the 22 course groups plus Test are initialized without duplicate registration.

## Files

- `src/app/` — pages, styles, API handlers.
- `src/components/` — learning workspaces and collaboration UI.
- `src/lib/` — course names, validation, Prisma connection and signed sessions.
- `prisma/` — schema and repeatable deployment migration.
- `scripts/` — local database runner and deployment configuration check.
- `tests/` — meaningful validation and local API integration checks.
- `VERCEL部署指南.md` — deployment steps in Chinese.

Keep the lockfile. Future deployments should use `npm ci`. Avoid deleting or resetting a live database; schema changes belong in new migrations.
