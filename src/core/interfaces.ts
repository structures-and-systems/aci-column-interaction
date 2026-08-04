import type {
  CapacityComponentName,
  CapacityComponents,
} from "./types.ts";

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
export interface CalculationAssumptions {
  /** Ultimate compression-face concrete strain; compression is positive. */
  readonly ultimateConcreteStrain: number;
  /** Multiplier from neutral-axis depth to equivalent block depth. */
  readonly beta1: number;
  /** Multiplier applied to specified concrete compressive strength. */
  readonly rectangularCompressionStressCoefficient: number;
  /** ACI Max axial strength factor. */
  readonly axialStrengthCapFactor?: number;
}

/** All data required to calculate one nominal P-M capacity point. */
export interface CapacityInput {
  readonly section: RectangularSection;
  readonly neutralAxisDepth: number;
  readonly concrete: ConcreteMaterial;
  readonly steel: SteelMaterial;
  readonly assumptions: CalculationAssumptions;
  readonly tensionSteel: ResolvedSteel;
  readonly compressionSteel?: ResolvedSteel | null;
}

/** One signed force component resolved at a compression-face depth. */
export interface CapacityComponent {
  readonly name: CapacityComponentName;
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
export interface CapacityPoint {
  readonly neutralAxisDepth: number;
  /** Signed nominal axial capacity: compression positive. */
  readonly nominalAxialStrength: number;
  /** Signed nominal moment about the section centroid. */
  readonly nominalMoment: number;
  readonly components: CapacityComponents;
}

// Output for validation tests agains the spreadsheet
export interface UltimatePMState {
  neutralAxisDepth: number;
  axialForce: number;
  moment: number;
}