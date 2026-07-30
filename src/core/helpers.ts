import type { PmCapacityInput, ResolvedSteel } from "./interfaces.ts";

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
