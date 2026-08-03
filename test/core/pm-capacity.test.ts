import { describe, expect, it } from "@jest/globals";
import {
  calculateConcreteCompressionBlock,
  calculatePmCapacityPoint,
  calculateSteelStrain,
  calculateSteelStress,
  calculateSteelStressWithYieldCap
} from "../../src/core";
import { createInput, expectedOutput, calcTolerance } from "./fixtures";

describe("1. Tension Steel", () => {
  const { assumptions, neutralAxisDepth, steel, tensionSteel } = createInput();
  const tensionSteelStrain = calculateSteelStrain(
    assumptions.ultimateConcreteStrain,
    neutralAxisDepth,
    tensionSteel.depthFromCompressionFace
  );
  const tensionSteelStress = calculateSteelStressWithYieldCap(
    tensionSteelStrain,
    steel.elasticModulus,
    steel.yieldStrength
  );
  const tensionSteelForce = tensionSteelStress * tensionSteel.area;

  it("returns 0 stress for 0 strain", () => {
    expect(calculateSteelStressWithYieldCap(0, 200_000, 500)).toBe(0);
  });

  it("returns expected tension steel strain from a given neutral axis", () => {
    expect(
      calcTolerance(tensionSteelStrain, expectedOutput.tensionSteelComponent.strain!, 0.01)
    ).toBe(true);
  });

  it("returns expected steel tensile stress from a given neutral axis", () => {
    expect(
      calcTolerance(tensionSteelStress, expectedOutput.tensionSteelComponent.stress!, 0.01)
    ).toBe(true);
  });

  it("returns expected steel tension force from a given neutral axis", () => {
    expect(
      calcTolerance(tensionSteelForce, expectedOutput.tensionSteelComponent.force!, 0.01)
    ).toBe(true);
  });
});

describe("2. Concrete Compression", () => {
  const { assumptions, concrete, neutralAxisDepth, section } = createInput();
  it("returns expected concrete compression force from a given neutral axis", () => {
    const block = calculateConcreteCompressionBlock(
      section,
      concrete,
      assumptions,
      neutralAxisDepth,
    );
    expect(block.force).toBeCloseTo(expectedOutput.concreteComponent.force);
    expect(calcTolerance(block.force, expectedOutput.concreteComponent.force, 0.01)).toBe(true);
  });
});

describe("3. Steel Stress with Yield Cap", () => {
  const { concrete, steel, tensionSteel, compressionSteel } = createInput();
  it("converts signed strain to elastic stress", () => {
    expect(calculateSteelStress(-0.001, 200_000)).toBe(-200);
  });

  it("preserves elastic stress within yield limits", () => {
    expect(calculateSteelStressWithYieldCap(0.001, 200_000, 500)).toBe(200);
  });

  it("caps both compression and tension stress at yield", () => {
    const obviouslyLargeStrain = 400;
    expect(calculateSteelStressWithYieldCap(obviouslyLargeStrain, 200_000, 500)).toBe(500);
    expect(calculateSteelStressWithYieldCap(-obviouslyLargeStrain, 200_000, 500)).toBe(-500);
  });
});

describe("4. Compression Steel", () => {
  const { assumptions, compressionSteel, neutralAxisDepth, steel } = createInput();
  const compressionSteelStrain = calculateSteelStrain(
    assumptions.ultimateConcreteStrain,
    neutralAxisDepth,
    compressionSteel!.depthFromCompressionFace
  );
  const compressionSteelStress = calculateSteelStressWithYieldCap(
    compressionSteelStrain,
    steel.elasticModulus,
    steel.yieldStrength
  );
  const compressionSteelForce = compressionSteelStress * compressionSteel!.area;

  it("returns expected steel compressive stress from a given neutral axis", () => {
    expect(
      calcTolerance(compressionSteelStress, expectedOutput.compressionSteelComponent.stress!, 0.01)
    ).toBe(true);
  });

  it("returns expected steel compression force from a given neutral axis", () => {
    expect(
      calcTolerance(compressionSteelForce, expectedOutput.compressionSteelComponent.force!, 0.01)
    ).toBe(true);
  });
});

describe("5. P-M Capacity Point", () => {
  const { nominalAxialForce, nominalMoment, components } = calculatePmCapacityPoint(createInput());
  it("returns expected nominal axial force", () => {
    expect(nominalAxialForce).toBe(expectedOutput.nominalAxialForce);
    expect(calcTolerance(nominalAxialForce, expectedOutput.nominalAxialForce, 0.01)).toBe(true);
  });
});

// describe("calculatePmCapacityPoint", () => {
//   it("assembles signed concrete and steel forces and centroid moments", () => {
//     const point = calculatePmCapacityPoint(createInput());

//     expect(point.components.concrete.force).toBe(1_300_500);
//     expect(point.components.tensionSteel.force).toBe(-600_000);
//     expect(point.components.compressionSteel?.force).toBeCloseTo(254_700);
//     expect(point.nominalAxialForce).toBeCloseTo(955_200);
//     expect(point.nominalMoment).toBeCloseTo(385_522_500);
//   });

//   it("returns no compression-steel component when the group is omitted", () => {
//     const { compressionSteel: _compressionSteel, ...withoutCompressionSteel } =
//       createInput();
//     const point = calculatePmCapacityPoint(withoutCompressionSteel);

//     expect(point.components.compressionSteel).toBeUndefined();
//     expect(point.nominalAxialForce).toBe(700_500);
//   });

//   it("rejects invalid engineering inputs", () => {
//     expect(() =>
//       calculatePmCapacityPoint({ ...createInput(), neutralAxisDepth: 0 }),
//     ).toThrow("neutralAxisDepth must be a positive finite number.");
//     expect(() =>
//       calculatePmCapacityPoint({
//         ...createInput(),
//         tensionSteel: { ...createInput().tensionSteel, area: -1 },
//       }),
//     ).toThrow("tensionSteel.area must be a positive finite number.");
//     expect(() =>
//       calculatePmCapacityPoint({
//         ...createInput(),
//         tensionSteel: { ...createInput().tensionSteel, depthFromCompressionFace: 501 },
//       }),
//     ).toThrow(
//       "tensionSteel.depthFromCompressionFace must be within the section depth.",
//     );
//     expect(() =>
//       calculatePmCapacityPoint({
//         ...createInput(),
//         compressionSteel: {
//           ...createInput().compressionSteel!,
//           depthFromCompressionFace: -1,
//         },
//       }),
//     ).toThrow(
//       "compressionSteel.depthFromCompressionFace must be within the section depth.",
//     );
//   });
// });