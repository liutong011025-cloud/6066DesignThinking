# Release verification

Verified on 6 October 2026 with Node.js 24.14.1, Next.js 16.3.8, React 19 and Prisma ORM 7.10.0.

The student story was checked from Course Home → group registration → personal observation → group discussion → evidence and unknowns → Empathize completion → Define → saved submission. The teacher story was checked from Nicole’s password login → the 22-course-group overview and separate Test workspace → group review → feedback displayed in the student workspace.

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | Passed | `npm run typecheck` |
| Learning and request validation | Passed | Fourteen meaningful tests using `npm test` |
| Production build | Passed | Next.js compiled and generated all page and API routes |
| Delivered ZIP | Passed | Extracted to a clean folder, installed with `npm ci`, regenerated Prisma Client and completed a production build |
| Fresh database migration | Passed | Actual `prisma migrate deploy` against a disposable local PostgreSQL-compatible database |
| Repeat migration | Passed | No pending migrations; all 22 course groups plus Test preserved |
| Student registration | Passed | Six-member cap in course groups, eight identities accepted in Test, normalized returning names, persisted identity |
| Group data | Passed | Observations, discussion comments, learner context and shared drafts saved through Prisma |
| Evidence classification | Passed | Assumptions cannot satisfy the direct-evidence milestone |
| Author and group isolation | Passed | Other authors cannot overwrite observations; cross-group comments and file downloads are rejected |
| Evidence files | Passed | Authenticated PNG upload/download, byte-for-byte match; anonymous download rejected |
| Concurrent editing | Passed | Stale revision rejected; browser kept the unsaved text and offered a version choice; chosen changed fields saved |
| Required and optional inputs | Passed | Blank steps, per-student observations, sidebar/direct-route checks, evidence links and learning goal; optional fields accepted empty |
| Stage completion | Passed | Valid Empathize summary unlocks Define |
| Submission history | Passed | Submitted snapshots remain unchanged when the current draft is edited |
| Teacher feedback | Passed | Nicole submitted feedback in the browser; the student workspace displayed it |
| Roster correction | Passed | Unused identity can be removed; contributed identities are protected |
| Personal reflection and logout | Passed | Database save/read verified; logout removes access |
| Browser rendering | Passed | Home and workspaces rendered with meaningful content; no framework error overlay or page JavaScript errors |
| Mobile layout | Passed | 390-pixel viewport; page width remained 390 pixels with no horizontal overflow |
| Automated accessibility | Passed | Axe 4.12.1 reported zero violations and no incomplete checks on Home, the observation form and Define review |

The database tests used PGlite through the PostgreSQL wire protocol and the production Prisma PostgreSQL adapter. This checks the application’s data flow and deployment migration locally; it does not constitute a live Vercel or cloud Prisma Postgres deployment test.

The project ZIP excludes local test student records, cookies, local database files, installed dependencies, generated build files and production credentials. On a new deployment, only the 22 course groups and the separate Test workspace are pre-registered. Student identities are created when students join. No student roster is pre-filled. The preview QA identities have been removed, and integration checks now use a disposable database separate from the course preview.

The release intentionally implements Empathize and Define. Later Ideate, Prototype and Test editing workspaces remain future development. No 132-person load test or automated pedagogical grading is claimed.
