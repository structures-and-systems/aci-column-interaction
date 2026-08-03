import { describe, expect, it } from "@jest/globals";
import {
  calculateConcreteCompressionBlock,
  calculatePmCapacityPoint,
  calculateSteelStrain,
  calculateSteelStress,
  calculateSteelStressWithYieldCap
} from "../../src/core";
import { createInput, expectedOutput, calcTolerance } from "./fixtures";

describe("calculateSteelStrain", () => {
  it("returns expected tension steel strain from a given neutral axis", () => {
    const _steelStrain = calculateSteelStrain(
      0.003,
      expectedOutput.neutralAxisDepth,
      expectedOutput.tensionSteelComponent.depthFromCompressionFace
    );
    expect(
      calcTolerance(_steelStrain, expectedOutput.tensionSteelComponent.strain!, 0.01)
    ).toBe(true);
  });
});

describe("calculateConcreteCompression", () => {
  const input = createInput();
  it("returns expected concrete compression force from a given neutral axis", () => {
    const block = calculateConcreteCompressionBlock(
      input.section,
      input.concrete,
      input.assumptions,
      expectedOutput.neutralAxisDepth,
    );
    expect(block.force).toBeCloseTo(expectedOutput.concreteComponent.force);
    expect(calcTolerance(block.force, expectedOutput.concreteComponent.force, 0.01)).toBe(true);
  });
});

// describe("calculateSteelStressWithYieldCap", () => {
//   it("converts signed strain to elastic stress", () => {
//     expect(calculateSteelStress(-0.001, 200_000)).toBe(-200);
//   });

//   it("preserves elastic stress within yield limits", () => {
//     expect(calculateSteelStressWithYieldCap(0.001, 200_000, 500)).toBe(200);
//   });

//   it("caps both compression and tension stress at yield", () => {
//     expect(calculateSteelStressWithYieldCap(0.004, 200_000, 500)).toBe(500);
//     expect(calculateSteelStressWithYieldCap(-0.004, 200_000, 500)).toBe(
//       -500,
//     );
//   });
// });

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