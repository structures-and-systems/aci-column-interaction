# ACI Column Interaction

## Project purpose

This project extracts the engineering capability behind an Excel/VBA reinforced-concrete column-design tool. Given section data, material properties, reinforcement information, and a neutral-axis position, the core should calculate one axial-force/moment (P-M) capacity point. A caller can later evaluate a set of neutral-axis positions to form an interaction diagram.

The original automation made it practical to explore more reinforcement alternatives. Preserve that outcome: the project supports better engineering decisions by making the design space inexpensive to evaluate, not merely by reproducing a spreadsheet.

## Architecture

- Keep the engineering engine independent of Excel, a UI, a terminal, file formats, and other integrations.
- Use explicit, structured input and output contracts. JSON, CSV, or another client format belongs outside the core.
- Prefer small, stateless, pure TypeScript functions with clear names. This is calculation-heavy input/process/output logic, not an object lifecycle.
- Keep ACI-derived assumptions and factors explicit in inputs or named constants; do not conceal engineering assumptions in unexplained literals.
- Design calculation helpers so they can be unit-tested independently, then compose them into the single-neutral-axis P-M calculation.

## Current series scope

The immediate capability is a single P-M interaction point. Its calculation sequence is:

1. Receive inputs for one neutral-axis state.
2. Establish the section strain distribution.
3. Determine reinforcement strain.
4. Convert steel strain to stress and cap it at yield.
5. Calculate the concrete compression block.
6. Calculate component forces and their locations.
7. Resolve net axial force and moment.
8. Assemble the capacity point.

## Deliberate boundaries

- A neutral-axis loop that produces a full interaction diagram is orchestration outside the single-point core function.
- Reinforcement-layout interpretation, including turning multiple bar layers into effective depths and aggregate areas, is a separate responsibility from the core calculation.
- The balanced condition is a separate final calculation, not a prerequisite for the initial capacity-point implementation.
- Output classifications such as balanced, tension-controlled, compression-controlled, and nominal versus factored output are later extensions unless a task explicitly brings them into scope.
- Do not couple new engineering logic to the old Excel/VBA implementation.

## Development conventions

- Use TypeScript with the repository's strict compiler settings and ESM conventions.
- Keep units consistent across each calculation contract; document a chosen unit system when introducing a public contract.
- Make sign conventions for force, moment, strain, and datum explicit at contract boundaries.
- Do not use `any` in new calculation code. Model engineering data and result states with precise types.

## Testing

- Use Jest for unit testing. Each calculation helper should have a test suite that covers expected, edge, and error cases.
