# Maintenance log

## 2026-10-26 — Make game metadata parsing whitespace-tolerant

- **Rationale:** The production build rejected
  `games/Push_the_Bucket.js` because its valid `@tags:['Puzzle']` header did not
  contain the parser's previously mandatory single space after `:`. Metadata
  parsing was also embedded in the filesystem-heavy Astro integration, leaving
  this contributor-facing contract without focused regression coverage.
- **Files changed:** `src/integrations/game-metadata.ts` now owns the pure
  parsing and validation boundary and permits optional horizontal whitespace
  around field separators. `src/integrations/generate-metadata.ts` delegates to
  that module. `src/integrations/game-metadata.test.ts` covers canonical,
  compact, tab-separated, empty-field, and invalid-tag inputs. This log records
  the maintenance decision.
- **Validation:** `bun run test:unit --run` passed all 16 tests. `bun run build`
  parsed all 1,140 games and completed the Astro/Vercel production build. An
  additional, non-scripted `bun x tsc --noEmit` probe reached a TypeScript 5.9.3
  internal compiler error under Node.js 24.22.1 before emitting diagnostics;
  the repository's configured unit and production-build checks passed.
- **Risk:** Low. The generated metadata shape and validation rules are
  unchanged; the parser only accepts additional horizontal-whitespace forms and
  distinguishes an empty value from a missing field. No game, dependency,
  lockfile, runtime API, credential, or deployment setting changes.
- **Rollback:** Revert the pull request's squash commit to restore the parser to
  the Astro integration and its exact single-space format. No stored data or
  generated artifact migration is required.

## 2026-10-20 — Align contributor and container documentation

- **Rationale:** The contributor guide only mentioned gallery submissions and
  omitted the repository's platform workflow. The README also said
  `docker compose up` started the Astro site on port 9996, while the checked-in
  Compose file defines only the Yjs client and signaling services.
- **Files changed:** `CONTRIBUTING.md` now distinguishes game and platform
  contributions, documents verified setup and validation commands, maps the
  main source areas, and records pull request expectations. `README.md`
  accurately separates the root Docker image from the two Compose services.
  This log records the maintenance decision.
- **Validation:** Parsed `package.json`; checked the documented commands against
  its scripts; checked Docker guidance against `Dockerfile`,
  `docker-compose.yml`, and the Docker workflow; verified every referenced
  repository path and the existing pull request template.
- **Risk:** Low. Documentation and maintenance history only; application code,
  dependencies, lockfiles, environment templates, CI, deployment, firmware,
  hardware, and game content are unchanged.
- **Rollback:** Revert the pull request's squash commit to restore the prior
  contributor and container guidance. Runtime behavior and stored data are
  unaffected.
