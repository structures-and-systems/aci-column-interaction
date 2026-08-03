
import type { PmCapacityInput, CapacityComponent } from "../../src/core";

export const calcTolerance = (out: number, expected: number, tol: number = 0.05): boolean => {
  if (Math.abs((out / expected) - 1) < tol) {
    return true;
  }
  return false;
};

export const createInput = (): PmCapacityInput => ({
  section: { width: 450, depth: 450 },
  neutralAxisDepth: 300,
  concrete: { compressiveStrength: 21 },
  steel: { yieldStrength: 414, elasticModulus: 200_000 },
  assumptions: {
    ultimateConcreteStrain: 0.003,
    beta1: 0.85,
    rectangularCompressionStressCoefficient: 0.85,
  },
  tensionSteel: { area: 402, depthFromCompressionFace: 392 },
  compressionSteel: { area: 402, depthFromCompressionFace: 62.5 },
});

// Samples from spreadsheet calculations (from debugging)
const _iteration = 26; // iteration number
const _neutralAxisDepth = 300;
const _concreteComponent: CapacityComponent = {
  name: "concrete",
  force: 2_048_287.5,
  depthFromCompressionFace: _neutralAxisDepth * 0.5,
  strain: 0.003,
  stress: 21.0,
  momentAboutSectionCentroid: 2_048_287.5 * (_neutralAxisDepth * 0.5)
};
const _tensionSteelComponent: CapacityComponent = {
  name: "tensionSteel",
  force: -73_968,
  depthFromCompressionFace: 392,
  strain: -0.00092,
  stress: -184,
  momentAboutSectionCentroid: -73_968 * (392 - (_neutralAxisDepth * 0.5)),
};
const _compressionSteelComponent: CapacityComponent = {
  name: "compressionSteel",
  force: 166_428,
  depthFromCompressionFace: 62.5,
  strain: 0.002375,
  stress: 414,
  momentAboutSectionCentroid: 166_428 * ((_neutralAxisDepth * 0.5) - 62.5)
};

export const expectedOutput = {
  nominalAxialForce: 2_133_571.8,
  ultimateAxialForce: 1080.4,
  nominalMoment: 207.0,
  neutralAxisDepth: _neutralAxisDepth,
  concreteComponent: _concreteComponent,
  tensionSteelComponent: _tensionSteelComponent,
  compressionSteelComponent: _compressionSteelComponent,
};

/**
 * Comp 2048287.5
 * Cs 166428
 * Mn 0
 * Pn 2891700
 * Ts 73968
 * c 300
 * dColDepth 392
 * dColDepthComp 62.5
 * dSteelStrainComp(n) 0.002375
 * dSteelStrainTen(n) 0.00092
 * dfsComp(n) 414
 * dfsTen(n) 184
 * iteration 26
 */