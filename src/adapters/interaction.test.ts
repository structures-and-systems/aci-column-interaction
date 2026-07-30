import { describe, expect, it } from "@jest/globals";

import { calculatePmCapacityPoint } from "../core/pm-capacity.ts";
import {
  calculateInteractionDiagram,
  calculatePmCapacityPointFromLayers,
  type LayerBasedPmCapacityInput,
  type PmCapacityBaseInput,
} from "./interaction.ts";

const baseInput: PmCapacityBaseInput = {
  section: { width: 300, depth: 500 },
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

const layerInput: LayerBasedPmCapacityInput = {
  ...baseInput,
  neutralAxisDepth: 200,
  reinforcement: {
    tensionLayers: [
      { area: 400, depthFromCompressionFace: 400 },
      { area: 800, depthFromCompressionFace: 450 },
    ],
    compressionLayers: [{ area: 600, depthFromCompressionFace: 50 }],
  },
};

describe("calculatePmCapacityPointFromLayers", () => {
  it("matches a direct core call with manually resolved steel", () => {
    expect(calculatePmCapacityPointFromLayers(layerInput)).toEqual(
      calculatePmCapacityPoint({
        ...baseInput,
        neutralAxisDepth: 200,
        tensionSteel: {
          area: 1_200,
          depthFromCompressionFace: 433.3333333333333,
        },
      }),
    );
  });

  it("supports tension-only layers", () => {
    const { compressionLayers: _compressionLayers, ...tensionOnlyReinforcement } =
      layerInput.reinforcement;

    expect(
      calculatePmCapacityPointFromLayers({
        ...layerInput,
        reinforcement: tensionOnlyReinforcement,
      }),
    ).toEqual(
      calculatePmCapacityPoint({
        ...baseInput,
        neutralAxisDepth: 200,
        tensionSteel: {
          area: 1_200,
          depthFromCompressionFace: 433.3333333333333,
        },
      }),
    );
  });

  it("validates layer depths against the supplied section", () => {
    expect(() =>
      calculatePmCapacityPointFromLayers({
        ...layerInput,
        reinforcement: {
          tensionLayers: [{ area: 1_200, depthFromCompressionFace: 501 }],
        },
      }),
    ).toThrow(
      "layers[0].depthFromCompressionFace must be within the section depth.",
    );
  });
});

describe("calculateInteractionDiagram", () => {
  it("returns one core result per input depth in supplied order", () => {
    const neutralAxisDepths = [300, 100, 200] as const;

    const points = calculateInteractionDiagram(baseInput, neutralAxisDepths);

    expect(points).toEqual(
      neutralAxisDepths.map((neutralAxisDepth) =>
        calculatePmCapacityPoint({ ...baseInput, neutralAxisDepth }),
      ),
    );
    expect(points.map((point) => point.neutralAxisDepth)).toEqual(
      neutralAxisDepths,
    );
  });

  it("does not mutate caller inputs", () => {
    const neutralAxisDepths = [200, 300];
    const beforeDepths = [...neutralAxisDepths];
    const beforeBaseInput = structuredClone(baseInput);

    calculateInteractionDiagram(baseInput, neutralAxisDepths);

    expect(neutralAxisDepths).toEqual(beforeDepths);
    expect(baseInput).toEqual(beforeBaseInput);
  });

  it("rejects empty and invalid depth collections before calculation", () => {
    expect(() => calculateInteractionDiagram(baseInput, [])).toThrow(
      "At least one neutral-axis depth is required.",
    );
    expect(() => calculateInteractionDiagram(baseInput, [100, 0, 200])).toThrow(
      "neutralAxisDepths[1] must be a positive finite number.",
    );
  });
});
