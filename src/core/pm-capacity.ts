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

import type {
  CapacityComponent,
  ConcreteCompressionBlock,
  ConcreteMaterial,
  CapacityInput,
  CapacityPoint,
  CalculationAssumptions,
  RectangularSection,
  ResolvedSteel,
  SteelMaterial,
} from "./interfaces.ts";
import type { CapacityComponents } from "./types.ts";
import { validatePmCapacityInput } from "./helpers.ts";

/**
 * Returns signed strain at a depth based on a linear distribution.
 * Positive strain is compression and negative strain is tension.
 */
export const steelStrain = (
  ultimateConcreteStrain: number,
  neutralAxisDepth: number,
  depthFromCompressionFace: number,
): number =>
  ultimateConcreteStrain *
  (1 - depthFromCompressionFace / neutralAxisDepth);

/** Converts signed steel strain to signed elastic stress. */
export const steelStress = (
  steelStrain: number,
  elasticModulus: number,
): number => steelStrain * elasticModulus;

/** Caps signed elastic steel stress at the positive and negative yield limits. */
export const steelStressWithYieldCap = (
  steelStrain: number,
  elasticModulus: number,
  yieldStrength: number,
): number => {
  const elasticStress = steelStress(steelStrain, elasticModulus);
  return Math.max(-yieldStrength, Math.min(yieldStrength, elasticStress));
};

/**
 * Calculates the equivalent rectangular concrete compression block. The block
 * cannot extend past the physical section even when beta1*c does.
 */
export const concreteCompressionBlock = (
  section: RectangularSection,
  concrete: ConcreteMaterial,
  assumptions: CalculationAssumptions,
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

export const netConcreteCompression = (
  compressionForce: number,
  compressionSteel: ResolvedSteel,
  assumptions: CalculationAssumptions,
  concrete: ConcreteMaterial
) => {
  const { rectangularCompressionStressCoefficient } = assumptions;
  const { compressiveStrength } = concrete;
  return compressionForce - (compressionSteel.area * compressiveStrength * rectangularCompressionStressCoefficient);
}

export const steelComponent = (
  name: "tensionSteel" | "compressionSteel",
  resolvedSteel: ResolvedSteel,
  input: CapacityInput
): CapacityComponent => {
  const strain = steelStrain(
    input.assumptions.ultimateConcreteStrain,
    input.neutralAxisDepth,
    resolvedSteel.depthFromCompressionFace,
  );
  const stress = steelStressWithYieldCap(
    strain,
    input.steel.elasticModulus,
    input.steel.yieldStrength,
  );
  const force = stress * resolvedSteel.area;

  return {
    name,
    force,
    depthFromCompressionFace: resolvedSteel.depthFromCompressionFace,
    momentAboutSectionCentroid: momentAboutSectionCentroid(
      force,
      resolvedSteel.depthFromCompressionFace,
      input.section.depth,
    ),
    strain,
    stress,
  };
};

export const nominalAxialStrength = (components: CapacityComponents): number => {
  const { concrete, tensionSteel, compressionSteel } = components;
  return concrete.force + tensionSteel.force + (compressionSteel?.force ?? 0);
};

export const momentAboutSectionCentroid = (
  force: number,
  depthFromCompressionFace: number,
  sectionDepth: number,
): number => force * (sectionDepth / 2 - depthFromCompressionFace);


/**
 * Calculates one nominal P-M capacity point for a rectangular section.
 *
 * The caller must have resolved reinforcement layout into aggregate steel
 * groups before invoking this function.
 */
export const capacityPoint = (
  input: CapacityInput,
): CapacityPoint => {
  validatePmCapacityInput(input);
  const { assumptions, concrete, neutralAxisDepth, section, steel, tensionSteel, compressionSteel } = input;

  const concreteBlock: ConcreteCompressionBlock = concreteCompressionBlock(
    section,
    concrete,
    assumptions,
    neutralAxisDepth,
  );

  let concreteForce: number = concreteBlock.force;
  let compressionSteelComponent: CapacityComponent | null = null;

  if (compressionSteel) {
    compressionSteelComponent = steelComponent(
      "compressionSteel",
      compressionSteel,
      input
    );
    // update concrete force to account for compression steel contribution
    concreteForce = netConcreteCompression(concreteForce, compressionSteel, assumptions, concrete);
  }

  const concreteComponent: CapacityComponent = {
    name: "concrete",
    force: concreteForce,
    depthFromCompressionFace: concreteBlock.centroidDepthFromCompressionFace,
    momentAboutSectionCentroid: momentAboutSectionCentroid(
      concreteForce,
      concreteBlock.centroidDepthFromCompressionFace,
      input.section.depth,
    ),
  };
  const tensionSteelComponent: CapacityComponent = steelComponent("tensionSteel", tensionSteel, input);

  const pn = nominalAxialStrength({
    concrete: concreteComponent,
    tensionSteel: tensionSteelComponent,
    compressionSteel: compressionSteelComponent,
  });
  const mn =
    concreteComponent.momentAboutSectionCentroid +
    tensionSteelComponent.momentAboutSectionCentroid +
    (compressionSteelComponent!.momentAboutSectionCentroid ?? 0);

  return {
    neutralAxisDepth,
    nominalAxialStrength: pn * (assumptions.axialStrengthCapFactor ?? 1),
    nominalMoment: mn,
    components: {
      concrete: concreteComponent,
      tensionSteel: tensionSteelComponent,
      ...(compressionSteelComponent === null ? {} : { compressionSteel: compressionSteelComponent }),
    },
  };
};
