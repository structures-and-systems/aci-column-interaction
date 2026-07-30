import { describe, expect, it } from "@jest/globals";

import {
  calculateConcreteCompressionBlock,
  calculatePmCapacityPoint,
  calculateSteelStrain,
  calculateSteelStress,
  calculateSteelStressWithYieldCap,
  type PmCapacityInput,
} from "./pm-capacity.ts";

const input: PmCapacityInput = {
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
};

describe("calculateSteelStrain", () => {
  it("returns compression, zero, and tension strains relative to the neutral axis", () => {
    expect(calculateSteelStrain(0.003, 200, 50)).toBeCloseTo(0.00225);
    expect(calculateSteelStrain(0.003, 200, 200)).toBe(0);
    expect(calculateSteelStrain(0.003, 200, 450)).toBeCloseTo(-0.00375);
  });
});

describe("calculateSteelStressWithYieldCap", () => {
  it("converts signed strain to elastic stress", () => {
    expect(calculateSteelStress(-0.001, 200_000)).toBe(-200);
  });

  it("preserves elastic stress within yield limits", () => {
    expect(calculateSteelStressWithYieldCap(0.001, 200_000, 500)).toBe(200);
  });

  it("caps both compression and tension stress at yield", () => {
    expect(calculateSteelStressWithYieldCap(0.004, 200_000, 500)).toBe(500);
    expect(calculateSteelStressWithYieldCap(-0.004, 200_000, 500)).toBe(
      -500,
    );
  });
});

describe("calculateConcreteCompressionBlock", () => {
  it("limits compression-block depth to the physical section", () => {
    const block = calculateConcreteCompressionBlock(
      input.section,
      input.concrete,
      input.assumptions,
      1_000,
    );

    expect(block.depth).toBe(500);
    expect(block.centroidDepthFromCompressionFace).toBe(250);
    expect(block.force).toBe(3_825_000);
  });
});

describe("calculatePmCapacityPoint", () => {
  it("assembles signed concrete and steel forces and centroid moments", () => {
    const point = calculatePmCapacityPoint(input);

    expect(point.components.concrete.force).toBe(1_300_500);
    expect(point.components.tensionSteel.force).toBe(-600_000);
    expect(point.components.compressionSteel?.force).toBeCloseTo(254_700);
    expect(point.nominalAxialForce).toBeCloseTo(955_200);
    expect(point.nominalMoment).toBeCloseTo(385_522_500);
  });

  it("returns no compression-steel component when the group is omitted", () => {
    const { compressionSteel: _compressionSteel, ...withoutCompressionSteel } =
      input;
    const point = calculatePmCapacityPoint(withoutCompressionSteel);

    expect(point.components.compressionSteel).toBeUndefined();
    expect(point.nominalAxialForce).toBe(700_500);
  });

  it("rejects invalid engineering inputs", () => {
    expect(() =>
      calculatePmCapacityPoint({ ...input, neutralAxisDepth: 0 }),
    ).toThrow("neutralAxisDepth must be a positive finite number.");
    expect(() =>
      calculatePmCapacityPoint({
        ...input,
        tensionSteel: { ...input.tensionSteel, area: -1 },
      }),
    ).toThrow("tensionSteel.area must be a positive finite number.");
    expect(() =>
      calculatePmCapacityPoint({
        ...input,
        tensionSteel: { ...input.tensionSteel, depthFromCompressionFace: 501 },
      }),
    ).toThrow(
      "tensionSteel.depthFromCompressionFace must be within the section depth.",
    );
    expect(() =>
      calculatePmCapacityPoint({
        ...input,
        compressionSteel: {
          ...input.compressionSteel!,
          depthFromCompressionFace: -1,
        },
      }),
    ).toThrow(
      "compressionSteel.depthFromCompressionFace must be within the section depth.",
    );
  });
});
