# Maintenance log

## 2026-11-02 — Correct the engine contribution workflow

- **Rationale:** The README said all engine code lived in a separate repository
  and instructed contributors to link that clone into the site. The application
  actually imports the checked-in `engine/src` tree directly. The engine guide
  also still used the retired standalone repository and Yarn, while both the
  root and engine now commit Bun lockfiles. Unit-test guidance did not distinguish
  interactive Vitest watch mode from a finite validation run.
- **Files changed:** `README.md` now links the checked-in engine, documents its
  direct integration with the site, and provides root and standalone validation
  commands. `CONTRIBUTING.md` distinguishes watch mode from one-shot unit tests
  and includes the engine package build. `engine/README.md` uses the current
  repository layout and Bun commands. This log records the maintenance decision.
- **Validation:** Verified every command against the root and engine
  `package.json` files and both Bun lockfiles; traced direct imports from
  `src/` into `engine/src`; checked the unit-test and production-build workflows;
  checked all changed relative links and `git diff --check`. The pull request's
  hosted workflows are the authoritative Bun test and build validation because
  Bun is not installed in the local runner.
- **Risk:** Low. Documentation only. Application behavior, engine source,
  dependencies, lockfiles, CI configuration, public APIs, stored data, firmware,
  and deployment settings are unchanged.
- **Rollback:** Revert the pull request's squash commit to restore the former
  separate-repository, linking, Yarn, and undifferentiated test instructions.

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
