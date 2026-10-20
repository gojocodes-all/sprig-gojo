# Contributing to Sprig

Thanks for helping improve Sprig. Contributions generally fall into two paths:
submitting a game to the gallery or changing the platform, firmware, hardware,
documentation, or supporting services.

## Submit a game

The most direct contribution is a game created in the
[Sprig editor](https://sprig.hackclub.com/editor).

Before opening a game pull request:

1. Put the game JavaScript file in `games/`.
2. Add the metadata block described in the pull request template.
3. Use an alphanumeric, hyphenated, or underscored filename that is unique in
   the gallery.
4. Run the game in the editor and confirm that it completes without errors.
5. If the game uses an image, place it in `games/img/` with the same base name
   as the game file.
6. Complete every applicable item in
   [the pull request template](.github/PULL_REQUEST_TEMPLATE.md).

The gallery submission route at <https://sprig.hackclub.com/get> remains the
recommended starting point for first-time game contributors.

## Work on the platform

### Prerequisites

Install [Git](https://git-scm.com/) and [Bun](https://bun.sh/), then install the
locked dependencies from the repository root:

```bash
bun install --frozen-lockfile
```

Copy `.env.example` to `.env` only when the area you are developing needs
credential-backed services. Never commit `.env`, Firebase service-account
material, API keys, or other secrets.

Start the Astro development server with:

```bash
bun dev
```

The site is then available at <http://localhost:4321>.

### Find the right area

| Path | Scope |
| --- | --- |
| `src/pages/` | Astro pages and API routes |
| `src/components/` | Preact components and scoped styles |
| `src/lib/` | Shared browser and server support code |
| `engine/` | Game-engine package included in this repository |
| `firmware/` | RP2040 firmware and hardware runtime |
| `hardware/` | PCB and enclosure design files |
| `docs/` | User, assembly, and operational documentation |
| `yjs-client/` | Collaborative-editing persistence service |
| `yjs-signaling-server/` | WebRTC signaling service |

See the README's repository map for the remaining directories and architecture
notes.

## Validate changes

Run the checks relevant to the files you changed:

```bash
bun run build      # Astro production build
bun run test:unit  # Vitest unit tests
bun test           # fuzzy engine tests
```

When changing the root container, also run:

```bash
docker build -t sprig-ci .
```

A documentation-only change does not require unrelated firmware or hardware
toolchains, but all referenced paths and commands must be checked against the
current repository. Do not weaken tests or CI to make a change pass.

## Pull request expectations

- Keep each pull request focused on one problem.
- Explain the problem, solution, verification, and risk.
- Preserve accessibility, responsive behavior, and secret boundaries.
- Include screenshots or recordings when a user-facing visual change needs
  review.
- Update nearby documentation when behavior, setup, commands, or configuration
  changes.
- Follow the existing code style and avoid unrelated generated-file churn.

For development discussion and help, join the `#sprig` channel in the
[Hack Club Slack](https://hackclub.com/slack/).
