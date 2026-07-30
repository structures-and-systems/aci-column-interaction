import { describe, expect, it } from "@jest/globals";

import {
  DEFAULT_ACI_PMA_ASSUMPTIONS,
  calculateAreaWeightedDepth,
  createPmCalculationAssumptions,
  resolveReinforcement,
  resolveSteelGroup,
} from "../../src/reinforcement/resolution.ts";

describe("calculateAreaWeightedDepth", () => {
  it("returns a single layer unchanged", () => {
    expect(
      calculateAreaWeightedDepth([{ area: 500, depthFromCompressionFace: 450 }]),
    ).toEqual({ area: 500, depthFromCompressionFace: 450 });
  });

  it("calculates aggregate area and area-weighted depth", () => {
    expect(
      calculateAreaWeightedDepth([
        { area: 400, depthFromCompressionFace: 400 },
        { area: 800, depthFromCompressionFace: 450 },
      ]),
    ).toEqual({ area: 1_200, depthFromCompressionFace: 433.3333333333333 });
  });

  it("rejects empty groups and invalid layer areas", () => {
    expect(() => calculateAreaWeightedDepth([])).toThrow(
      "At least one reinforcement layer is required.",
    );
    expect(() =>
      calculateAreaWeightedDepth([{ area: 0, depthFromCompressionFace: 450 }]),
    ).toThrow("layers[0].area must be a positive finite number.");
  });
});

describe("resolveSteelGroup", () => {
  it("resolves a standalone bounded group", () => {
    expect(
      resolveSteelGroup([{ area: 500, depthFromCompressionFace: 450 }], 500),
    ).toEqual({ area: 500, depthFromCompressionFace: 450 });
  });

  it("rejects depths outside supplied section bounds", () => {
    expect(() =>
      resolveSteelGroup([{ area: 500, depthFromCompressionFace: 501 }], 500),
    ).toThrow(
      "layers[0].depthFromCompressionFace must be within the section depth.",
    );
    expect(() =>
      resolveSteelGroup([{ area: 500, depthFromCompressionFace: 450 }], 0),
    ).toThrow("sectionDepth must be a positive finite number.");
  });
});

describe("resolveReinforcement", () => {
  it("makes an empty compression group absent", () => {
    expect(
      resolveReinforcement({
        tensionLayers: [{ area: 1_200, depthFromCompressionFace: 450 }],
        compressionLayers: [],
        sectionDepth: 500,
      }),
    ).toEqual({
      tensionSteel: { area: 1_200, depthFromCompressionFace: 450 },
    });
  });

  it("resolves designated tension and compression groups independently", () => {
    expect(
      resolveReinforcement({
        tensionLayers: [
          { area: 400, depthFromCompressionFace: 400 },
          { area: 800, depthFromCompressionFace: 450 },
        ],
        compressionLayers: [{ area: 600, depthFromCompressionFace: 50 }],
        sectionDepth: 500,
      }),
    ).toEqual({
      tensionSteel: { area: 1_200, depthFromCompressionFace: 433.3333333333333 },
      compressionSteel: { area: 600, depthFromCompressionFace: 50 },
    });
  });

  it("validates compression-layer depths against section bounds", () => {
    expect(() =>
      resolveReinforcement({
        tensionLayers: [{ area: 1_200, depthFromCompressionFace: 450 }],
        compressionLayers: [{ area: 600, depthFromCompressionFace: 501 }],
        sectionDepth: 500,
      }),
    ).toThrow(
      "layers[0].depthFromCompressionFace must be within the section depth.",
    );
  });
});

describe("createPmCalculationAssumptions", () => {
  it("keeps beta1 an explicit caller decision and permits named overrides", () => {
    expect(createPmCalculationAssumptions(0.8)).toEqual({
      ...DEFAULT_ACI_PMA_ASSUMPTIONS,
      beta1: 0.8,
    });
    expect(
      createPmCalculationAssumptions(0.8, {
        ultimateConcreteStrain: 0.0035,
      }),
    ).toEqual({
      ultimateConcreteStrain: 0.0035,
      rectangularCompressionStressCoefficient: 0.85,
      beta1: 0.8,
    });
  });

  it("does not allow the default values to be mutated", () => {
    expect(Object.isFrozen(DEFAULT_ACI_PMA_ASSUMPTIONS)).toBe(true);
  });
});
