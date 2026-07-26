# Copilot Instructions

Read and follow `.github/AGENTS.md` before changing engineering logic. It defines the project scope, calculation boundaries, and engineering-contract requirements.

## Commands

The project uses Bun, TypeScript, and Jest. No linter or CI workflow is configured.

- Type-check the repository: `bun run typecheck`
- Run all tests: `bun run test`
- Run one test by name: `bun run test -- src/core/pm-capacity.test.ts -t "<test name>"`

## Architecture

The repository is extracting a reusable reinforced-concrete column P-M interaction engine from an earlier Excel/VBA workflow. `src/core/pm-capacity.ts` calculates one nominal capacity point for one neutral-axis state: it accepts section, material, resolved reinforcement, and explicit assumption data; derives strains and stresses; resolves concrete and steel forces; and returns axial-force/moment capacity plus component breakdown.

The core is deliberately only the single-point calculation. An interaction-diagram neutral-axis loop, reinforcement-layout aggregation, client formats, and integrations belong outside it. Keep reusable calculation helpers independent and compose them into the main P-M function.

## Engineering contracts

- Keep ACI values and factors explicit in named constants or input assumptions.
- Public calculation inputs and outputs must state their unit system and sign convention for force, moment, strain, and datum.
- Represent reinforcement passed to the core as aggregate steel area and centroid depth; do not embed bar-layout interpretation in the P-M calculation.
- Preserve the current scope: balanced-point evaluation, output classifications, and nominal/factored behavior are separate work unless the task explicitly includes them.

## TypeScript conventions

- Keep the engine functional, stateless, and composed from small pure functions.
- Maintain strict TypeScript compatibility (`strict` and `noUncheckedIndexedAccess` are enabled).
- Do not introduce `any` in calculation code; use precise types for engineering input and result states.
