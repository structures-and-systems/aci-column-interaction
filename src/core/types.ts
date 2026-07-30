/** Supported component names in a nominal P-M capacity breakdown. */
export type CapacityComponentName =
  | "concrete"
  | "tensionSteel"
  | "compressionSteel";

/** Component breakdown returned with a nominal P-M capacity point. */
export type PmCapacityComponents = {
  readonly concrete: import("./interfaces.ts").CapacityComponent;
  readonly tensionSteel: import("./interfaces.ts").CapacityComponent;
  readonly compressionSteel?: import("./interfaces.ts").CapacityComponent;
};