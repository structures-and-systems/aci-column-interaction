
import { describe, expect, it } from "@jest/globals";
import type { PmCapacityInput, PmCapacityPoint, UltimatePMState } from '../../src/core';
import { calculatePmCapacityPoint } from '../../src/core';
import { pmPoints } from './pm-points';

const TOL: number = 0.05;

const testData: UltimatePMState[] = pmPoints.map(([neutralAxisDepth, axialForce, moment]) => ({
  neutralAxisDepth,
  axialForce,
  moment,
}));

const testInput: PmCapacityInput = {
  section: { width: 450, depth: 450 },
  neutralAxisDepth: 200,
  concrete: { compressiveStrength: 21 },
  steel: { yieldStrength: 414, elasticModulus: 200000 },
  assumptions: {
    ultimateConcreteStrain: 0.003,
    beta1: 0.85,
    rectangularCompressionStressCoefficient: 0.85,
  },
  tensionSteel: { area: 402, depthFromCompressionFace: 392 },
  compressionSteel: { area: 402, depthFromCompressionFace: 58 },
};

for (const { neutralAxisDepth, axialForce, moment } of testData) {
  const _testInput = { ...testInput, neutralAxisDepth };
  describe(`calculatePmCapacityPoint for neutralAxisDepth=${neutralAxisDepth}`, () => {
    it(`returns axialForce=${axialForce} and moment=${moment}`, () => {
      const output: PmCapacityPoint = calculatePmCapacityPoint({ ..._testInput });
      // expect(Math.abs((0.65 * output.nominalAxialForce) / (axialForce * 1000))).toBeCloseTo(1, TOL);
      // expect(Math.abs((0.90 * output.nominalMoment) / (moment * 1000000))).toBeCloseTo(1, TOL);
      // expect(Math.abs(0.65 * output.nominalAxialForce)).toBeCloseTo(axialForce * 1000, TOL);
      // expect(Math.abs(0.90 * output.nominalMoment)).toBeCloseTo(moment * 1000000, TOL);
    });
  });
}

