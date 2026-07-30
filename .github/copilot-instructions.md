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
- Use `type` for data structures and simple entities.
- Use `interface` for contracts.

## Coding Style

- Follow Clean Architecture by Robert C. Martin.
- Be mindful of boundaries, responsibilities, and dependencies.
- Keep files short with max 400 lines. Refactor if necessary.
- Use consistent naming conventions for files, variables, and functions (`camelCase`).
- Use `_` (underscore) prefix for private fields and methods.

## Planning, Implementation and Overall Responses

- Always conduct a debriefing, explaining not just what changed but, more importantly, why.
- State assumptions, limitations and trade-offs.
- Avoid using heavy jargon or abbreviations; write for a general engineering audience. Otherwise, provide a corresponding explanation.
- Do not assume the reader has access to the entire codebase; provide context and references to relevant files or sections.
- Assume the reader has experience with different languages and frameworks (JavaScript, Python, C++ and C, React, Vue, Blazor, Shiny). Thus, consider providing comparisons or analogies to help them understand the code and its purpose.
- When asked for explanations, opt to use mental models and parallel examples or implementations from other languages to explain concepts.
