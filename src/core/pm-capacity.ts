/**
 * Engineering calculations for one rectangular reinforced-concrete section
 * evaluated at one neutral-axis depth.
 *
 * Callers must use a consistent compatible unit system. For example, MPa with
 * mm produces N for force and N-mm for moment.
 *
 * Depths are measured from the compression face. Compression force and strain
 * are positive; tension force and strain are negative. Positive moment
 * compresses the declared compression face.
 */

/** Rectangular section geometry in the caller's length unit. */
export interface RectangularSection {
  /** Section width perpendicular to bending. */
  readonly width: number;
  /** Total depth from compression face to opposite face. */
  readonly depth: number;
}

/** Concrete material stress in the caller's compatible stress unit. */
export interface ConcreteMaterial {
  /** Specified concrete compressive strength. */
  readonly compressiveStrength: number;
}

/** Steel material properties in the caller's compatible stress unit. */
export interface SteelMaterial {
  /** Steel yield stress magnitude. */
  readonly yieldStrength: number;
  /** Steel elastic modulus. */
  readonly elasticModulus: number;
}

/**
 * Aggregate longitudinal steel resolved before calling this core.
 *
 * `depthFromCompressionFace` is the area-weighted centroid depth. The core
 * does not interpret individual bars or physical reinforcement layouts.
 */
export interface ResolvedSteel {
  readonly area: number;
  readonly depthFromCompressionFace: number;
}

/** Explicit assumptions for the rectangular concrete stress block. */
export interface PmCalculationAssumptions {
  /** Ultimate compression-face concrete strain; compression is positive. */
  readonly ultimateConcreteStrain: number;
  /** Multiplier from neutral-axis depth to equivalent block depth. */
  readonly beta1: number;
  /** Multiplier applied to specified concrete compressive strength. */
  readonly rectangularCompressionStressCoefficient: number;
}

/** All data required to calculate one nominal P-M capacity point. */
export interface PmCapacityInput {
  readonly section: RectangularSection;
  readonly neutralAxisDepth: number;
  readonly concrete: ConcreteMaterial;
  readonly steel: SteelMaterial;
  readonly assumptions: PmCalculationAssumptions;
  readonly tensionSteel: ResolvedSteel;
  readonly compressionSteel?: ResolvedSteel;
}

/** One signed force component resolved at a compression-face depth. */
export interface CapacityComponent {
  readonly name: "concrete" | "tensionSteel" | "compressionSteel";
  /** Signed axial force: compression positive, tension negative. */
  readonly force: number;
  /** Component resultant location from the compression face. */
  readonly depthFromCompressionFace: number;
  /** Signed moment about the section centroid. */
  readonly momentAboutSectionCentroid: number;
  /** Steel strain; omitted for the uniform concrete block. */
  readonly strain?: number;
  /** Steel stress; omitted for the uniform concrete block. */
  readonly stress?: number;
}

/** The equivalent rectangular concrete compression block. */
export interface ConcreteCompressionBlock {
  /** Physical block depth, limited by the section depth. */
  readonly depth: number;
  /** Compression resultant magnitude. */
  readonly force: number;
  /** Resultant depth from the compression face. */
  readonly centroidDepthFromCompressionFace: number;
}

/** Nominal section capacity at one supplied neutral-axis depth. */
export interface PmCapacityPoint {
  readonly neutralAxisDepth: number;
  /** Signed nominal axial capacity: compression positive. */
  readonly nominalAxialForce: number;
  /** Signed nominal moment about the section centroid. */
  readonly nominalMoment: number;
  readonly components: {
    readonly concrete: CapacityComponent;
    readonly tensionSteel: CapacityComponent;
    readonly compressionSteel?: CapacityComponent;
  };
}

const isPositiveFinite = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const validatePositiveFinite = (name: string, value: number): void => {
  if (!isPositiveFinite(value)) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
};

const validateSteelDepth = (
  name: string,
  steel: ResolvedSteel,
  sectionDepth: number,
): void => {
  validatePositiveFinite(`${name}.area`, steel.area);

  if (
    !Number.isFinite(steel.depthFromCompressionFace) ||
    steel.depthFromCompressionFace < 0 ||
    steel.depthFromCompressionFace > sectionDepth
  ) {
    throw new RangeError(
      `${name}.depthFromCompressionFace must be within the section depth.`,
    );
  }
};

/** Validates all public calculation inputs before force equilibrium is evaluated. */
export const validatePmCapacityInput = (input: PmCapacityInput): void => {
  validatePositiveFinite("section.width", input.section.width);
  validatePositiveFinite("section.depth", input.section.depth);
  validatePositiveFinite("neutralAxisDepth", input.neutralAxisDepth);
  validatePositiveFinite(
    "concrete.compressiveStrength",
    input.concrete.compressiveStrength,
  );
  validatePositiveFinite("steel.yieldStrength", input.steel.yieldStrength);
  validatePositiveFinite("steel.elasticModulus", input.steel.elasticModulus);
  validatePositiveFinite(
    "assumptions.ultimateConcreteStrain",
    input.assumptions.ultimateConcreteStrain,
  );
  validatePositiveFinite("assumptions.beta1", input.assumptions.beta1);
  validatePositiveFinite(
    "assumptions.rectangularCompressionStressCoefficient",
    input.assumptions.rectangularCompressionStressCoefficient,
  );
  validateSteelDepth("tensionSteel", input.tensionSteel, input.section.depth);

  if (input.compressionSteel !== undefined) {
    validateSteelDepth(
      "compressionSteel",
      input.compressionSteel,
      input.section.depth,
    );
  }
};

