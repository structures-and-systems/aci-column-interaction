
import { describe, expect, it } from "@jest/globals";
import type { CapacityInput, CapacityPoint, UltimatePMState, CalculationAssumptions } from '../../src/core';
import { capacityPoint } from '../../src/core';
import { pmTestPoints } from './pm-points';
// 
import { calcTolerance } from './fixtures';

const TOL: number = 0.015;

const testData: UltimatePMState[] = pmTestPoints.map(([neutralAxisDepth, axialForce, moment]) => ({
  neutralAxisDepth,
  axialForce,
  moment,
}));

const testInput: CapacityInput = {
  section: { width: 450, depth: 450 },
  neutralAxisDepth: 300,
  concrete: { compressiveStrength: 21 },
  steel: { yieldStrength: 414, elasticModulus: 200000 },
  assumptions: {
    ultimateConcreteStrain: 0.003,
    beta1: 0.85,
    rectangularCompressionStressCoefficient: 0.85,
    axialStrengthCapFactor: 0.8,
  },
  tensionSteel: { area: 402, depthFromCompressionFace: 392 },
  compressionSteel: { area: 402, depthFromCompressionFace: 62.5 },
};

for (const { neutralAxisDepth: _neutralAxisDepth, axialForce, moment } of testData) {
  const _testInput = { ...testInput, neutralAxisDepth: _neutralAxisDepth };
  const output: CapacityPoint = capacityPoint({ ..._testInput });
  const { neutralAxisDepth, nominalAxialStrength, nominalMoment } = output;
  const pu: number = 0.65 * nominalAxialStrength / 1000;
  const mu: number = 0.90 * nominalMoment / 1000000;
  describe(`calculatePmCapacityPoint for neutralAxisDepth=${_neutralAxisDepth}`, () => {
    it(`returns axialForce=${axialForce} | ${pu} and moment=${moment} | ${mu}`, () => {
      expect(neutralAxisDepth).toBe(_neutralAxisDepth);

      // expect(pu).toBeCloseTo(axialForce, TOL);
      // expect(mu).toBeCloseTo(moment, TOL);
      expect(calcTolerance(pu, axialForce, TOL)).toBe(true);
      expect(calcTolerance(mu, moment, TOL)).toBe(true);
    });
  });
}

