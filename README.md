# ACI column interaction

> Given a reinforced-concrete section, material properties, reinforcement layout, and a set of neutral-axis positions, what axial-moment capacity points does the section produce?

```
Section configuration
+ Material properties
+ Resolved reinforcement
+ Neutral-axis position
+ Calculation assumptions
--------------------------------
Nominal axial-moment interaction point
```

## Single-point calculation

`calculatePmCapacityPoint` evaluates one neutral-axis state for a rectangular
section. It is intentionally independent of physical bar layouts and
interaction-diagram iteration. Pass aggregate tension steel and optional
compression steel, each located at its area-weighted centroid from the
compression face.

All inputs use one compatible unit system. For example, MPa and mm produce
forces in N and moments in N-mm. Compression force and strain are positive;
tension force and strain are negative. Positive moment compresses the declared
compression face.

```ts
import { calculatePmCapacityPoint } from "column-interaction";

const point = calculatePmCapacityPoint({
  section: { width: 300, depth: 500 },
  neutralAxisDepth: 200,
  concrete: { compressiveStrength: 30 },
  steel: { yieldStrength: 500, elasticModulus: 200_000 },
  assumptions: {
    ultimateConcreteStrain: 0.003,
    beta1: 0.85,
    rectangularCompressionStressCoefficient: 0.85,
  },
  tensionSteel: { area: 1_200, depthFromCompressionFace: 450 },
  compressionSteel: { area: 600, depthFromCompressionFace: 50 },
});
```

The result includes nominal axial force and moment plus concrete and steel
component forces to support equilibrium review. Balanced-point evaluation,
capacity-state classification, strength reduction, and neutral-axis iteration
remain separate features.

## Development

```sh
bun run typecheck
bun run test
bun run test -- src/core/pm-capacity.test.ts -t "assembles signed"
```