/**
 * Returns signed strain at a depth based on a linear distribution.
 * Positive strain is compression and negative strain is tension.
 */
export const calculateSteelStrain = (
  ultimateConcreteStrain: number,
  neutralAxisDepth: number,
  depthFromCompressionFace: number,
): number =>
  ultimateConcreteStrain *
  (1 - depthFromCompressionFace / neutralAxisDepth);

/** Converts signed steel strain to signed elastic stress. */
export const calculateSteelStress = (
  steelStrain: number,
  elasticModulus: number,
): number => steelStrain * elasticModulus;

/** Caps signed elastic steel stress at the positive and negative yield limits. */
export const calculateSteelStressWithYieldCap = (
  steelStrain: number,
  elasticModulus: number,
  yieldStrength: number,
): number => {
  const elasticStress = calculateSteelStress(steelStrain, elasticModulus);
  return Math.max(-yieldStrength, Math.min(yieldStrength, elasticStress));
};

/**
 * Calculates the equivalent rectangular concrete compression block. The block
 * cannot extend past the physical section even when beta1*c does.
 */
export const calculateConcreteCompressionBlock = (
  section: RectangularSection,
  concrete: ConcreteMaterial,
  assumptions: PmCalculationAssumptions,
  neutralAxisDepth: number,
): ConcreteCompressionBlock => {
  const depth = Math.min(assumptions.beta1 * neutralAxisDepth, section.depth);
  const force =
    assumptions.rectangularCompressionStressCoefficient *
    concrete.compressiveStrength *
    section.width *
    depth;

  return {
    depth,
    force,
    centroidDepthFromCompressionFace: depth / 2,
  };
};

const calculateMomentAboutSectionCentroid = (
  force: number,
  depthFromCompressionFace: number,
  sectionDepth: number,
): number => force * (sectionDepth / 2 - depthFromCompressionFace);

const calculateSteelComponent = (
  name: "tensionSteel" | "compressionSteel",
  resolvedSteel: ResolvedSteel,
  input: PmCapacityInput,
  concreteBlock: ConcreteCompressionBlock,
): CapacityComponent => {
  const strain = calculateSteelStrain(
    input.assumptions.ultimateConcreteStrain,
    input.neutralAxisDepth,
    resolvedSteel.depthFromCompressionFace,
  );
  const stress = calculateSteelStressWithYieldCap(
    strain,
    input.steel.elasticModulus,
    input.steel.yieldStrength,
  );
  const displacedConcreteStress =
    resolvedSteel.depthFromCompressionFace < concreteBlock.depth
      ? input.assumptions.rectangularCompressionStressCoefficient *
        input.concrete.compressiveStrength
      : 0;
  const force = (stress - displacedConcreteStress) * resolvedSteel.area;

  return {
    name,
    force,
    depthFromCompressionFace: resolvedSteel.depthFromCompressionFace,
    momentAboutSectionCentroid: calculateMomentAboutSectionCentroid(
      force,
      resolvedSteel.depthFromCompressionFace,
      input.section.depth,
    ),
    strain,
    stress,
  };
};

/**
 * Calculates one nominal P-M capacity point for a rectangular section.
 *
 * The caller must have resolved reinforcement layout into aggregate steel
 * groups before invoking this function.
 */
export const calculatePmCapacityPoint = (
  input: PmCapacityInput,
): PmCapacityPoint => {
  validatePmCapacityInput(input);

  const concreteBlock = calculateConcreteCompressionBlock(
    input.section,
    input.concrete,
    input.assumptions,
    input.neutralAxisDepth,
  );
  const concrete: CapacityComponent = {
    name: "concrete",
    force: concreteBlock.force,
    depthFromCompressionFace: concreteBlock.centroidDepthFromCompressionFace,
    momentAboutSectionCentroid: calculateMomentAboutSectionCentroid(
      concreteBlock.force,
      concreteBlock.centroidDepthFromCompressionFace,
      input.section.depth,
    ),
  };
  const tensionSteel = calculateSteelComponent(
    "tensionSteel",
    input.tensionSteel,
    input,
    concreteBlock,
  );
  const compressionSteel =
    input.compressionSteel === undefined
      ? undefined
      : calculateSteelComponent(
          "compressionSteel",
          input.compressionSteel,
          input,
          concreteBlock,
        );
  const nominalAxialForce =
    concrete.force + tensionSteel.force + (compressionSteel?.force ?? 0);
  const nominalMoment =
    concrete.momentAboutSectionCentroid +
    tensionSteel.momentAboutSectionCentroid +
    (compressionSteel?.momentAboutSectionCentroid ?? 0);

  return {
    neutralAxisDepth: input.neutralAxisDepth,
    nominalAxialForce,
    nominalMoment,
    components: {
      concrete,
      tensionSteel,
      ...(compressionSteel === undefined ? {} : { compressionSteel }),
    },
  };
};
