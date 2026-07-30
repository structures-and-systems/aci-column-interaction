import {
  calculatePmCapacityPoint,
  type PmCapacityInput,
  type PmCapacityPoint,
} from "../core/index.ts";
import {
  resolveReinforcement,
  type ReinforcementGroups,
} from "../reinforcement/resolution.ts";

/** Complete core input excluding the neutral-axis depth for diagram iteration. */
export type PmCapacityBaseInput = Omit<PmCapacityInput, "neutralAxisDepth">;

/**
 * Single-point input that accepts physical layers instead of pre-resolved
 * steel. Layer depths are validated against `section.depth`; the adapter
 * derives this bound from the section and does not accept a separate one.
 */
export interface LayerBasedPmCapacityInput
  extends Omit<PmCapacityInput, "tensionSteel" | "compressionSteel"> {
  readonly reinforcement: Omit<ReinforcementGroups, "sectionDepth">;
}

const validateNeutralAxisDepths = (
  neutralAxisDepths: readonly number[],
): void => {
  if (neutralAxisDepths.length === 0) {
    throw new RangeError("At least one neutral-axis depth is required.");
  }

  neutralAxisDepths.forEach((neutralAxisDepth, index) => {
    if (!Number.isFinite(neutralAxisDepth) || neutralAxisDepth <= 0) {
      throw new RangeError(
        `neutralAxisDepths[${index}] must be a positive finite number.`,
      );
    }
  });
};

/**
 * Resolves caller-designated layer groups and delegates one state to the
 * single-point core. It does not alter material or calculation assumptions,
 * and always derives layer bounds from the supplied section.
 */
export const calculatePmCapacityPointFromLayers = (
  input: LayerBasedPmCapacityInput,
): PmCapacityPoint => {
  const { reinforcement, ...capacityInput } = input;
  const resolvedReinforcement = resolveReinforcement({
    ...reinforcement,
    sectionDepth: capacityInput.section.depth,
  });

  return calculatePmCapacityPoint({
    ...capacityInput,
    ...resolvedReinforcement,
  });
};

/**
 * Evaluates an ordered caller-provided collection of neutral-axis depths.
 *
 * This adapter deliberately preserves the input order and does not select,
 * sort, extend, or deduplicate depths. Those are client policies.
 */
export const calculateInteractionDiagram = (
  baseInput: PmCapacityBaseInput,
  neutralAxisDepths: readonly number[],
): readonly PmCapacityPoint[] => {
  validateNeutralAxisDepths(neutralAxisDepths);

  return neutralAxisDepths.map((neutralAxisDepth) =>
    calculatePmCapacityPoint({
      ...baseInput,
      neutralAxisDepth,
    }),
  );
};
