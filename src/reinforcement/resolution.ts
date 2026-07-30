import type {
  PmCalculationAssumptions,
  ResolvedSteel,
} from "../core/pm-capacity.ts";

/**
 * A physical longitudinal reinforcement layer before it is aggregated for the
 * single-point P-M core. Area and depth must use the same compatible unit
 * system selected for the core, such as mm2 and mm. Depth is measured from the
 * compression face.
 */
export interface ReinforcementLayer {
  readonly area: number;
  readonly depthFromCompressionFace: number;
}

/**
 * Caller-designated groups of physical reinforcement layers. `sectionDepth`
 * uses the same length unit as each layer depth.
 */
export interface ReinforcementGroups {
  readonly tensionLayers: readonly ReinforcementLayer[];
  readonly compressionLayers?: readonly ReinforcementLayer[];
  /** Optional physical bounds used to validate layer depths. */
  readonly sectionDepth?: number;
}

/** Resolved steel groups suitable for the single-point P-M core. */
export interface ResolvedReinforcement {
  readonly tensionSteel: ResolvedSteel;
  readonly compressionSteel?: ResolvedSteel;
}

/**
 * ACI constants that do not vary with the concrete strength in this initial
 * core. `beta1` remains a required caller decision because ACI varies it with
 * specified concrete strength and code edition.
 */
export const DEFAULT_ACI_PMA_ASSUMPTIONS = Object.freeze({
  ultimateConcreteStrain: 0.003,
  rectangularCompressionStressCoefficient: 0.85,
});

/** Creates explicit P-M assumptions while allowing callers to override defaults. */
export const createPmCalculationAssumptions = (
  beta1: number,
  overrides: Partial<
    Omit<PmCalculationAssumptions, "beta1">
  > = {},
): PmCalculationAssumptions => ({
  ...DEFAULT_ACI_PMA_ASSUMPTIONS,
  ...overrides,
  beta1,
});

const validatePositiveFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
};

const validateLayer = (
  layer: ReinforcementLayer,
  index: number,
  sectionDepth?: number,
): void => {
  validatePositiveFinite(`layers[${index}].area`, layer.area);

  if (
    !Number.isFinite(layer.depthFromCompressionFace) ||
    layer.depthFromCompressionFace < 0
  ) {
    throw new RangeError(
      `layers[${index}].depthFromCompressionFace must be a non-negative finite number.`,
    );
  }

  if (
    sectionDepth !== undefined &&
    layer.depthFromCompressionFace > sectionDepth
  ) {
    throw new RangeError(
      `layers[${index}].depthFromCompressionFace must be within the section depth.`,
    );
  }
};

/**
 * Resolves aggregate steel area and area-weighted centroid depth. This helper
 * intentionally knows no section bounds or P-M equations.
 */
export const calculateAreaWeightedDepth = (
  layers: readonly ReinforcementLayer[],
): ResolvedSteel => {
  if (layers.length === 0) {
    throw new RangeError("At least one reinforcement layer is required.");
  }

  let area = 0;
  let firstMoment = 0;

  layers.forEach((layer, index) => {
    validateLayer(layer, index);
    area += layer.area;
    firstMoment += layer.area * layer.depthFromCompressionFace;
  });

  return {
    area,
    depthFromCompressionFace: firstMoment / area,
  };
};

/**
 * Resolves one designated steel group and optionally validates its location
 * against the overall section depth.
 */
export const resolveSteelGroup = (
  layers: readonly ReinforcementLayer[],
  sectionDepth?: number,
): ResolvedSteel => {
  if (sectionDepth !== undefined) {
    validatePositiveFinite("sectionDepth", sectionDepth);
  }

  layers.forEach((layer, index) => validateLayer(layer, index, sectionDepth));
  return calculateAreaWeightedDepth(layers);
};

/**
 * Resolves caller-designated tension and optional compression layer groups.
 * It does not infer stress state from a neutral-axis position.
 */
export const resolveReinforcement = (
  groups: ReinforcementGroups,
): ResolvedReinforcement => {
  const tensionSteel = resolveSteelGroup(
    groups.tensionLayers,
    groups.sectionDepth,
  );
  const compressionSteel =
    groups.compressionLayers === undefined || groups.compressionLayers.length === 0
      ? undefined
      : resolveSteelGroup(groups.compressionLayers, groups.sectionDepth);

  return {
    tensionSteel,
    ...(compressionSteel === undefined ? {} : { compressionSteel }),
  };
};
