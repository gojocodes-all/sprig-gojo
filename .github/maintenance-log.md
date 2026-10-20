# Maintenance log

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
